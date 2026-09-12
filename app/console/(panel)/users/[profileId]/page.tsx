import Link from "next/link";
import { notFound } from "next/navigation";

import { FeatureRestrictions } from "@/components/console/FeatureRestrictions";
import { Card } from "@/components/ui/card";
import { requireConsole } from "@/lib/console/dal";
import { naira, shortDate } from "@/lib/console/format";
import { getConsoleUser, listRestrictions } from "@/lib/console/restrictions";
import { getUserTransactions } from "@/lib/console/transactions";
import {
  getUserDossier,
  type DossierSection,
} from "@/lib/console/user-dossier";

export const metadata = { title: "User — sydHustle Console" };
export const dynamic = "force-dynamic";

/**
 * One account, and everything the desk knows about it.
 *
 * This used to be the feature-pause switches and nothing else, which
 * meant that answering "what is going on with this person" took eight
 * tabs, each wanting a different identifier to search by. Everything a
 * moderator would go looking for now arrives with the name, and each
 * section deep-links to the tab that owns it for the actions.
 *
 * Sections fail independently. The dossier settles each read on its own
 * so one missing relation costs that panel a line of text instead of
 * taking the page down — which is exactly what the identity page did.
 */

function Panel({
  title,
  blurb,
  href,
  hrefLabel,
  count,
  children,
}: {
  title: string;
  blurb?: string;
  href?: string;
  hrefLabel?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {title}
            {typeof count === "number" ? (
              <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {count}
              </span>
            ) : null}
          </h2>
          {blurb ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {blurb}
            </p>
          ) : null}
        </div>
        {href ? (
          <Link
            className="shrink-0 text-sm text-accent hover:underline"
            href={href}
          >
            {hrefLabel ?? "Open"} →
          </Link>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/** A failed section says so. An empty one says that instead. */
function Section<T>({
  data,
  empty,
  render,
}: {
  data: DossierSection<T>;
  empty: string;
  render: (rows: T[]) => React.ReactNode;
}) {
  if (!data.ok) {
    return (
      <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-sm text-amber-200">
        This section could not be loaded, so it is not evidence of nothing:{" "}
        <span className="font-mono text-xs">{data.error}</span>
      </p>
    );
  }
  if (data.rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return <>{render(data.rows)}</>;
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-white/10 p-3 text-sm">
      {children}
    </li>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  await requireConsole("users");
  const { profileId } = await params;

  const profile = await getConsoleUser(profileId);
  if (!profile) notFound();

  const [restrictions, dossier, ledger] = await Promise.all([
    listRestrictions(profileId),
    getUserDossier(profileId),
    // The ledger is its own tab and its own RPC; a failure here should
    // cost the wallet panel, not the page.
    getUserTransactions(profileId).catch((err: unknown) => ({
      profile: null,
      entries: [],
      error: err instanceof Error ? err.message : String(err),
    })),
  ]);

  const suspended = profile.suspended;
  const entries = "entries" in ledger ? ledger.entries : [];
  const ledgerError = "error" in ledger ? (ledger.error as string) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href="/console/users"
        >
          ← Users
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {profile.full_name ?? "Unnamed account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.school ?? "No school"} · joined{" "}
          {shortDate(profile.created_at)}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {profileId}
        </p>
      </div>

      {suspended ? (
        <Card className="border-red-500/40 bg-red-500/5 p-4 text-sm text-red-300">
          {profile.terminated_at
            ? "This account is terminated. Everything below is already blocked."
            : `This account is suspended until ${new Date(
                profile.suspended_until!
              ).toLocaleString("en-NG")}. Everything below is already blocked.`}
        </Card>
      ) : null}

      {/* Money ---------------------------------------------------- */}
      <Panel
        title="Wallet and ledger"
        blurb="Most recent entries. The transactions tab has the full history and the detail on each one."
        count={entries.length}
        href={`/console/transactions/${profileId}`}
        hrefLabel="Open ledger"
      >
        {ledgerError ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-sm text-amber-200">
            The ledger could not be loaded:{" "}
            <span className="font-mono text-xs">{ledgerError}</span>
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No wallet movement on this account.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.slice(0, 8).map((e) => (
              <Row key={e.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {e.direction === "credit" ? "+" : "−"}
                    {naira(Math.abs(e.amount))}{" "}
                    <Muted>· {e.reason}</Muted>
                  </span>
                  <Link
                    className="font-mono text-xs text-accent hover:underline"
                    href={`/console/transactions/${profileId}/${e.reference}`}
                  >
                    {e.reference}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {shortDate(e.created_at)} · balance after{" "}
                  {naira(e.balance_after)}
                </p>
              </Row>
            ))}
          </ul>
        )}
      </Panel>

      {/* What they sell ------------------------------------------- */}
      <Panel
        title="Skill listings"
        blurb="Their shopfront. Removing or restoring one is done on the listings tab, where the removal reason is recorded."
        count={dossier.listings.ok ? dossier.listings.rows.length : undefined}
        href="/console/listings"
        hrefLabel="Listings tab"
      >
        <Section
          data={dossier.listings}
          empty="This account has no skill listings."
          render={(rows) => (
            <ul className="space-y-2">
              {rows.map((l) => (
                <Row key={l.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {l.display_name ?? l.skill_name ?? "Untitled listing"}
                    </span>
                    <span className="text-xs">
                      {l.removed_at ? (
                        <span className="rounded bg-red-500/15 px-2 py-0.5 uppercase tracking-wide text-red-300">
                          removed
                        </span>
                      ) : l.certified ? (
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 uppercase tracking-wide text-emerald-300">
                          certified
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {l.price_amount != null
                      ? `${naira(Number(l.price_amount))} · `
                      : ""}
                    {l.rating_count
                      ? `${l.rating_avg ?? "—"} from ${l.rating_count} · `
                      : ""}
                    listed {shortDate(l.created_at)}
                    {l.removed_reason ? ` · ${l.removed_reason}` : ""}
                  </p>
                </Row>
              ))}
            </ul>
          )}
        />
      </Panel>

      {/* Work ------------------------------------------------------ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Hustles posted"
          blurb="Work this account paid for."
          count={dossier.posted.ok ? dossier.posted.rows.length : undefined}
        >
          <Section
            data={dossier.posted}
            empty="Has not posted a Hustle."
            render={(rows) => (
              <ul className="space-y-2">
                {rows.slice(0, 10).map((h) => (
                  <Row key={h.id}>
                    <span className="font-medium">
                      {h.title ?? "Untitled"}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {h.status} ·{" "}
                      {h.price != null ? `${naira(Number(h.price))} · ` : ""}
                      {h.area_label ?? "no area"} · {shortDate(h.created_at)}
                    </p>
                  </Row>
                ))}
              </ul>
            )}
          />
        </Panel>

        <Panel
          title="Hustles worked"
          blurb="Work this account was assigned."
          count={dossier.worked.ok ? dossier.worked.rows.length : undefined}
        >
          <Section
            data={dossier.worked}
            empty="Has not been assigned a Hustle."
            render={(rows) => (
              <ul className="space-y-2">
                {rows.slice(0, 10).map((h) => (
                  <Row key={h.id}>
                    <span className="font-medium">
                      {h.title ?? "Untitled"}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {h.status} ·{" "}
                      {h.price != null ? `${naira(Number(h.price))} · ` : ""}
                      {h.area_label ?? "no area"} · {shortDate(h.created_at)}
                    </p>
                  </Row>
                ))}
              </ul>
            )}
          />
        </Panel>
      </div>

      {/* Reports --------------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Reported by this account"
          blurb="What they have reported. A high count is either the most useful user on the platform or the button used as a weapon."
          count={
            dossier.reportsFiled.ok
              ? dossier.reportsFiled.rows.length
              : undefined
          }
          href="/console/reports"
          hrefLabel="Reports tab"
        >
          <Section
            data={dossier.reportsFiled}
            empty="Has not reported anybody."
            render={(rows) => (
              <ul className="space-y-2">
                {rows.map((r) => (
                  <Row key={r.id}>
                    <span className="font-medium">{r.reason}</span>{" "}
                    <Muted>· {r.status}</Muted>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.target_type}: {r.target_label ?? "target gone"} ·{" "}
                      {shortDate(r.created_at)}
                    </p>
                  </Row>
                ))}
              </ul>
            )}
          />
        </Panel>

        <Panel
          title="Reported against this account"
          blurb="Reports on things they own. This is where an enforcement action would land, and the reports tab carries the evidence."
          count={
            dossier.reportsAgainst.ok
              ? dossier.reportsAgainst.rows.length
              : undefined
          }
          href="/console/reports"
          hrefLabel="Reports tab"
        >
          <Section
            data={dossier.reportsAgainst}
            empty="Nobody has reported this account."
            render={(rows) => (
              <ul className="space-y-2">
                {rows.map((r) => (
                  <Row key={r.id}>
                    <span className="font-medium">{r.reason}</span>{" "}
                    <Muted>· {r.status}</Muted>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.target_type}: {r.target_label ?? "target gone"} ·{" "}
                      {shortDate(r.created_at)}
                    </p>
                    {r.decision_note ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.decision_note}
                      </p>
                    ) : null}
                  </Row>
                ))}
              </ul>
            )}
          />
        </Panel>
      </div>

      {/* Appeals --------------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Escrow appeals"
          blurb="Money held on a job they disputed."
          count={
            dossier.holdAppeals.ok ? dossier.holdAppeals.rows.length : undefined
          }
          href="/console/holds"
          hrefLabel="Held funds"
        >
          <Section
            data={dossier.holdAppeals}
            empty="Has not appealed a held payment."
            render={(rows) => (
              <ul className="space-y-2">
                {rows.map((a) => (
                  <Row key={a.id}>
                    <span className="font-medium">{a.ground ?? "Appeal"}</span>{" "}
                    <Muted>· {a.status}</Muted>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {shortDate(a.created_at)}
                      {a.decided_at ? ` · decided ${shortDate(a.decided_at)}` : ""}
                    </p>
                    {a.detail ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.detail}
                      </p>
                    ) : null}
                  </Row>
                ))}
              </ul>
            )}
          />
        </Panel>

        <Panel
          title="Review appeals"
          blurb="Ratings they asked to have looked at again."
          count={
            dossier.reviewAppeals.ok
              ? dossier.reviewAppeals.rows.length
              : undefined
          }
          href="/console/review-appeals"
          hrefLabel="Review appeals"
        >
          <Section
            data={dossier.reviewAppeals}
            empty="Has not appealed a review."
            render={(rows) => (
              <ul className="space-y-2">
                {rows.map((a) => (
                  <Row key={a.id}>
                    <span className="font-medium">{a.ground ?? "Appeal"}</span>{" "}
                    <Muted>· {a.status}</Muted>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {shortDate(a.created_at)}
                      {a.resolved_at
                        ? ` · resolved ${shortDate(a.resolved_at)}`
                        : ""}
                    </p>
                  </Row>
                ))}
              </ul>
            )}
          />
        </Panel>
      </div>

      {/* Identity -------------------------------------------------- */}
      <Panel
        title="Identity"
        blurb="Verification attempts, and whether a record is retained. Opening the record itself is a logged disclosure and stays on the identity tab."
        href="/console/identity"
        hrefLabel="Identity tab"
      >
        <div className="space-y-4">
          <Section
            data={dossier.retained}
            empty="No retained identity record."
            render={(rows) => (
              <ul className="space-y-2">
                {rows.map((r) => (
                  <Row key={r.id}>
                    <span className="font-medium">
                      {r.id_type?.toUpperCase() ?? "ID"} verified
                    </span>{" "}
                    <Muted>· {r.provider}</Muted>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.verified_at ? shortDate(r.verified_at) : "—"} · purge
                      after {r.purge_after ?? "—"}
                      {r.account_deleted_at
                        ? ` · account deleted ${shortDate(r.account_deleted_at)}`
                        : ""}
                    </p>
                  </Row>
                ))}
              </ul>
            )}
          />
          <Section
            data={dossier.identity}
            empty="No verification attempts."
            render={(rows) => (
              <ul className="space-y-2">
                {rows.slice(0, 10).map((v) => (
                  <Row key={v.id}>
                    <span className="font-medium">
                      {v.id_type?.toUpperCase() ?? "ID"}
                    </span>{" "}
                    <Muted>· {v.status}</Muted>
                    {v.waived_at ? (
                      <span className="ml-2 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                        waived
                      </span>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {shortDate(v.created_at)}
                      {v.failure_reason ? ` · ${v.failure_reason}` : ""}
                      {v.waived_reason ? ` · waived: ${v.waived_reason}` : ""}
                    </p>
                  </Row>
                ))}
              </ul>
            )}
          />
        </div>
      </Panel>

      {/* Actions --------------------------------------------------- */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold">Feature access</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Pause one thing while a report or review is open, instead of the
          whole account. Work already agreed keeps running either way: these
          stop new actions, not in-flight ones.
        </p>
        <FeatureRestrictions
          profileId={profileId}
          restrictions={restrictions}
        />
      </Card>

      {restrictions.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Restriction history</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Everything ever paused on this account, including what has since
            expired, so a repeat is visible as a repeat.
          </p>
          <ul className="space-y-2 text-sm">
            {restrictions.map((r) => (
              <li
                className="rounded-lg border border-white/10 p-3"
                key={`${r.feature}-${r.created_at}`}
              >
                <span className="font-medium">{r.feature}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {shortDate(r.created_at)} ·{" "}
                  {r.restricted_until
                    ? `until ${new Date(r.restricted_until).toLocaleString("en-NG")}`
                    : "indefinite"}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
