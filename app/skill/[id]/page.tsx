import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { APP_STORE_URL, PLAY_STORE_URL, SITE_URL } from "@/lib/site";
import { getSharedSkill, safeSkillPhoto, sharedSkillDescription, sharedSkillTitle, skillPrice } from "@/lib/skill-share";
import { StoreFallback } from "./StoreFallback";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#061c1a",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const skill = await getSharedSkill(id);
  if (!skill) return { title: "Skill unavailable", robots: { index: false } };

  const title = sharedSkillTitle(skill);
  const description = sharedSkillDescription(skill);
  const url = `${SITE_URL}/skill/${id}`;
  const image = `${url}/opengraph-image`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "sydHustle",
      images: [{ url: image, width: 1200, height: 630, alt: `${skill.display_name} on sydHustle` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharedSkillPage({ params }: Props) {
  const { id } = await params;
  const skill = await getSharedSkill(id);
  if (!skill) notFound();
  const price = skillPrice(skill);
  const photo = safeSkillPhoto(skill.cover_photo);

  return (
    <main className="skill-share-page min-h-screen bg-[#061c1a] px-5 py-12 text-white sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30">
          <div
            className="aspect-[4/3] bg-cover bg-center"
            style={photo ? { backgroundImage: `linear-gradient(180deg, transparent 42%, rgba(3,18,17,.78)), url("${photo}")` } : { backgroundImage: "linear-gradient(135deg, #14b8a6, #0f2e2e)" }}
            role="img"
            aria-label={`${skill.skill_name} work by ${skill.display_name}`}
          />
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{skill.display_name}</h1>
            <p className="mt-2 text-lg text-white/70">{skill.skill_name}</p>
            {price ? <p className="mt-4 text-base font-semibold text-teal-200">{price}</p> : null}
            {skill.bio ? <p className="mt-5 whitespace-pre-line text-sm leading-6 text-white/70">{skill.bio}</p> : null}
          </div>
        </div>

        <section className="max-w-lg">
          <StoreFallback
            skillId={id}
            appStoreUrl={APP_STORE_URL}
            playStoreUrl={PLAY_STORE_URL}
          />
          <p className="mt-4 text-base leading-7 text-white/70">Open the Skill in sydHustle to see the full details and send a booking request.</p>
          <p className="mt-5 text-xs leading-5 text-white/45">The Skill’s public page shows only information its Hustler chose to share. Booking and payments stay in the sydHustle app.</p>
        </section>
      </div>
    </main>
  );
}
