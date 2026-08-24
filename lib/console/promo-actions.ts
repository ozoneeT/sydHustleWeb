"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { audienceSchema, type AudienceFilters } from "@/lib/console/audience";
import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PromoActionState = { error: string | null; done: boolean };

// Artwork upload lives in app/console/api/promo-art/route.ts — a
// server action there would re-render the page and collapse the form
// mid-edit.



const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.null(), z.undefined()])
  .transform((v) => v === "on" || v === "true");

/**
 * A CTA is either an in-app route or an https link, and nothing else.
 *
 * The app ignores anything that is neither, so accepting it here would
 * store a button that silently does nothing. `javascript:` and friends
 * are refused for the obvious reason — this field is free text that
 * ends up driving navigation on someone's phone.
 */
const ctaUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => v === "" || v.startsWith("/") || v.startsWith("https://"),
    "Link must start with / for an in-app screen, or https://",
  );

const hexColour = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Colours must be a 6-digit hex like #0F2E2E");

const bannerSchema = z.object({
  kind: z.enum(["custom", "featured"]),
  eyebrow: z.string().trim().max(60).optional(),
  title: z.string().trim().max(120).optional(),
  subtitle: z.string().trim().max(200).optional(),
  image_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || v.startsWith("https://"), "Image must be https://")
    .optional(),
  cta_label: z.string().trim().max(40).optional(),
  cta_url: ctaUrl.optional(),
  featured_count: z.coerce.number().int().min(1).max(20),
  rotate_minutes: z.coerce.number().int().min(1).max(1440),
  // Bounds mirror the CHECK constraints exactly, so a bad value is
  // rejected with a sentence here rather than a Postgres error there.
  image_mode: z.enum(["background", "side", "none"]),
  image_side: z.enum(["left", "right"]),
  image_scale: z.coerce.number().min(0.15).max(0.6),
  height: z.coerce.number().int().min(90).max(320),
  width_pct: z.coerce.number().int().min(60).max(100),
  background_mode: z.enum(["solid", "gradient"]),
  // #RRGGBB only, matching the CHECK constraint. Short hex and named
  // colours would have to be parsed by two renderers, and the first
  // thing to disagree about a colour format is what makes the preview
  // a liar.
  bg_light_from: hexColour,
  bg_light_to: hexColour,
  bg_dark_from: hexColour,
  bg_dark_to: hexColour,
  // Empty means "no icon"; anything else must be one the preview can
  // also draw, so it is checked here and by the CHECK constraint.
  icon: z.string().trim().max(40).optional(),
  // Bounds mirror the CHECK constraints, so a bad value is a sentence
  // here rather than a Postgres error there.
  image_zoom: z.coerce.number().min(1).max(3),
  image_focus_x: z.coerce.number().int().min(0).max(100),
  image_focus_y: z.coerce.number().int().min(0).max(100),
  art_pad_left: z.coerce.number().int().min(0).max(48),
  art_pad_right: z.coerce.number().int().min(0).max(48),
  // Type size per line, in points — the same numbers the app passes to
  // `fontSize`. Bounds mirror the CHECK constraints.
  eyebrow_size: z.coerce.number().int().min(8).max(24),
  title_size: z.coerce.number().int().min(12).max(40),
  subtitle_size: z.coerce.number().int().min(9).max(28),
  // Empty means "derive it from the background", which is both the
  // default and the thing that guarantees a pale card never gets white
  // text on it. A hex here is a deliberate override.
  // Bounds mirror the CHECK constraint. 1 = straight after the first
  // row; a slot deeper than the list simply waits for the list to grow.
  feed_slot: z.coerce.number().int().min(1).max(60),
  eyebrow_color: z.union([z.literal(""), hexColour]).optional(),
  title_color: z.union([z.literal(""), hexColour]).optional(),
  subtitle_color: z.union([z.literal(""), hexColour]).optional(),
  show_on_home: checkbox,
  show_on_skills: checkbox,
  show_on_hustles: checkbox,
  show_on_wallet: checkbox,
  show_on_messages: checkbox,
  is_active: checkbox,
  sort_order: z.coerce.number().int().min(1).max(999),
});

/**
 * Read one filter set out of the form.
 *
 * Travels as JSON for the same reason the broadcast's does: the shape is
 * nested and flattening it into form keys would mean encoding it in two
 * places free to disagree. `null` means "malformed", which the caller
 * rejects rather than coerces, because a silently-dropped exemption
 * shows a banner to the very people it was meant to spare.
 */
