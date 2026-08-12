import {
  PromoBannerForm,
  PromoDelete,
  PromoToggle,
} from "@/components/console/PromoBannerForm";
import { StatCard } from "@/components/moderator/StatCard";
import {
  isLive,
  listPromoBanners,
  surfaceCounts,
  SURFACE_LIMIT,
  type PromoBannerRow,
} from "@/lib/console/promos";

export const metadata = { title: "Promotions — sydHustle Console" };

// A banner switched off here has to be off on the next request.
export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const banners = await listPromoBanners();
  const counts = surfaceCounts(banners);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The house banners inside the app. Each one is a row, so changing what
          we&apos;re pushing is an edit here rather than an App Store release.
          Banners are <strong>ours</strong> — paid placement has its own slot in
          the Featured carousel, and adverts appearing twice in one feed under
          two different treatments is how a marketplace loses track of which of
          its surfaces are for sale.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Live on Skills"
          value={`${Math.min(counts.skills, SURFACE_LIMIT)} / ${SURFACE_LIMIT}`}
          hint={
            counts.skills > SURFACE_LIMIT
              ? `${counts.skills - SURFACE_LIMIT} never appears`
              : "slots in use"
          }
        />
        <StatCard
          label="Live on Home"
          value={`${Math.min(counts.home, SURFACE_LIMIT)} / ${SURFACE_LIMIT}`}
          hint={
            counts.home > SURFACE_LIMIT
              ? `${counts.home - SURFACE_LIMIT} never appears`
              : "slots in use"
          }
        />
        <StatCard label="Total banners" value={banners.length} />
      </div>

      {counts.skills > SURFACE_LIMIT || counts.home > SURFACE_LIMIT ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
          More live banners than slots. The app shows the first{" "}
          {SURFACE_LIMIT} by order and silently ignores the rest — so a banner
          below the cut isn&apos;t broken, it just never appears. Lower its
          order, or turn something else off.
        </p>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Banners ({banners.length})
        </h2>
        <div className="space-y-4">
          {banners.length === 0 ? (
            <p className="rounded-xl border border-white/10 p-4 text-sm text-muted-foreground">
              No banners yet.
            </p>
          ) : (
            banners.map((banner) => (
              <BannerCard banner={banner} key={banner.id} />
            ))
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          New banner
        </h2>
        <div className="rounded-xl border border-white/10 p-4">
          <PromoBannerForm />
        </div>
      </section>
    </div>
  );
}

function BannerCard({ banner }: { banner: PromoBannerRow }) {
  const live = isLive(banner);
  const where = [
    banner.show_on_home ? "Home" : null,
    banner.show_on_skills ? "Skills" : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-white/10">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 p-4">
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            live
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-white/10 text-muted-foreground"
          }`}
        >
          {live ? "live" : "off"}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-muted-foreground">
          {banner.kind === "featured" ? "featured listings" : "custom"}
        </span>
        <div className="min-w-[12rem] flex-1">
          <p className="font-medium">{banner.title ?? "(no headline)"}</p>
          <p className="text-xs text-muted-foreground">
            {where.length > 0 ? where.join(" + ") : "nowhere"} · order{" "}
            {banner.sort_order}
            {banner.kind === "featured"
              ? ` · ${banner.featured_count} shown, reshuffled every ${banner.rotate_minutes}m`
              : ""}
          </p>
        </div>
        <PromoToggle active={banner.is_active} id={banner.id} />
        <PromoDelete id={banner.id} />
      </div>

      <details className="p-4">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          Edit
        </summary>
        <div className="pt-4">
          <PromoBannerForm banner={banner} />
        </div>
      </details>
    </div>
  );
}
