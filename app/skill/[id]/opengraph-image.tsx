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
  const bio = skill?.bio?.trim();
  const bioPreview = bio ? (bio.length > 132 ? `${bio.slice(0, 129).trimEnd()}…` : bio) : null;
  const titleSize = title.length > 25 ? 48 : title.length > 17 ? 56 : 66;

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
              height: 630,
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
            width: 760,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            padding: "52px 0 48px 64px",
          }}
        >

          <div
            style={{
              display: "flex",
              maxWidth: 600,
              marginTop: 20,
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
              marginTop: 12,
              color: "rgba(255,255,255,.72)",
              fontSize: 27,
              fontWeight: 500,
            }}
          >
            {category}
          </div>

          {price ? (
            <div
              style={{
                display: "flex",
                marginTop: 18,
                color: "#8ce9dd",
                fontSize: 29,
                fontWeight: 700,
              }}
            >
              {price}
            </div>
          ) : null}

          {bioPreview ? (
            <div
              style={{
                display: "flex",
                maxWidth: 620,
                marginTop: 22,
                color: "rgba(255,255,255,.72)",
                fontSize: 21,
                lineHeight: 1.38,
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
              marginTop: "auto",
              color: "rgba(255,255,255,.78)",
              fontSize: 19,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 17,
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
