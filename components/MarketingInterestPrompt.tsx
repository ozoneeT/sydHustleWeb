"use client";

import { startTransition, useActionState, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitMarketingInterest, type ActionResult } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = { success: false, message: "" };

/**
 * Asked on the survey's "thank you" screen, after the response has already
 * been saved — decoupled from the survey itself so it doesn't hold up
 * submission. Updates the just-created survey_responses row via `responseId`.
 */
export function MarketingInterestPrompt({ responseId }: { responseId: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitMarketingInterest(formData),
    initialState
  );
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");

  const submit = (joinMarketingTeam: "yes" | "no", whatsappValue?: string) => {
    const fd = new FormData();
    fd.set("responseId", responseId);
    fd.set("joinMarketingTeam", joinMarketingTeam);
    if (whatsappValue) fd.set("marketingWhatsapp", whatsappValue);
    startTransition(() => {
      formAction(fd);
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
      <AnimatePresence mode="wait">
        {state.success ? (
          <motion.p
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-accent"
          >
            {state.message}
          </motion.p>
        ) : (
          <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-medium">
              Do you want to join the marketing team for sydHustle when the
              app launches?
            </p>

            {!showWhatsapp ? (
              <div className="mt-3 flex gap-3">
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setShowWhatsapp(true)}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => submit("no")}
                >
                  {isPending ? "Saving..." : "No"}
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <Label htmlFor="marketing-whatsapp">WhatsApp number</Label>
                <Input
                  id="marketing-whatsapp"
                  type="tel"
                  placeholder="e.g. +234 801 234 5678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending || whatsapp.trim() === ""}
                  onClick={() => submit("yes", whatsapp.trim())}
                >
                  {isPending ? "Saving..." : "Submit"}
                </Button>
              </div>
            )}

            {state.message && !state.success && (
              <p className="mt-2 text-sm text-red-400">{state.message}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
