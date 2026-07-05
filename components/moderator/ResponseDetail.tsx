import type { FullResponse } from "@/lib/moderator/data";
import { hustleTaskOptions } from "@/lib/hustle-tasks";
import {
  appUsageRoleLabels,
  concernOptions,
  hustleFrequencyLabels,
  label,
  labelFor,
  labelsFor,
  paymentPreferenceLabels,
  skillOptions,
  trustFactorOptions,
  uninstallOptions,
  yesNoLabels,
} from "@/lib/survey-options";

function Field({
  title,
  value,
  wide = false,
}: {
  title: string;
  value?: string | null;
  wide?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{title}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function TagField({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="sm:col-span-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{title}</dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-foreground"
          >
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-accent">{title}</h4>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

export function ResponseDetail({
  response: r,
  surveyorName,
}: {
  response: FullResponse;
  surveyorName?: string;
}) {
  const canDo = Object.entries(r.hustle_capability)
    .filter(([, v]) => v === "can_do")
    .map(([k]) => labelFor(hustleTaskOptions, k));
  const cannotDo = Object.entries(r.hustle_capability)
    .filter(([, v]) => v === "cannot_do")
    .map(([k]) => labelFor(hustleTaskOptions, k));

  const showsHustlerInfo =
    r.needs_extra_income === "yes" ||
    r.app_usage_role === "hustling_the_hustles" ||
    r.app_usage_role === "both";
  const showsProviderInfo =
    r.needs_extra_income === "no" ||
    r.app_usage_role === "providing_hustles" ||
    r.app_usage_role === "both" ||
    r.needs_task_help !== null;

  return (
    <div className="space-y-6">
      <Section title="Profile & contact">
        <Field title="Name" value={r.name} />
        <Field title="School" value={r.school} />
        <Field title="Email" value={r.email} />
        <Field title="Joined waitlist" value={label(yesNoLabels, r.join_waitlist)} />
        <Field title="Is a student" value={label(yesNoLabels, r.is_student)} />
        {surveyorName && <Field title="Surveyor" value={surveyorName} />}
        <Field title="Submitted" value={new Date(r.created_at).toLocaleString()} />
      </Section>

      {showsHustlerInfo && (
        <Section title="Hustling (offering services)">
          <Field title="Needs extra income" value={label(yesNoLabels, r.needs_extra_income)} />
          <Field title="Wants a side hustle" value={label(yesNoLabels, r.wants_side_hustle)} />
          <Field
            title="Hustle frequency"
            value={label(hustleFrequencyLabels, r.hustle_frequency)}
          />
          <Field
            title="Hours per day"
            value={r.hours_per_day !== null ? `${r.hours_per_day}h / day` : null}
          />
          <Field title="Has a skill" value={label(yesNoLabels, r.has_skill)} />
          <Field
            title="Would try a different hustle"
            value={label(yesNoLabels, r.willing_different_hustle)}
          />
          <TagField title="Skills" values={labelsFor(skillOptions, r.skills)} />
          <Field title="Other skill" value={r.skills_other} />
          <TagField title="Can do" values={canDo} />
          <TagField title="Can't do" values={cannotDo} />
        </Section>
      )}

      {showsProviderInfo && (
        <Section title="Needing help (posting tasks)">
          <Field title="Has needed task help" value={label(yesNoLabels, r.needs_task_help)} />
          <TagField
            title="Task types needed"
            values={labelsFor(hustleTaskOptions, r.task_help_types)}
          />
          <Field title="Other task" value={r.task_help_other} />
        </Section>
      )}

      <Section title="App fit & trust">
        <Field title="Would use the app" value={label(yesNoLabels, r.would_use_app)} />
        <Field
          title="Embarrassed hustling with a mate"
          value={label(yesNoLabels, r.embarrassed_with_mate)}
        />
        <Field title="Primary use" value={label(appUsageRoleLabels, r.app_usage_role)} />
        <Field
          title="Payment preference"
          value={label(paymentPreferenceLabels, r.payment_preference)}
        />
        <Field
          title="Willing to give 10% commission"
          value={label(yesNoLabels, r.commission_willingness)}
        />
        <TagField
          title="Uninstall reasons"
          values={labelsFor(uninstallOptions, r.uninstall_reasons)}
        />
        <Field title="Other uninstall reason" value={r.uninstall_other} />
        <TagField title="Concerns" values={labelsFor(concernOptions, r.concerns)} />
        <Field title="Other concern" value={r.concerns_other} />
        <TagField title="Trust factors" values={labelsFor(trustFactorOptions, r.trust_factors)} />
        <Field title="Other trust factor" value={r.trust_factors_other} />
      </Section>

      <Section title="Marketing team">
        <Field title="Would join marketing team" value={label(yesNoLabels, r.join_marketing_team)} />
        <Field title="WhatsApp number" value={r.marketing_whatsapp} />
      </Section>

      {r.additional_feedback && (
        <Section title="Additional feedback">
          <Field title="Feedback" value={r.additional_feedback} wide />
        </Section>
      )}
    </div>
  );
}
