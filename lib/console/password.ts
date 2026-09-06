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
 * What a staff password has to clear.
 *
 * Length over character classes: a 12-character passphrase beats
 * "Passw0rd!" and people actually remember it. These accounts open the
 * books and the panic desk, so 12 is the floor rather than the usual 8.
 */
export function checkPasswordStrength(password: string): string | null {
  if (password.length < 12) {
    return "Use at least 12 characters — a short phrase is fine and easier to remember.";
  }
  if (password.length > 200) {
    return "That password is too long.";
  }
  if (/^(.)\1+$/.test(password)) {
    return "That's the same character repeated. Pick something else.";
  }
  return null;
}
