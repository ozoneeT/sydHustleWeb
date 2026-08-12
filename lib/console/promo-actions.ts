"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PromoActionState = { error: string | null; done: boolean };

/** What the bucket accepts, and how big. A banner is drawn at most a
 * phone-width wide, so anything past a couple of megabytes is a photo
 * nobody downsized before uploading. */
const MAX_ART_BYTES = 4 * 1024 * 1024;
const ART_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload artwork from the operator's machine and return its public URL.
 *
 * Goes through the service-role client, because `promo-art` has no
 * insert policy at all — this bucket feeds a surface every user sees,
 * so upload rights belong to the console rather than to anybody holding
 * a session.
 */
export async function uploadPromoArt(
  _prev: PromoUploadState,
  formData: FormData,
): Promise<PromoUploadState> {
  await requireConsole();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first.", url: null };
  }
  if (!ART_TYPES.includes(file.type)) {
    return { error: "JPEG, PNG or WebP only.", url: null };
  }
  if (file.size > MAX_ART_BYTES) {
    return { error: "That image is over 4MB — resize it first.", url: null };
  }

  const supabase = createServerSupabaseClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  // Random name, not the original: two operators uploading `banner.jpg`
  // must not overwrite each other, and the filename off someone's
  // desktop is not something to put in a public URL.
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("promo-art")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: error.message, url: null };

  const { data } = supabase.storage.from("promo-art").getPublicUrl(path);
  return { error: null, url: data.publicUrl };
}

export type PromoUploadState = { error: string | null; url: string | null };


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
  show_on_home: checkbox,
  show_on_skills: checkbox,
  show_on_hustles: checkbox,
  show_on_wallet: checkbox,
  show_on_messages: checkbox,
  is_active: checkbox,
  sort_order: z.coerce.number().int().min(1).max(999),
});

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
    show_on_home: v.show_on_home,
    show_on_skills: v.show_on_skills,
    show_on_hustles: v.show_on_hustles,
    show_on_wallet: v.show_on_wallet,
    show_on_messages: v.show_on_messages,
    is_active: v.is_active,
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
