import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { UnsubscribeActions } from "@/components/UnsubscribeActions";
import { emailFromToken } from "@/lib/email/unsubscribe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unsubscribe — sydHustle",
  robots: { index: false, follow: false },
};

async function isSuppressed(email: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("email_unsubscribes")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * The page a reader lands on from the footer link.
 *
 * It does not unsubscribe them on arrival: a link preview fetcher or a
 * corporate scanner opening every URL in an email would otherwise
 * unsubscribe people who never clicked. The token proves who they are;
 * the button is what acts.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const { token, done } = await searchParams;
  const email = emailFromToken(token);
  const already = email ? await isSuppressed(email) : false;

  return (
    <>
      <SiteHeader />
      <main className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob-a absolute left-1/2 top-[-160px] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/15 blur-[130px]" />
        </div>

        <Card className="w-full max-w-md p-8">
          {!email ? (
            <>
              <h1 className="text-xl font-bold tracking-tight">
                This link has expired
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We couldn&apos;t tell which address this link belongs to. Open the
                unsubscribe link straight from one of our emails, or reply to any
                of them and we&apos;ll take you off the list by hand.
              </p>
            </>
          ) : already || done ? (
            <>
              <h1 className="text-xl font-bold tracking-tight">You&apos;re unsubscribed</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We won&apos;t send any more marketing emails to{" "}
                <span className="font-medium text-foreground">{email}</span>. Emails
                you ask for yourself — a verification code, say — still come
                through.
              </p>
              <UnsubscribeActions email={email} token={token ?? ""} subscribed={false} />
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight">
                Stop emails to this address?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;ll stop sending marketing emails to{" "}
                <span className="font-medium text-foreground">{email}</span>{" "}
                straight away.
              </p>
              <UnsubscribeActions email={email} token={token ?? ""} subscribed />
            </>
          )}
        </Card>
      </main>
      <Footer />
    </>
  );
}
