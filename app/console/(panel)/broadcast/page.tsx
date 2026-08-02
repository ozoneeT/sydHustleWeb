import { BroadcastForm } from "@/components/console/BroadcastForm";
import { Card } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Broadcast — sydHustle Console" };

export default async function BroadcastPage() {
  const supabase = createServerSupabaseClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Broadcast</h1>
        <p className="text-sm text-muted-foreground">
          Sends an announcement to every user — in-app notification list plus
          a push to subscribed devices.
        </p>
      </div>

      <Card className="border-amber-500/30 p-4 text-sm text-muted-foreground">
        The app promises users it never sends promotional pushes — and that
        promise is part of our store compliance. Broadcasts are for things
        users need to know: maintenance, incidents, policy changes.
      </Card>

      <BroadcastForm recipientCount={count ?? 0} />
    </div>
  );
}
