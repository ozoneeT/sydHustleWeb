"use client";

import { deleteCost, endCost } from "@/lib/console/actions";

export function CostRowActions({
  id,
  kind,
  active,
}: {
  id: string;
  kind: "recurring" | "one_off";
  active: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 text-xs">
      <a
        className="text-muted-foreground hover:text-white hover:underline"
        href={`/console/costs?edit=${id}`}
      >
        Edit
      </a>
      {kind === "recurring" && active ? (
        <form
          action={endCost}
          onSubmit={(event) => {
            if (!confirm("Stop this service? Accrual ends today; history stays.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="id" type="hidden" value={id} />
          <button className="text-amber-400 hover:underline" type="submit">
            Stop
          </button>
        </form>
      ) : null}
      <form
        action={deleteCost}
        onSubmit={(event) => {
          if (!confirm("Delete this entry? Only for mistakes — it leaves the books entirely.")) {
            event.preventDefault();
          }
        }}
      >
        <input name="id" type="hidden" value={id} />
        <button className="text-red-400 hover:underline" type="submit">
          Delete
        </button>
      </form>
    </div>
  );
}
