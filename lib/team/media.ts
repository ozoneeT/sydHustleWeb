/**
 * The rules for evidence attached to a contribution.
 *
 * Shared by the browser and the server on purpose. The client uses them to
 * reject a file before a 20MB upload starts; the server uses the same
 * numbers to decide whether to hand out an upload URL at all, because the
 * client half runs on the claimant's machine and proves nothing.
 */

export const MAX_MEDIA_PER_CONTRIBUTION = 6;
/** A screen recording of a flow working is the big one, and 25MB covers a
 * minute of it. Anything longer belongs in a link in the write-up. */
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MEDIA_PREFIXES = ["image/", "video/", "audio/"] as const;
export const ALLOWED_MEDIA_TYPES = ["application/pdf"] as const;

export function isAllowedMediaType(mime: string): boolean {
  const type = mime.toLowerCase();
  return (
    ALLOWED_MEDIA_PREFIXES.some((prefix) => type.startsWith(prefix)) ||
    (ALLOWED_MEDIA_TYPES as readonly string[]).includes(type)
  );
}

/** What the file picker offers, kept in step with what the server accepts. */
export const MEDIA_ACCEPT_ATTRIBUTE = "image/*,video/*,audio/*,application/pdf";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The kinds of work worth telling apart when this is read back later. */
export const CONTRIBUTION_CATEGORIES = [
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "content", label: "Content & copy" },
  { value: "marketing", label: "Marketing & growth" },
  { value: "research", label: "Research & testing" },
  { value: "operations", label: "Operations & admin" },
  { value: "outreach", label: "Outreach & partnerships" },
  { value: "other", label: "Something else" },
] as const;

export function categoryLabel(value: string): string {
  return (
    CONTRIBUTION_CATEGORIES.find((entry) => entry.value === value)?.label ?? value
  );
}
