import { SkillCatalog } from "@/components/console/SkillCatalog";
import { Card } from "@/components/ui/card";
import { ICON_NAMES, listConsoleSkills } from "@/lib/console/skills";

export const metadata = { title: "Skills — sydHustle Console" };

/** Live operational state, never a snapshot of the last deploy. */
export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const skills = await listConsoleSkills();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          What a Hustler can pick from on step 1 of Add a Skill, and which
          five of them are suggested before they type anything. The app
          reads this table every time the wizard opens, so a skill added
          here is offered to the next person who starts one — no release,
          no update.
        </p>
      </div>

      <SkillCatalog iconNames={ICON_NAMES} skills={skills} />

      <Card className="space-y-2 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          Retire and Delete are not two words for the same thing
        </p>
        <p>
          <strong className="text-foreground">Retire</strong> withdraws a
          skill from the picker. Nobody new can choose it, and every listing
          already published under it is untouched — it keeps its icon and
          stays on its own rail on the Skills feed. It is reversible in one
          click, and it is the right answer almost every time.
        </p>
        <p>
          <strong className="text-foreground">Delete</strong> erases the row.
          Because a listing points at the skill by id, deleting one that is
          in use would move every listing under it onto a hand-typed rail
          with the fallback icon — Hustlers who did nothing, told nothing. So
          it is refused while even one listing remains, and only offered on
          skills with none. Use it for something added by mistake.
        </p>
        <p>
          Icons are outline-only and unique per skill, both enforced by the
          database. The picker above only offers glyphs that exist in the
          font the app ships and that nothing else is already wearing.
        </p>
      </Card>
    </div>
  );
}
