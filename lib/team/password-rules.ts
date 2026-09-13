/**
 * The team ledger's password floor, in a file the browser can import.
 *
 * The check itself lives in lib/console/password.ts, which is
 * `server-only` — so the signup form cannot import it to tell somebody
 * their password is too short before they submit. Rather than write the
 * number down twice and let the two drift, it lives here and both sides
 * read it.
 *
 * Seven rather than the console's twelve. These accounts hold a record of
 * somebody's own work, not money or user data, and every claim posted with
 * one still has to be approved by a person before it counts for anything.
 * A floor high enough that people give up before signing up leaves no
 * record at all, which is the worse failure.
 */
export const TEAM_MIN_PASSWORD_LENGTH = 7;
