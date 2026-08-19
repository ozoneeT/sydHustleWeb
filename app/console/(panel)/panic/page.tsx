import {
  ClearAlertAction,
  HoldAppealDecision,
} from "@/components/console/PanicDeskActions";
import { StatCard } from "@/components/moderator/StatCard";
import { shortDate } from "@/lib/console/format";
import {
  HOLD_GROUND_LABELS,
  HOLD_GROUND_TESTS,
  listHoldAppeals,
  listPanicAlerts,
  mapLink,
  type HoldAppealRow,
  type PanicDeskAlert,
} from "@/lib/console/panic-desk";

export const metadata = { title: "Panic — sydHustle Console" };

// An open incident is worthless cached.
export const dynamic = "force-dynamic";

export default async function PanicPage() {
  const [alerts, appeals] = await Promise.all([
    listPanicAlerts(),
    listHoldAppeals(),
  ]);

  const open = alerts.filter((row) => row.cleared_at === null);
  const closed = alerts.filter((row) => row.cleared_at !== null);
  const unmailed = open.filter((row) => row.notified_at === null);
  const pendingAppeals = appeals.filter((row) => row.status === "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panic</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Someone pressed the button. While an alert is open the whole Hustle
          is frozen for both parties — nothing can be released, completed or
          declined — so closing one is not tidying a list, it is handing a
          booking back to two people and overriding a statement that somebody
          was in danger.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          <strong className="text-foreground">
            Ring the emergency contact, never the other party.
          </strong>{" "}
          On a platform that sends strangers to meet each other, the other
          party is the single most likely reason for the alarm, and calling
          them tells them exactly when to leave.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open"
          hint="each one is a frozen booking"
          value={open.length}
        />
        <StatCard
          label="Never mailed"
          hint="nobody was paged about these"
          value={unmailed.length}
        />
        <StatCard label="Appeals waiting" value={pendingAppeals.length} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Open ({open.length})
        </h2>
        <div className="rounded-xl border border-white/10">
          {open.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No open alerts.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {open.map((row) => (
                <AlertCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Hold appeals ({appeals.length})
        </h2>
        <p className="max-w-3xl text-xs text-muted-foreground">
          The other party cannot see that a panic alert exists — their app says
          only that the Hustle is on hold pending a safety review. Keep it that
          way in anything you write back to them.
        </p>
        <div className="rounded-xl border border-white/10">
          {appeals.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing filed.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {appeals.map((row) => (
                <AppealCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Closed ({closed.length})
        </h2>
        <div className="rounded-xl border border-white/10">
          {closed.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {closed.map((row) => (
                <ClosedRow key={row.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AlertCard({ row }: { row: PanicDeskAlert }) {
  const map = mapLink(row);

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-semibold">{row.full_name ?? "Unknown user"}</p>
          <p className="text-xs text-muted-foreground">
            {row.title ?? "a Hustle"} · pressed {shortDate(row.activated_at)}
          </p>
        </div>
        {row.notified_at === null ? (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">
            {row.notify_error ? "Nobody was mailed" : "Mail in flight"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            mailed {shortDate(row.notified_at)}
          </span>
        )}
      </div>

      {row.notify_error ? (
        <p className="rounded-lg bg-red-500/10 p-2 font-mono text-xs text-red-300">
          {row.notify_error}
        </p>
      ) : null}

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <Field label="Emergency contact">
          {row.emergency_contact_name ? (
            <>
              {row.emergency_contact_name}
              {row.emergency_contact_relationship
                ? ` (${row.emergency_contact_relationship})`
                : ""}{" "}
              —{" "}
              <a
                className="underline"
                href={`tel:${row.emergency_contact_phone}`}
              >
                {row.emergency_contact_phone}
              </a>
            </>
          ) : (
            <span className="text-red-400">none on file</span>
          )}
        </Field>
        <Field label="Where">
          {map ? (
            <a className="underline" href={map} rel="noreferrer" target="_blank">
              {row.venue_label ?? "open the map"}
            </a>
          ) : (
            <span className="text-red-400">
              no fix — {row.venue_label ?? "venue unknown"}
            </span>
          )}
        </Field>
      </dl>

      <ClearAlertAction id={row.id} />
    </div>
  );
}

function AppealCard({ row }: { row: HoldAppealRow }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-semibold">
            {row.appellant_name ?? "Unknown user"}
          </p>
          <p className="text-xs text-muted-foreground">
            {HOLD_GROUND_LABELS[row.ground] ?? row.ground} ·{" "}
            {shortDate(row.created_at)}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{row.status}</span>
      </div>

      <p className="text-sm">{row.detail}</p>

      <p className="rounded-lg bg-white/5 p-2 text-xs text-muted-foreground">
        {HOLD_GROUND_TESTS[row.ground] ?? ""}
      </p>

      {row.alert_id ? (
        <p className="text-xs text-muted-foreground">
          The alert behind this hold was raised by{" "}
          {row.activator_name ?? "the other party"}
          {row.activated_at ? ` on ${shortDate(row.activated_at)}` : ""}.
          {row.emergency_contact_phone
            ? ` Their contact: ${row.emergency_contact_name ?? "unnamed"} — ${row.emergency_contact_phone}.`
            : " No emergency contact on file."}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          The hold behind this appeal is already closed.
        </p>
      )}

      {row.status === "pending" ? (
        <HoldAppealDecision id={row.id} />
      ) : row.decision_note ? (
        <p className="text-xs text-muted-foreground">{row.decision_note}</p>
      ) : null}
    </div>
  );
}

function ClosedRow({ row }: { row: PanicDeskAlert }) {
  return (
    <div className="space-y-1 p-4">
      <p className="text-sm">
        {row.full_name ?? "Unknown user"} · {row.title ?? "a Hustle"} · closed
        by {row.cleared_by ?? "unknown"}{" "}
        {row.cleared_at ? shortDate(row.cleared_at) : ""}
      </p>
      {row.cleared_note ? (
        <p className="text-xs text-muted-foreground">{row.cleared_note}</p>
      ) : null}
    </div>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
