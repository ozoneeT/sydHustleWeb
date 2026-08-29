import { QuietHoursForm } from "@/components/console/QuietHoursForm";
import { Card } from "@/components/ui/card";
import { getQuietHours } from "@/lib/console/quiet-hours";

export const metadata = { title: "Quiet hours — sydHustle Console" };
export const dynamic = "force-dynamic";

export default async function QuietHoursPage() {
  const settings = await getQuietHours();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quiet hours</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The app sends students to meet strangers for money, and the hour is
          one of the biggest things that decides how safe that is. Quiet hours
          close the marketplace overnight: nothing new can be posted, applied
          to, booked, messaged or called until it reopens.
        </p>
      </div>

      {settings.enabled && settings.activeNow ? (
        <Card className="border-blue-500/40 bg-blue-500/5 p-4 text-sm text-blue-200">
          Quiet hours are running right now. The app is in its blue state and
          refusing new Hustles, applications, bookings, messages and calls,
          including inside Hustles already under way.
        </Card>
      ) : null}

      <Card className="p-5">
        <QuietHoursForm settings={settings} />
      </Card>

      <Card className="p-5 text-sm text-muted-foreground">
        <h2 className="mb-2 font-semibold text-foreground">
          What keeps working
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">The Panic button.</strong> It
            is never gated by this or anything else. The hours it would be
            switched off are the hours it exists for.
          </li>
          <li>
            Wallet balances, browsing, and everything else that does not put
            two people in a room together.
          </li>
          <li>
            Hustles already agreed are not cancelled, and a scheduled one
            stays scheduled.
          </li>
        </ul>
        <p className="mt-3 text-amber-300/90">
          <strong className="text-amber-200">
            But the two parties cannot reach each other.
          </strong>{" "}
          Messaging, calling and directions are blocked for everyone during
          the window, including a Hustler already on their way to a venue.
          That is deliberate, and it is the sharpest edge of this setting:
          somebody mid-journey at closing time can still raise the Panic
          button, and can do nothing else. Worth weighing when you choose
          where the window starts.
        </p>
        <p className="mt-3">
          Hustles also cannot be <em>scheduled for</em> a time inside the
          window, so the rule cannot be sidestepped by posting at lunchtime
          for 2am.
        </p>
      </Card>
    </div>
  );
}
