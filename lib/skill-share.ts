import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SharedSkill = {
  id: string;
  display_name: string;
  skill_name: string;
  cover_photo: string | null;
  bio: string | null;
  pricing_type: string | null;
  price_amount: number | null;
  min_price: number | null;
  max_price: number | null;
  availability: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getSharedSkill(id: string): Promise<SharedSkill | null> {
  if (!UUID.test(id)) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("hustler_skills")
    .select("id, display_name, skill_name, cover_photo, bio, pricing_type, price_amount, min_price, max_price, availability, hustler_id")
    .eq("id", id)
    .is("removed_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // The service key bypasses RLS, so apply the same account restriction used
  // by public discovery before returning a listing to a shared web link.
  if (data.hustler_id) {
    const { data: restricted, error: restrictionError } = await supabase.rpc(
      "account_is_restricted",
      { p_profile_id: data.hustler_id },
    );
    if (restrictionError) throw restrictionError;
    if (restricted) return null;
  }

  return {
    id: data.id,
    display_name: data.display_name,
    skill_name: data.skill_name,
    cover_photo: data.cover_photo,
    bio: data.bio,
    pricing_type: data.pricing_type,
    price_amount: data.price_amount,
    min_price: data.min_price,
    max_price: data.max_price,
    availability: data.availability,
  } as SharedSkill;
}

/** Only load the public Skill bucket from this app's own Supabase project. */
export function safeSkillPhoto(photo: string | null) {
  if (!photo) return null;
  try {
    const image = new URL(photo);
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!projectUrl || image.protocol !== "https:") return null;
    const project = new URL(projectUrl);
    const currentR2Photo =
      image.hostname === "cdn.sydhustle.com" && image.pathname.startsWith("/skills/");
    const legacySupabasePhoto =
      image.hostname === project.hostname &&
      image.pathname.startsWith("/storage/v1/object/public/skill-photos/");
    if (!currentR2Photo && !legacySupabasePhoto) return null;
    return image.toString();
  } catch {
    return null;
  }
}

export function skillPrice(skill: SharedSkill) {
  const amount = skill.price_amount ?? skill.min_price;
  if (amount == null) return null;
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
  return skill.pricing_type === "hourly" ? `${formatted} / hour` : `From ${formatted}`;
}
