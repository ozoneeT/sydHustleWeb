"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";
import { iconExists } from "@/lib/console/skills";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Editing the skill catalogue.
 *
 * Every action here changes what the NEXT person sees on Step 1 of Add
 * a Skill, and two of them can touch work that is already published, so
 * the database does the deciding: `console_delete_skill` counts the
 * listings under a lock and refuses, `console_set_featured_skills`
 * replaces the shortlist in one transaction, and the catalogue's own
 * constraints police the icons. What follows turns each refusal back
 * into a sentence an operator can act on.
 */

export type SkillFormState = { error: string | null; saved: boolean };

// The starting state lives in the component, not here. A "use server"
// module may export ONLY async functions - every other export is
// registered as a server reference, and Next throws when it turns out
// not to be callable. It throws when the action RUNS rather than when
// the file is built, so the whole file compiles, deploys, renders its
// page, and then fails on the first button press.

const skillSchema = z.object({
  id: z.string().trim().max(64).optional(),
  name: z.string().trim().min(2).max(60),
  name_plural: z.string().trim().max(60).optional(),
  icon: z.string().trim().min(1).max(64),
  licensed_trade: z.boolean(),
});

function refresh() {
  revalidatePath("/console/skills");
}

/** Postgres errors, in the words of the person who caused them. */
function explain(message: string): string {
  const inUse = message.match(/skill_in_use:(\d+)/);
  if (inUse) {
    const n = Number(inUse[1]);
    return `${n.toLocaleString("en-NG")} published ${
      n === 1 ? "listing is" : "listings are"
    } still under this skill, so deleting it would move ${
      n === 1 ? "it" : "them"
    } off its rail on the Skills feed. Retire it instead — nobody new can pick it, and every listing already published keeps working.`;
  }
  if (message.includes("skill_catalog_icon_key")) {
    return "Another skill already wears that icon. Every skill has its own, so the wizard's chips can be told apart at a glance.";
  }
  if (message.includes("skill_catalog_icon_outline")) {
    return "Icons have to be the outline cut — the name must end in “-outline”.";
  }
  if (message.includes("skill_name_required")) {
    return "A skill needs a name.";
  }
  if (message.includes("skill_icon_required")) {
    return "Pick an icon.";
  }
  if (message.includes("unknown_skill")) {
    return "That skill is no longer in the catalogue. Reload the page.";
  }
  if (message.includes("rail_required")) {
    return "Nothing to move.";
  }
  if (message.includes("too_many_featured")) {
    return "Eight chips is the most the wizard will draw.";
  }
  if (message.includes("duplicate_featured")) {
    return "The same skill is in the shortlist twice.";
  }
  const retired = message.match(/unknown_or_retired_skill:(.+)$/);
  if (retired) {
    return `“${retired[1]}” is retired, so it can't be one of the suggestions. Bring it back first, or drop it from the shortlist.`;
  }
  if (message.includes("skill_catalog_retired_not_featured")) {
    return "A retired skill can't also be a suggested chip.";
  }
  return message;
}

export async function saveSkill(
  _prev: SkillFormState,
  formData: FormData
): Promise<SkillFormState> {
  await requireConsole();

  const parsed = skillSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    name_plural: (formData.get("name_plural") as string) || undefined,
    icon: formData.get("icon"),
    licensed_trade: formData.get("licensed_trade") === "on",
  });
  if (!parsed.success) {
    return {
      error: "A skill needs a name of at least two characters and an icon.",
      saved: false,
    };
  }

  // Checked here and not in the database, because the database cannot
  // know it: `%-outline` is satisfied by any invented name, and an
  // invented name draws a blank square in the wizard rather than an
  // error anybody would see.
  if (!iconExists(parsed.data.icon)) {
    return {
      error: `“${parsed.data.icon}” isn't an Ionicons name. Pick one from the list — anything else draws a blank square in the app.`,
      saved: false,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("console_save_skill", {
    p_id: parsed.data.id ?? null,
    p_name: parsed.data.name,
    p_name_plural: parsed.data.name_plural ?? parsed.data.name,
    p_icon: parsed.data.icon,
    p_licensed_trade: parsed.data.licensed_trade,
  });
  if (error) return { error: explain(error.message), saved: false };

  refresh();
  return { error: null, saved: true };
}

export async function retireSkill(
  _prev: SkillFormState,
  formData: FormData
): Promise<SkillFormState> {
  await requireConsole();
  const id = String(formData.get("id") ?? "");
  const retired = formData.get("retired") === "true";
  if (!id) return { error: "Nothing to change.", saved: false };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("console_retire_skill", {
    p_id: id,
    p_retired: retired,
  });
  if (error) return { error: explain(error.message), saved: false };

  refresh();
  return { error: null, saved: true };
}

/**
 * The hard delete, and the only action here that asks for the name back.
 *
 * A retire is undone with one click; this is not undoable at all, and
 * the id it erases is the one every future listing would have pointed
 * at. Typing the name is the pause.
 */
export async function deleteSkill(
  _prev: SkillFormState,
  formData: FormData
): Promise<SkillFormState> {
  await requireConsole();
  const id = String(formData.get("id") ?? "");
  const typed = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (!id) return { error: "Nothing to delete.", saved: false };

  const supabase = createServerSupabaseClient();

  // Read the name back rather than trusting the hidden field beside the
  // box. The confirmation is a pause for the operator, not a security
  // boundary - but a pause a mis-rendered page can satisfy on its own is
  // not a pause, and this costs one indexed lookup.
  const { data: row, error: lookupError } = await supabase
    .from("skill_catalog")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) return { error: lookupError.message, saved: false };
  if (!row) {
    return { error: explain("unknown_skill"), saved: false };
  }
  if (typed !== String(row.name).trim().toLowerCase()) {
    return {
      error: `Type “${row.name}” exactly to delete it.`,
      saved: false,
    };
  }

  const { error } = await supabase.rpc("console_delete_skill", { p_id: id });
  if (error) return { error: explain(error.message), saved: false };

  refresh();
  return { error: null, saved: true };
}

