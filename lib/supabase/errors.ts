/**
 * Turning a Supabase error into something a person can read.
 *
 * `console.error("...", error)` looks like it does this and doesn't. A
 * PostgrestError reaches Next's dev overlay through a structured
 * serialiser that renders it as `{}` — so a one-line fix ("column
 * team_contributions.settlement_requested_at does not exist", i.e. run the
 * migration) arrives as a blank object and a call stack, and the actual
 * answer never appears anywhere.
 *
 * Formatting it into a string first survives every log sink: the terminal,
 * the overlay, and whatever Vercel does with it in production.
 */
export function describeSupabaseError(error: unknown): string {
  if (!error) return "unknown error";
  if (typeof error === "string") return error;

  const { code, message, details, hint } = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  const parts = [
    typeof code === "string" && code ? `[${code}]` : null,
    typeof message === "string" && message ? message : null,
    typeof details === "string" && details ? `— ${details}` : null,
    typeof hint === "string" && hint ? `(hint: ${hint})` : null,
  ].filter(Boolean);

  // Nothing recognisable: better a JSON blob than a silent `{}`.
  if (parts.length === 0) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return parts.join(" ");
}
