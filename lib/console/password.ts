import "server-only";

import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/** Hand-rolled rather than `promisify`, whose typing drops the options
 * overload and would silently lose the cost parameters. */
function scrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (err, key) =>
      err ? reject(err) : resolve(key as Buffer)
    );
  });
}

/**
 * Password hashing for console staff.
 *
 * scrypt from Node's own crypto rather than bcrypt or argon2: those are
 * native addons, and this codebase deploys to Vercel where a native build
 * is one more thing that can break a release. scrypt is memory-hard, which
 * is the property that matters against a stolen hash, and it is already in
 * the runtime.
 *
 * The cost parameters are stored in the hash string, so raising them later
 * doesn't invalidate existing passwords — an old hash still verifies with
 * the parameters it was made with, and can be re-hashed on next login.
 */

const N = 16384; // CPU/memory cost. ~100ms per hash on the box this runs on.
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
    // Node's default maxmem is too small for N=16384; without this it throws.
    maxmem: 64 * 1024 * 1024,
  });

  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string | null
): Promise<boolean> {
  if (!stored) return false;

  const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(keyB64, "base64");

  let candidate: Buffer;
  try {
    candidate = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 256 * 1024 * 1024,
    });
  } catch {
    return false;
  }

  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/**
 * What a password has to clear.
 *
 * Length over character classes: a long passphrase beats "Passw0rd!" and
 * people actually remember it.
 *
 * The floor is the caller's to set, because not every account is worth the
 * same. Console staff open the books and the panic desk, so they get 12
 * rather than the usual 8. The team ledger is a write-up of somebody's own
 * work, and the worst a stolen password there can do is post a claim a
 * reviewer then has to approve — a lower floor is the right trade when the
 * alternative is people not bothering to sign up at all.
 *
 * The default is the STRICT one on purpose: a new caller that forgets to
 * think about this gets the safe answer, and anything weaker has to be
 * asked for in writing at the call site.
 */
export const STAFF_MIN_PASSWORD_LENGTH = 12;

export function checkPasswordStrength(
  password: string,
  minLength: number = STAFF_MIN_PASSWORD_LENGTH
): string | null {
  if (password.length < minLength) {
    return `Use at least ${minLength} characters — a phrase you'll remember beats a scramble you'll write down.`;
  }
  if (password.length > 200) {
    return "That password is too long.";
  }
  if (/^(.)\1+$/.test(password)) {
    return "That's the same character repeated. Pick something else.";
  }
  return null;
}