export async function setFeaturedSkills(
  _prev: SkillFormState,
  formData: FormData
): Promise<SkillFormState> {
  await requireConsole();

  // Posted in shortlist order, one hidden input per chip, so reordering
  // in the browser needs no index bookkeeping here.
  const ids = formData.getAll("featured").map((value) => String(value));
  if (ids.length > 8) {
    return { error: "Eight chips is the most the wizard will draw.", saved: false };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("console_set_featured_skills", {
    p_ids: ids,
  });
  if (error) return { error: explain(error.message), saved: false };

  refresh();
  return { error: null, saved: true };
}

/**
 * Report a move in the only terms that are true.
 *
 * `console_move_listings` returns what it actually did, because a
 * certified listing has its trade frozen by a trigger that reverts the
 * field WITHOUT raising - so a move that counted rows before the update
 * would report a success it never achieved.
 */
function describeMove(result: unknown): string {
  const row = (result ?? {}) as { moved?: number; skipped_certified?: number };
  const moved = Number(row.moved ?? 0);
  const skipped = Number(row.skipped_certified ?? 0);
  const listings = `${moved} ${moved === 1 ? "listing" : "listings"}`;
  if (skipped > 0) {
    return `Moved ${listings}. ${skipped} certified ${
      skipped === 1 ? "listing was" : "listings were"
    } left where they are — a certificate is issued against a trade, so the trade cannot be reassigned from here.`;
  }
  return `Moved ${listings}.`;
}

export type MoveState = {
  error: string | null;
  message: string | null;
};

export async function moveListings(
  _prev: MoveState,
  formData: FormData
): Promise<MoveState> {
  await requireConsole();

  const rail = String(formData.get("rail_id") ?? "");
  // Empty means "send them back to their own typed rail", which is how a
  // move is undone: `rail_id` is generated from the name nothing touched.
  const target = String(formData.get("skill_id") ?? "").trim() || null;
  if (!rail) return { error: "Nothing to move.", message: null };

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_move_listings", {
    p_rail_id: rail,
    p_skill_id: target,
  });
  if (error) return { error: explain(error.message), message: null };

  refresh();
  return { error: null, message: describeMove(data) };
}

export async function promoteRail(
  _prev: MoveState,
  formData: FormData
): Promise<MoveState> {
  await requireConsole();

  const rail = String(formData.get("rail_id") ?? "");
  const parsed = skillSchema.safeParse({
    name: formData.get("name"),
    name_plural: (formData.get("name_plural") as string) || undefined,
    icon: formData.get("icon"),
    licensed_trade: formData.get("licensed_trade") === "on",
  });
  if (!rail) return { error: "Nothing to promote.", message: null };
  if (!parsed.success) {
    return {
      error: "A skill needs a name of at least two characters and an icon.",
      message: null,
    };
  }
  if (!iconExists(parsed.data.icon)) {
    return {
      error: `\u201c${parsed.data.icon}\u201d isn't an Ionicons name. Pick one from the list.`,
      message: null,
    };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("console_promote_rail", {
    p_rail_id: rail,
    p_name: parsed.data.name,
    p_name_plural: parsed.data.name_plural ?? parsed.data.name,
    p_icon: parsed.data.icon,
    p_licensed_trade: parsed.data.licensed_trade,
  });
  if (error) return { error: explain(error.message), message: null };

  refresh();
  return {
    error: null,
    message: `Added to the catalogue. ${describeMove(data)}`,
  };
}
