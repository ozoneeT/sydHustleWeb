"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  Monitor,
  Send,
  Smartphone,
  Users,
} from "lucide-react";

import {
  previewCampaignAudience,
  saveCampaign,
  sendTestEmail,
  type CampaignFormState,
  type TestSendState,
} from "@/lib/console/campaign-actions";
import {
  AUDIENCE_SOURCES,
  type EmailAudience,
} from "@/lib/email/audience-options";
import {
  CAMPAIGN_PRESETS,
  renderCampaignHtml,
  type CampaignContent,
} from "@/lib/email/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ComposerDefaults extends CampaignContent {
  name: string;
  audience: EmailAudience;
}

const emptyForm: CampaignFormState = { error: null };
const emptyTest: TestSendState = { error: null, sentTo: null };

const FIELD =
  "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent/50";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * The campaign editor.
 *
 * The preview on the right is rendered by the same `renderCampaignHtml`
 * the send uses, in an iframe, so what the operator approves is byte-for-
 * byte what leaves the building. A preview built from a second, "close
 * enough" renderer is the standard way a broken email gets sent to
 * everyone at once.
 */
export function CampaignComposer({
  campaignId,
  defaults,
  readOnly = false,
}: {
  campaignId: string | null;
  defaults: ComposerDefaults;
  readOnly?: boolean;
}) {
  const [content, setContent] = useState<CampaignContent & { name: string }>({
    name: defaults.name,
    subject: defaults.subject,
    preheader: defaults.preheader ?? "",
    heading: defaults.heading ?? "",
    body: defaults.body,
    ctaLabel: defaults.ctaLabel ?? "",
    ctaUrl: defaults.ctaUrl ?? "",
    imageUrl: defaults.imageUrl ?? "",
    footerNote: defaults.footerNote ?? "",
  });
  const [audience, setAudience] = useState<EmailAudience>(defaults.audience);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [testEmail, setTestEmail] = useState("");

  const [saveState, saveAction, saving] = useActionState(
    saveCampaign.bind(null, campaignId),
    emptyForm
  );
  const [testState, testAction, testing] = useActionState(sendTestEmail, emptyTest);

  const [preview, setPreview] = useState<{
    count: number;
    named: number;
    suppressed: number;
  } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  /**
   * The recipient count is re-asked for on every audience change, debounced.
   * `cancelled` matters more than the debounce: two edits in quick succession
   * produce two in-flight queries and the slower one isn't necessarily the
   * older one, so without the guard a stale count can land last — and this
   * is the one number on the page that has to be right before anyone presses
   * send.
   */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      previewCampaignAudience(audience)
        .then((result) => {
          if (cancelled) return;
          setPreview(result);
          setPreviewFailed(false);
        })
        .catch(() => {
          if (cancelled) return;
          setPreview(null);
          setPreviewFailed(true);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [audience]);

  const previewHtml = useMemo(
    () =>
      renderCampaignHtml({
        ...content,
        subject: content.subject || "(no subject yet)",
        body: content.body || "Your message will appear here.",
        recipientName: "Adebimpe Obaleye",
        preview: true,
      }),
    [content]
  );

  function set<K extends keyof typeof content>(key: K, value: (typeof content)[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  function loadPreset(id: string) {
    const preset = CAMPAIGN_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setContent({
      name: preset.content.name || content.name,
      subject: preset.content.subject,
      preheader: preset.content.preheader ?? "",
      heading: preset.content.heading ?? "",
      body: preset.content.body,
      ctaLabel: preset.content.ctaLabel ?? "",
      ctaUrl: preset.content.ctaUrl ?? "",
      imageUrl: preset.content.imageUrl ?? "",
      footerNote: preset.content.footerNote ?? "",
    });
  }

  return (
    <div className="grid gap-6 min-[1360px]:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
      <form action={saveAction} className="space-y-5" id="campaign-form">
        {/* Mirrored into the test-send form below, which posts the same fields. */}
        <input type="hidden" name="source" value={audience.source} />
        <input type="hidden" name="school" value={audience.school ?? ""} />

        {!readOnly && (
          <Section
            title="Start from a template"
            hint="Presets fill the fields in — everything stays editable."
          >
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.description}
                  onClick={() => loadPreset(preset.id)}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="Who it goes to">
          <div className="grid gap-2 sm:grid-cols-2">
            {AUDIENCE_SOURCES.map((source) => (
              <button
                key={source.value}
                type="button"
                disabled={readOnly}
                onClick={() => setAudience({ ...audience, source: source.value })}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors disabled:opacity-60",
                  audience.source === source.value
                    ? "border-accent/40 bg-accent/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <p className="text-sm font-medium">{source.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{source.hint}</p>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="school-filter">Narrow by school (optional)</Label>
            <input
              id="school-filter"
              className={FIELD}
              disabled={readOnly}
              placeholder="EKSU"
              value={audience.school ?? ""}
              onChange={(e) => setAudience({ ...audience, school: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <Users className="h-4 w-4 shrink-0 text-accent" />
            {previewFailed ? (
              <span className="text-amber-300">
                Couldn&apos;t count the audience — try again before sending.
              </span>
            ) : preview ? (
              <span>
                <span className="font-semibold text-accent">
                  {preview.count.toLocaleString()}
                </span>{" "}
                {preview.count === 1 ? "person" : "people"} ·{" "}
                {preview.named.toLocaleString()} we can greet by name ·{" "}
                {preview.suppressed.toLocaleString()} unsubscribed and excluded
              </span>
            ) : (
              <span className="text-muted-foreground">Counting…</span>
            )}
          </div>
        </Section>

        <Section title="The email" hint="Use {{first_name}} anywhere to personalise it.">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign name (internal)</Label>
            <Input
              id="name"
              name="name"
              required
              disabled={readOnly}
              value={content.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Pre-launch sign-up invite"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject line</Label>
            <Input
              id="subject"
              name="subject"
              required
              disabled={readOnly}
              value={content.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Your sydHustle account is ready to claim"
            />
            <p className="text-xs text-muted-foreground">
              {content.subject.length} characters — under 50 survives a phone
              inbox without being cut off.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preheader">Preview text</Label>
            <Input
              id="preheader"
              name="preheader"
              disabled={readOnly}
              value={content.preheader ?? ""}
              onChange={(e) => set("preheader", e.target.value)}
              placeholder="The grey line shown after the subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heading">Heading</Label>
            <Input
              id="heading"
              name="heading"
              disabled={readOnly}
              value={content.heading ?? ""}
              onChange={(e) => set("heading", e.target.value)}
              placeholder="{{first_name}}, sydHustle is nearly here"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              required
              rows={12}
              disabled={readOnly}
              value={content.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder={"Hi {{first_name}},\n\nLeave a blank line between paragraphs."}
            />
            <p className="text-xs text-muted-foreground">
              Plain text. Blank lines become paragraphs; the layout is applied
              for you.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">Button label</Label>
              <Input
                id="ctaLabel"
                name="ctaLabel"
                disabled={readOnly}
                value={content.ctaLabel ?? ""}
                onChange={(e) => set("ctaLabel", e.target.value)}
                placeholder="Claim my early spot"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaUrl">Button link</Label>
              <Input
                id="ctaUrl"
                name="ctaUrl"
                type="url"
                disabled={readOnly}
                value={content.ctaUrl ?? ""}
                onChange={(e) => set("ctaUrl", e.target.value)}
                placeholder="https://sydhustle.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Banner image URL (optional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              disabled={readOnly}
              value={content.imageUrl ?? ""}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://sydhustle.com/sydhustle-logo-light.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerNote">Closing note (optional)</Label>
            <Textarea
              id="footerNote"
              name="footerNote"
              rows={2}
              disabled={readOnly}
              value={content.footerNote ?? ""}
              onChange={(e) => set("footerNote", e.target.value)}
              placeholder="Questions? Just reply to this email."
            />
          </div>
        </Section>

        {saveState.error && (
          <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {saveState.error}
          </p>
        )}

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : campaignId ? (
                "Save draft"
              ) : (
                "Create draft"
              )}
            </Button>
            {saveState.saved && !saving && (
              <span className="flex items-center gap-1.5 text-sm text-accent">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        )}
      </form>

      <div className="space-y-4 min-[1360px]:sticky min-[1360px]:top-6 min-[1360px]:self-start">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Preview</h2>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-label="Desktop preview"
              className={cn(
                "rounded-full p-1.5 transition-colors",
                device === "desktop" ? "bg-accent/20 text-accent" : "text-muted-foreground"
              )}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              aria-label="Mobile preview"
              className={cn(
                "rounded-full p-1.5 transition-colors",
                device === "mobile" ? "bg-accent/20 text-accent" : "text-muted-foreground"
              )}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-3 space-y-0.5 rounded-xl bg-white/5 px-3 py-2">
            <p className="truncate text-sm font-semibold">
              {content.subject || "(no subject yet)"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {content.preheader || "No preview text set"}
            </p>
          </div>
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            sandbox=""
            className={cn(
              "mx-auto block h-[640px] rounded-xl border-0 bg-white transition-all",
              device === "mobile" ? "w-[390px] max-w-full" : "w-full"
            )}
          />
        </div>

        {!readOnly && (
          <form action={testAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div>
              <h2 className="text-sm font-semibold">Send yourself a test</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A real email, rendered exactly like the campaign. Always do this
                before sending to everyone.
              </p>
            </div>

            {/* The test renders from what's on screen, not from the saved
                draft, so unsaved edits can be checked too. */}
            <input type="hidden" name="subject" value={content.subject} />
            <input type="hidden" name="name" value={content.name || "Test"} />
            <input type="hidden" name="preheader" value={content.preheader ?? ""} />
            <input type="hidden" name="heading" value={content.heading ?? ""} />
            <input type="hidden" name="body" value={content.body} />
            <input type="hidden" name="ctaLabel" value={content.ctaLabel ?? ""} />
            <input type="hidden" name="ctaUrl" value={content.ctaUrl ?? ""} />
            <input type="hidden" name="imageUrl" value={content.imageUrl ?? ""} />
            <input type="hidden" name="footerNote" value={content.footerNote ?? ""} />
            <input type="hidden" name="testName" value="Adebimpe Obaleye" />

            <div className="flex gap-2">
              <Input
                name="testEmail"
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@sydhustle.com"
              />
              <Button type="submit" variant="secondary" disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Test
              </Button>
            </div>

            {testState.error && <p className="text-sm text-red-400">{testState.error}</p>}
            {testState.sentTo && (
              <p className="flex items-center gap-1.5 text-sm text-accent">
                <Check className="h-4 w-4" /> Test sent to {testState.sentTo}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
