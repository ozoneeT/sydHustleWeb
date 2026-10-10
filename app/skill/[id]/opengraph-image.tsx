import { ImageResponse } from "next/og";
import { getSharedSkill, safeSkillPhoto } from "@/lib/skill-share";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OpenGraphImage({ params }: Props) {
  const { id } = await params;
  const skill = await getSharedSkill(id);
  const title = skill?.display_name ?? "Find your next Skill";
  const category = skill?.skill_name ?? "Skilled Hustlers nearby";
  const amount = skill?.price_amount ?? skill?.min_price ?? null;
  const formattedAmount = amount == null
    ? null
    : new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount);
  const hourly = skill?.pricing_type === "hourly";
  const photo = safeSkillPhoto(skill?.cover_photo ?? null);
  const rawBio = skill?.bio?.trim();
  const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const repeatedRoleIntro = new RegExp(
    `^\\s*(?:i am|i['’]m)\\s+(?:(?:a|an)\\s+)?(?:(?:professional|experienced|certified|qualified|skilled|licensed)\\s+)?${escapedCategory}\\b[,.!?;:\\s—-]*`,
    "i",
  );
  const bioWithoutRepeatedRole = rawBio?.replace(repeatedRoleIntro, "").trim();
  const bio = bioWithoutRepeatedRole
    ? bioWithoutRepeatedRole[0].toLocaleUpperCase() + bioWithoutRepeatedRole.slice(1)
    : rawBio;
  const bioPreview = bio ? (bio.length > 132 ? `${bio.slice(0, 129).trimEnd()}…` : bio) : null;
  const titleSize = title.length > 25 ? 58 : title.length > 17 ? 66 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
          background: "#071d1b",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 8% 0%, #16413c 0, #071d1b 48%)",
          }}
        />
        {photo ? (
          <img
            src={photo}
            width="520"
            height="630"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 530,
              maxWidth: "44.2%",
              height: 630,
              maxHeight: 630,
              objectFit: "cover",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            right: 400,
            top: 0,
            width: 310,
            height: 630,
            background: "linear-gradient(90deg, #071d1b 6%, rgba(7,29,27,.88) 48%, rgba(7,29,27,0) 100%)",
          }}
        />

        <div
          style={{
            width: 670,
            maxWidth: 670,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            boxSizing: "border-box",
            padding: "48px 48px 48px 64px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              maxWidth: 558,
              overflow: "hidden",
              fontSize: titleSize,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: -2,
              overflow: "hidden",
            }}
          >
            {title.length > 42 ? `${title.slice(0, 40)}…` : title}
          </div>

          <div
            style={{
              display: "flex",
              maxWidth: 558,
              overflow: "hidden",
              marginTop: 12,
              color: "rgba(255,255,255,.72)",
              fontSize: 34,
              fontWeight: 500,
            }}
          >
            {category}
          </div>

          {formattedAmount ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                maxWidth: 558,
                overflow: "hidden",
                marginTop: 22,
                color: "#8ce9dd",
                fontSize: 38,
                fontWeight: 700,
              }}
            >
              {!hourly ? <span style={{ marginRight: 10 }}>From</span> : null}
              <span
                style={{
                  display: "flex",
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 44,
                  marginRight: 2,
                  fontSize: 39,
                  fontWeight: 700,
                }}
              >
                N
                <span style={{ position: "absolute", left: 4, top: 17, width: 25, height: 2, background: "#8ce9dd" }} />
                <span style={{ position: "absolute", left: 4, top: 25, width: 25, height: 2, background: "#8ce9dd" }} />
              </span>
              {formattedAmount}
              {hourly ? <span style={{ marginLeft: 8, fontSize: 24, fontWeight: 500 }}>/ hour</span> : null}
            </div>
          ) : null}

          {bioPreview ? (
            <div
              style={{
                display: "flex",
                maxWidth: 558,
                overflow: "hidden",
                marginTop: 22,
                color: "rgba(255,255,255,.72)",
                fontSize: 26,
                lineHeight: 1.42,
                fontWeight: 400,
              }}
            >
              {bioPreview}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              maxWidth: 558,
              overflow: "hidden",
              marginTop: 34,
              color: "rgba(255,255,255,.82)",
              fontSize: 23,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 20,
                background: "#14b8a6",
                color: "#06201e",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              ›
            </span>
            Book this Skill on sydHustle
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 28,
            bottom: 28,
            padding: "10px 15px",
            borderRadius: 999,
            background: "rgba(5,24,22,.72)",
            border: "1px solid rgba(255,255,255,.18)",
            color: "rgba(255,255,255,.88)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          sydhustle.com
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: 8,
            background: "linear-gradient(90deg, #14b8a6, #6ee7d8)",
          }}
        />
      </div>
    ),
    size,
  );
}
