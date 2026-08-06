import Link from "next/link";
import { notFound } from "next/navigation";

import { AppealChat } from "@/components/console/AppealChat";
import { AppealDecision } from "@/components/console/AppealDecision";
import { Card } from "@/components/ui/card";
import {
  getAppeal,
  listAppealMessages,
  type AppealKind,
} from "@/lib/console/appeals";
import { naira, shortDate } from "@/lib/console/format";

export const metadata = { title: "Appeal — sydHustle Console" };

export default async function AppealDetailPage({
  params,
}: {
  params: Promise<{ kind: string; appealId: string }>;
}) {
  const { kind, appealId } = await params;
  if (kind !== "hustle" && kind !== "booking") notFound();

  const appeal = await getAppeal(kind as AppealKind, appealId);
  if (!appeal) notFound();

  const messages = await listAppealMessages(kind as AppealKind, appealId);
  const decided = appeal.resolvedAt !== null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted-foreground hover:text-white"
          href="/console/appeals"
        >
          ← All appeals
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {appeal.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{appeal.id}</span> · {appeal.kind} ·
          appealed {shortDate(appeal.appealedAt)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Amount held
          </p>
          <p className="mt-1 font-mono text-lg">{naira(appeal.amount)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Provider (paid)
          </p>
          <p className="mt-1 text-sm font-semibold">{appeal.providerName}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Hustler (worked)
          </p>
          <p className="mt-1 text-sm font-semibold">{appeal.hustlerName}</p>
        </Card>
      </div>

      {decided ? (
        <Card className="border-emerald-500/30 p-4 text-sm">
          <p className="font-semibold text-emerald-400">
            Decided — awarded to{" "}
            {appeal.awardedTo === "hustler"
              ? appeal.hustlerName
              : appeal.providerName}
          </p>
          <p className="mt-1 text-muted-foreground">
            {shortDate(appeal.resolvedAt!)}
          </p>
        </Card>
      ) : !appeal.escrowHeld ? (
        <Card className="border-amber-500/30 p-4 text-sm">
          <p className="font-semibold text-amber-400">
            No escrow is held for this appeal
          </p>
          <p className="mt-1 text-muted-foreground">
            It was settled elsewhere. Recording a decision here will close the
            appeal without moving money.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <AppealChat
          hustlerName={appeal.hustlerName}
          kind={appeal.kind}
          messages={messages}
          providerName={appeal.providerName}
          readOnly={decided}
          sourceId={appeal.id}
        />

        {decided ? null : (
          <AppealDecision
            amountLabel={naira(appeal.amount)}
            hustlerName={appeal.hustlerName}
            kind={appeal.kind}
            providerName={appeal.providerName}
            sourceId={appeal.id}
          />
        )}
      </div>
    </div>
  );
}
