import {
  PromoBannerForm,
  PromoDelete,
  PromoToggle,
} from "@/components/console/PromoBannerForm";
import { StatCard } from "@/components/moderator/StatCard";
import {
  describeAudience,
  isEmptyAudience,
} from "@/lib/console/audience";
import { APP_ROUTES, PROMO_SURFACES } from "@/lib/console/app-routes";
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
  const over = PROMO_SURFACES.filter(
    (surface) => counts[surface.field] > SURFACE_LIMIT,
  );

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

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {PROMO_SURFACES.map((surface) => (
          <StatCard
            key={surface.field}
            label={surface.label}
            value={`${Math.min(counts[surface.field], SURFACE_LIMIT)} / ${SURFACE_LIMIT}`}
            hint={
              counts[surface.field] > SURFACE_LIMIT
                ? `${counts[surface.field] - SURFACE_LIMIT} never appears`
                : "slots in use"
            }
          />
        ))}
      </div>

      {over.length > 0 ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
          More live banners than slots on{" "}
          {over.map((surface) => surface.label).join(", ")}. The app shows the
          first {SURFACE_LIMIT} by order and silently ignores the rest — so a
          banner below the cut isn&apos;t broken, it just never appears. Lower
          its order, or turn something else off.
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

      <RouteReference />
    </div>
  );
}

/**
 * What a CTA link can point at.
 *
 * The app's router ignores anything it doesn't recognise, so a typo
 * here produces a button that silently does nothing rather than an
 * error anyone sees — which is exactly the kind of bug that survives
 * for months. Worth having the list on the page.
 */
function RouteReference() {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">
        Where a button can link to
      </h2>
      <div className="rounded-xl border border-white/10 p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          In-app screens start with <code className="text-accent">/</code>.
          External links must be <code className="text-accent">https://</code>.
          Anything else is rejected when you save, because the app would
          quietly ignore it.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {APP_ROUTES.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.group}
              </p>
              <ul className="space-y-1.5">
                {group.routes.map((route) => (
                  <li className="text-sm" key={route.path}>
                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-accent">
                      {route.path}
                    </code>{" "}
                    <span className="text-muted-foreground">{route.label}</span>
                    {route.note ? (
                      <span className="block pl-1 text-xs text-muted-foreground/70">
                        {route.note}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Screens that need a specific record — a chat, one Hustler&apos;s
          profile, a single transaction — aren&apos;t listed. A banner is shown
          to everybody, and those screens have no meaning without knowing whose.
        </p>
      </div>
    </section>
  );
}

function BannerCard({ banner }: { banner: PromoBannerRow }) {
  const live = isLive(banner);
  const where = PROMO_SURFACES.filter((surface) => banner[surface.field]).map(
    (surface) => surface.label,
  );
  // Only shown when it says something: "Everyone, except nobody" on every
  // untargeted banner would be a row of noise to read past.
  const targeted = !isEmptyAudience(banner.audience ?? {});
  const exempting = !isEmptyAudience(banner.exclude ?? {});

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

        {banner.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-10 w-16 shrink-0 rounded object-cover"
            src={banner.image_url}
          />
        ) : null}

        <div className="min-w-[12rem] flex-1">
          <p className="font-medium">{banner.title ?? "(no headline)"}</p>
          <p className="text-xs text-muted-foreground">
            {where.length > 0 ? where.join(" + ") : "nowhere"} · order{" "}
            {banner.sort_order}
            {banner.kind === "featured"
              ? ` · ${banner.featured_count} shown, reshuffled every ${banner.rotate_minutes}m`
              : ""}
          </p>
          {targeted || exempting ? (
            <p className="text-xs text-muted-foreground">
              <span className="text-accent">
                {targeted
                  ? describeAudience(banner.audience).join(" · ")
                  : "Everyone"}
              </span>
              {exempting ? (
                <span className="text-amber-400/90">
                  {" "}
                  · except {describeAudience(banner.exclude).join(" · ")}
                </span>
              ) : null}
            </p>
          ) : null}
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