function parseAudience(raw: FormDataEntryValue | null): AudienceFilters | null {
  if (typeof raw !== "string" || raw.trim() === "") return {};
  try {
    const parsed = audienceSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function parse(formData: FormData) {
  return bannerSchema.safeParse({
    kind: formData.get("kind"),
    eyebrow: formData.get("eyebrow") ?? undefined,
    title: formData.get("title") ?? undefined,
    subtitle: formData.get("subtitle") ?? undefined,
    image_url: formData.get("image_url") ?? undefined,
    cta_label: formData.get("cta_label") ?? undefined,
    cta_url: formData.get("cta_url") ?? undefined,
    featured_count: formData.get("featured_count") ?? 6,
    rotate_minutes: formData.get("rotate_minutes") ?? 20,
    image_mode: formData.get("image_mode") ?? "background",
    image_side: formData.get("image_side") ?? "right",
    image_scale: formData.get("image_scale") ?? 0.36,
    height: formData.get("height") ?? 150,
    width_pct: formData.get("width_pct") ?? 100,
    background_mode: formData.get("background_mode") ?? "gradient",
    bg_light_from: formData.get("bg_light_from") ?? "#0F2E2E",
    bg_light_to: formData.get("bg_light_to") ?? "#081A1A",
    bg_dark_from: formData.get("bg_dark_from") ?? "#0F2E2E",
    bg_dark_to: formData.get("bg_dark_to") ?? "#081A1A",
    icon: formData.get("icon") ?? undefined,
    image_zoom: formData.get("image_zoom") ?? 1,
    image_focus_x: formData.get("image_focus_x") ?? 50,
    image_focus_y: formData.get("image_focus_y") ?? 50,
    art_pad_left: formData.get("art_pad_left") ?? 10,
    art_pad_right: formData.get("art_pad_right") ?? 10,
    eyebrow_size: formData.get("eyebrow_size") ?? 10,
    title_size: formData.get("title_size") ?? 19,
    subtitle_size: formData.get("subtitle_size") ?? 13,
    feed_slot: formData.get("feed_slot") ?? 4,
    eyebrow_color: formData.get("eyebrow_color") ?? undefined,
    title_color: formData.get("title_color") ?? undefined,
    subtitle_color: formData.get("subtitle_color") ?? undefined,
    show_on_home: formData.get("show_on_home"),
    show_on_skills: formData.get("show_on_skills"),
    show_on_hustles: formData.get("show_on_hustles"),
    show_on_wallet: formData.get("show_on_wallet"),
    show_on_messages: formData.get("show_on_messages"),
    is_active: formData.get("is_active"),
    sort_order: formData.get("sort_order") ?? 100,
  });
}

/** Empty strings become nulls, so an unfilled field is absent rather
 * than a blank line rendered in the app. */
function nullify(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

export async function savePromoBanner(
  _prev: PromoActionState,
  formData: FormData,
): Promise<PromoActionState> {
  await requireConsole();

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the fields and try again.",
      done: false,
    };
  }
  const v = parsed.data;

  if (v.kind === "custom" && !nullify(v.title)) {
    return { error: "A custom banner needs a headline.", done: false };
  }

  const audience = parseAudience(formData.get("audience"));
  const exclude = parseAudience(formData.get("exclude"));
  if (!audience || !exclude) {
    return { error: "That audience isn't valid. Reset it and try again.", done: false };
  }

  const row = {
    kind: v.kind,
    eyebrow: nullify(v.eyebrow),
    title: nullify(v.title),
    subtitle: nullify(v.subtitle),
    image_url: nullify(v.image_url),
    cta_label: nullify(v.cta_label),
    cta_url: nullify(v.cta_url),
    featured_count: v.featured_count,
    rotate_minutes: v.rotate_minutes,
    image_mode: v.image_mode,
    image_side: v.image_side,
    image_scale: v.image_scale,
    height: v.height,
    width_pct: v.width_pct,
    background_mode: v.background_mode,
    bg_light_from: v.bg_light_from,
    bg_light_to: v.bg_light_to,
    bg_dark_from: v.bg_dark_from,
    bg_dark_to: v.bg_dark_to,
    icon: nullify(v.icon),
    image_zoom: v.image_zoom,
    image_focus_x: v.image_focus_x,
    image_focus_y: v.image_focus_y,
    art_pad_left: v.art_pad_left,
    art_pad_right: v.art_pad_right,
    eyebrow_size: v.eyebrow_size,
    title_size: v.title_size,
    subtitle_size: v.subtitle_size,
    feed_slot: v.feed_slot,
    eyebrow_color: nullify(v.eyebrow_color),
    title_color: nullify(v.title_color),
    subtitle_color: nullify(v.subtitle_color),
    show_on_home: v.show_on_home,
    show_on_skills: v.show_on_skills,
    show_on_hustles: v.show_on_hustles,
    show_on_wallet: v.show_on_wallet,
    show_on_messages: v.show_on_messages,
    is_active: v.is_active,
    audience,
    exclude,
    sort_order: v.sort_order,
  };

  const supabase = createServerSupabaseClient();
  const id = formData.get("id");

  const { error } =
    typeof id === "string" && id.length > 0
      ? await supabase.from("promo_banners").update(row).eq("id", id)
      : await supabase.from("promo_banners").insert(row);

  if (error) return { error: error.message, done: false };

  revalidatePath("/console/promos");
  return { error: null, done: true };
}

export async function deletePromoBanner(
  _prev: PromoActionState,
  formData: FormData,
): Promise<PromoActionState> {
  await requireConsole();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "That banner isn't valid.", done: false };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("promo_banners")
    .delete()
    .eq("id", id.data);
  if (error) return { error: error.message, done: false };

  revalidatePath("/console/promos");
  return { error: null, done: true };
}

/** The switch that takes a banner off every surface at once, without
 * losing its copy — the thing you actually want at 2am. */
export async function togglePromoBanner(
  _prev: PromoActionState,
  formData: FormData,
): Promise<PromoActionState> {
  await requireConsole();

  const parsed = z
    .object({ id: z.string().uuid(), active: z.enum(["true", "false"]) })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) return { error: "That banner isn't valid.", done: false };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("promo_banners")
    .update({ is_active: parsed.data.active === "true" })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message, done: false };

  revalidatePath("/console/promos");
  return { error: null, done: true };
}
