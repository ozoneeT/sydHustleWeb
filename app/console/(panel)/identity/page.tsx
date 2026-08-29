import { Button } from "@/components/ui/button";
import { BvnRequest } from "@/components/console/BvnRequest";
import { IdentityReveal } from "@/components/console/IdentityReveal";
import { Input } from "@/components/ui/input";
import { WaiveAttempts } from "@/components/console/WaiveAttempts";
import { shortDate } from "@/lib/console/format";
import {
  listIdentityDisclosures,
  listRetainedIdentityRecords,
  listVerificationBlocks,
} from "@/lib/console/identity";

export const metadata = { title: "Identity — sydHustle Console" };

/** Never cache a page whose whole job is controlled access. */
export const dynamic = "force-dynamic";

export default async function IdentityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [records, disclosures, blocks] = await Promise.all([
    listRetainedIdentityRecords(q),
    listIdentityDisclosures(),
    listVerificationBlocks(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Identity records</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            What Interswitch returned from NIMC for each verified account,
            encrypted at rest and kept for seven years — including after the
            account is deleted. Opening one is a disclosure: it needs a reason
            and is logged permanently.
          </p>
        </div>
        <form action="/console/identity" className="flex gap-2">
          <Input
            className="w-64"
            defaultValue={q ?? ""}
            name="q"
            placeholder="Name, email, profile or provider ref…"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {/* First on the page, and above the vault, because it is the only
          thing here anybody has to ACT on. The records list is reference
          - it answers questions when they are asked. This is a queue of
          people who are stuck right now, and it is one muted line on the
          days nobody is. */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Verification attempts today</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Failed NIN and BVN checks in the last 24 hours. Three strikes on
            NIN or five on BVN and the app refuses until tomorrow — mostly to
            people whose NIMC record is missing a field, not to anyone
            dishonest. Handing attempts back never deletes one: the reason you
            give is written onto the attempt permanently.
          </p>
        </div>
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-white/10 px-4 py-6 text-sm text-muted-foreground">
            Nobody has a failed verification attempt in the last 24 hours.
          </p>
        ) : (
          blocks.map((block) => (
            <div
              className="rounded-xl border border-white/10 p-4"
              key={`${block.profile_id}-${block.kind}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {block.display_name ?? "Unnamed account"}
                    <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {block.kind}
                    </span>
                    {block.blocked ? (
                      <span className="ml-2 rounded bg-red-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
                        locked out
                      </span>
                    ) : null}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {block.profile_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {block.strikes} of {block.cap} strikes · last tried{" "}
                    {shortDate(block.last_attempt_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <WaiveAttempts
                    blocked={block.blocked}
                    kind={block.kind}
                    profileId={block.profile_id}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="rounded-xl border border-white/10 px-4 py-6 text-sm text-muted-foreground">
            {q
              ? `No identity record matches “${q}”.`
              : "No identity records yet."}
          </p>
        ) : (
          records.map((record) => (
            <div
              className="rounded-xl border border-white/10 p-4"
              key={record.profile_id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {record.display_name ?? "Deleted account"}
                    {record.account_deleted_at ? (
                      <span className="ml-2 rounded bg-red-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
                        deleted {shortDate(record.account_deleted_at)}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.account_email ?? "—"} · {record.provider} ·{" "}
                    {record.provider_ref ?? "no ref"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Verified{" "}
                    {record.verified_at ? shortDate(record.verified_at) : "—"} ·
                    purge after {record.purge_after ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <BvnRequest
                    profileId={record.profile_id}
                    requested={record.bvn_requested}
                    verified={record.bvn_verified}
                  />
                  <IdentityReveal
                    label={record.display_name ?? record.profile_id}
                    profileId={record.profile_id}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* The log sits on the same page as the button on purpose: an access
          trail nobody ever sees deters nobody. */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Disclosure log</h2>
          <p className="text-sm text-muted-foreground">
            Every record opened, with the reason given. Append-only — entries
            cannot be edited or removed.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Provider ref</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {disclosures.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-muted-foreground"
                    colSpan={4}
                  >
                    No record has been opened yet.
                  </td>
                </tr>
              ) : (
                disclosures.map((entry) => (
                  <tr className="border-b border-white/5" key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {shortDate(entry.disclosed_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {entry.profile_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.provider_ref ?? "—"}
                    </td>
                    <td className="px-4 py-3">{entry.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
