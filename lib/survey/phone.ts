/**
 * Canonical Nigerian mobile format (+2348130817091).
 *
 * Strips leading zeros, trunk prefixes, punctuation and formats into E.164 (+234XXXXXXXXXX).
 * Handles multiple numbers separated by slashes, commas, or semicolons.
 */
export function formatContactPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/[\/,;\n]+/).map((p) => p.trim()).filter(Boolean);
  const formattedParts: string[] = [];

  for (const part of parts) {
    const cleaned = part.replace(/^[*]/, "+").trim();
    const digits = cleaned.replace(/\D/g, "");
    if (!digits) continue;

    if (digits.startsWith("234")) {
      let rest = digits.slice(3);
      if (rest.startsWith("0")) rest = rest.slice(1);
      formattedParts.push(`+234${rest}`);
    } else if (digits.startsWith("0")) {
      const noZero = digits.replace(/^0+/, "");
      formattedParts.push(`+234${noZero}`);
    } else if (digits.length === 10 && /^[789]/.test(digits)) {
      formattedParts.push(`+234${digits}`);
    } else if (cleaned.startsWith("+")) {
      formattedParts.push(`+${digits}`);
    } else {
      formattedParts.push(`+234${digits}`);
    }
  }

  return formattedParts.length > 0 ? formattedParts.join(", ") : null;
}
