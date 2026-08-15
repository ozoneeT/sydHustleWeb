import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { VerifyReceipt } from "@/components/VerifyReceipt";

export const metadata: Metadata = {
  title: "Verify a receipt",
  description:
    "Check that a sydHustle payment receipt is genuine. Scan the stamp on the receipt, or type in the transaction ID and stamp code.",
  alternates: { canonical: "/verify" },
  // Nothing to index but this shell: every result depends on a token that
  // arrives in the URL fragment, which no crawler ever sees.
  robots: { index: true, follow: true },
};

/**
 * Receipt verification, for whoever was handed the receipt.
 *
 * Every receipt the app shares carries an HMAC over its own figures,
 * printed as a QR and as a 16 character code. This page is the only place
 * that signature can be checked, because the key that makes it never
 * leaves our database. Scanning the QR lands here with the signed payload
 * in the fragment and answers itself; typing the code needs the
 * transaction ID beside it.
 *
 * Public, and it has to be. The value of a stamp is that the person being
 * asked to trust a payment can check it themselves, without an account and
 * without waiting on support. Publishing the answer is not publishing the
 * key.
 */
export default function VerifyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Receipts
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Verify a receipt
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Every payment receipt from sydHustle is stamped with a signature
            only we can produce. Check one here to confirm it came from us
            and that its figures have not been changed.
          </p>

          <div className="mt-8">
            <VerifyReceipt />
          </div>

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            A stamp confirms who issued a receipt and that it has not been
            edited. It is not proof of who sent it to you. If anything about
            a payment looks wrong, email support@sydhustle.com with the
            transaction ID.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
