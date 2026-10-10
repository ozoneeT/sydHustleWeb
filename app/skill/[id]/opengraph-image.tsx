import { ImageResponse } from "next/og";
import { getSharedSkill, safeSkillPhoto, skillPrice } from "@/lib/skill-share";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OpenGraphImage({ params }: Props) {
  const { id } = await params;
  const skill = await getSharedSkill(id);
  const title = skill?.display_name ?? "Find your next Skill";
  const category = skill?.skill_name ?? "Skilled Hustlers nearby";
  const price = skill ? skillPrice(skill) : null;
  const photo = safeSkillPhoto(skill?.cover_photo ?? null);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#061c1a", color: "white", fontFamily: "sans-serif" }}>
        {photo ? <img src={photo} width="520" height="630" style={{ position: "absolute", right: 0, top: 0, width: 520, height: 630, objectFit: "cover" }} /> : null}
        <div style={{ position: "absolute", right: 0, top: 0, width: 650, height: 630, background: "linear-gradient(90deg, #061c1a 0%, rgba(6,28,26,.94) 25%, rgba(6,28,26,.25) 100%)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 820, padding: "64px 72px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#5eead4", fontSize: 22, fontWeight: 800, letterSpacing: 5, textTransform: "uppercase" }}>sydHustle <span style={{ color: "#ffffff", opacity: .55, letterSpacing: 0 }}>·</span> Book local skills</div>
          <div style={{ display: "flex", marginTop: 42, fontSize: 64, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>{title.length > 25 ? `${title.slice(0, 23)}…` : title}</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: "#d1d5db" }}>{category}</div>
          {price ? <div style={{ display: "flex", marginTop: 30, fontSize: 25, color: "#99f6e4", fontWeight: 700 }}>{price}</div> : null}
          <div style={{ display: "flex", marginTop: 42, fontSize: 21, color: "rgba(255,255,255,.65)" }}>See the Skill and book in the sydHustle app</div>
        </div>
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 12, background: "#14b8a6" }} />
      </div>
    ),
    size,
  );
}
