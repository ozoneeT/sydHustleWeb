export default function ConsoleLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-white/10" />
        <div className="h-4 w-72 max-w-full rounded-md bg-white/5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="mt-3 h-8 w-28 rounded bg-white/10" />
            <div className="mt-2 h-3 w-36 rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="h-3 w-full rounded bg-white/5" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-white/5 px-4 py-3 last:border-b-0"
          >
            <div className="h-3 w-full rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
