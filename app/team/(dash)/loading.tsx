/**
 * What the dashboard looks like while it is being fetched.
 *
 * Without this, navigating to the dashboard shows the previous page until
 * the server is done — which on mobile data reads as a tap that did
 * nothing. The shapes match the real page (heading, three totals, the
 * settlement button, the form, a couple of entries) so the layout settles
 * into place rather than jumping when the content lands.
 */
export default function TeamDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-white/10" />
        <div className="h-4 w-full max-w-lg rounded-md bg-white/5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
            key={i}
          >
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="mt-3 h-8 w-24 rounded bg-white/10" />
            <div className="mt-2 h-3 w-28 rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="h-10 w-52 rounded-full bg-white/10" />

      <div className="space-y-4 rounded-2xl border border-accent/20 bg-accent/[0.03] p-6">
        <div className="h-4 w-36 rounded bg-white/10" />
        <div className="h-11 w-full rounded-xl bg-white/5" />
        <div className="h-32 w-full rounded-xl bg-white/5" />
        <div className="h-11 w-40 rounded-full bg-white/10" />
      </div>

      {Array.from({ length: 2 }).map((_, i) => (
        <div
          className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          key={i}
        >
          <div className="h-4 w-56 max-w-full rounded bg-white/10" />
          <div className="h-3 w-40 rounded bg-white/5" />
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="h-3 w-4/5 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
