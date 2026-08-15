import { ReceiptStampCheck } from "@/components/console/ReceiptStampCheck";
import { requireConsole } from "@/lib/console/dal";

export const metadata = { title: "Receipt check — sydHustle Console" };

/**
 * Settling a payment dispute from the stamp on someone's receipt.
 *
 * Every receipt the app shares prints a 16 character authenticity stamp,
 * signed with a key that never leaves the database. Ask for it along with
 * the transaction ID: if it matches, the figures being quoted at us are
 * the ones we issued, and everything attached to that payment opens here.
 *
 * The stamp is not there for the user's benefit and the app never invites
 * them to check it. It is there so that a conversation about money can be
 * pinned to one exact ledger row instead of a screenshot and a memory.
 */
export default async function ReceiptsPage() {
  await requireConsole();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receipt check</h1>
        <p className="text-sm text-muted-foreground">
          Enter the transaction ID and the authenticity stamp from a
          user&apos;s receipt. A match opens both parties, every ledger entry
          on the payment, and each wallet before and after it.
        </p>
      </div>

      <ReceiptStampCheck />
    </div>
  );
}
