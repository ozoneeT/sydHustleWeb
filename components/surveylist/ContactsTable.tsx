"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Search,
  Users,
} from "lucide-react";
import type { SurveyContact } from "@/lib/survey/contacts";
import { CopyValue, useCopy } from "@/components/surveylist/CopyButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterId =
  | "all"
  | "email"
  | "marketing"
  | "waitlist"
  | "moderators"
  | "missing";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "email", label: "Has email" },
  { id: "marketing", label: "Marketing team" },
  { id: "waitlist", label: "Waitlist" },
  { id: "moderators", label: "Moderators" },
  { id: "missing", label: "No email" },
];

const PAGE_SIZE = 50;

function matchesFilter(c: SurveyContact, filter: FilterId): boolean {
  switch (filter) {
    case "email":
      return Boolean(c.email);
    case "marketing":
      return c.joinMarketing === "yes";
    case "waitlist":
      return c.joinWaitlist === "yes";
    case "moderators":
      return c.moderator;
    case "missing":
      return !c.email;
    default:
      return true;
  }
}

function matchesQuery(c: SurveyContact, q: string): boolean {
  if (!q) return true;
  const haystack = [c.name, c.email, c.phone, c.school, c.primaryUse, c.collectedBy]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function csvCell(value: string | null): string {
  const v = value ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-4",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "warning" && "bg-amber-400/15 text-amber-300",
        tone === "neutral" && "bg-white/10 text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

/** An address, one click from the clipboard, with a mail link beside it. */
function EmailValue({ contact, className }: { contact: SurveyContact; className?: string }) {
  if (!contact.email) {
    return (
      <span className="px-1.5 text-muted-foreground">
        {contact.moderatorOnly ? "Not on file" : "—"}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <CopyValue value={contact.email} className={cn("font-mono text-xs", className)} />
      <a
        href={`mailto:${contact.email}`}
        title={`Email ${contact.email}`}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-accent"
      >
        <Mail className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

/** The number they gave for the marketing team, and a way into WhatsApp. */
function PhoneValue({ contact }: { contact: SurveyContact }) {
  if (!contact.phone) {
    return <span className="px-1.5 text-muted-foreground">—</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <CopyValue value={contact.phone} className="font-mono text-xs" />
      <a
        href={`https://wa.me/${contact.phone.replace(/[^\d]/g, "")}`}
        target="_blank"
        rel="noreferrer"
        title="Open WhatsApp"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-accent"
      >
        <Users className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

/** Name plus whatever this row needs flagging for. */
function ContactName({ contact }: { contact: SurveyContact }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-medium", !contact.name && "text-muted-foreground")}>
          {contact.name ?? "Anonymous"}
        </span>
        {contact.moderator && (
          <Badge tone="accent">
            {contact.moderatorRole === "admin" ? "Admin" : "Moderator"}
            {contact.responsesCollected > 0 && ` · ${contact.responsesCollected}`}
          </Badge>
        )}
        {contact.duplicateEmail && <Badge>Duplicate</Badge>}
      </div>
      {contact.collectedBy && (
        <p className="mt-0.5 text-xs text-muted-foreground">via {contact.collectedBy}</p>
      )}
    </>
  );
}

/**
 * The same contact as a card, for phones — a table this wide would be all
 * sideways scrolling on a 375px screen, and outreach often happens standing up.
 */
function ContactCard({ contact, index }: { contact: SurveyContact; index: number }) {
  return (
    <div className="border-b border-white/5 px-4 py-4 last:border-0">
      <div className="flex items-start gap-3">
        <span className="pt-0.5 text-xs tabular-nums text-muted-foreground">{index}</span>
        <div className="min-w-0 flex-1 space-y-2">
          <ContactName contact={contact} />

          <div className="-ml-1.5 space-y-1">
            <EmailValue contact={contact} className="max-w-full" />
            {contact.phone && <PhoneValue contact={contact} />}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {contact.school && <span>{contact.school}</span>}
            {!contact.moderatorOnly && <span>{contact.primaryUseShort}</span>}
            {contact.joinMarketing === "yes" && <Badge tone="accent">Marketing</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Page numbers with the current page always in the middle of the window. */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= pageCount - 2)
    [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) out.push("gap");
    out.push(p);
    previous = p;
  }
  return out;
}

function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  function go(next: number) {
    onChange(Math.min(Math.max(next, 1), pageCount));
    // A new page starts at the top of the table, not wherever the last row ended.
    document.getElementById("contacts-table")?.scrollIntoView({ block: "start" });
  }

  return (
    <nav aria-label="Contacts pages" className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs font-medium transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Prev
      </button>

      {pageWindow(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "h-8 min-w-8 rounded-lg border px-2 text-xs font-medium tabular-nums transition-colors",
              p === page
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page === pageCount}
        aria-label="Next page"
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs font-medium transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}

/**
 * The pre-launch contact sheet: one row per person we heard from, with the
 * two things an invite actually needs — an address and a number — sitting a
 * single click from the clipboard.
 */
export function ContactsTable({ contacts }: { contacts: SurveyContact[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [page, setPage] = useState(1);
  const { copied: copiedEmails, copy: copyEmails } = useCopy(2200);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () => contacts.filter((c) => matchesFilter(c, filter) && matchesQuery(c, q)),
    [contacts, filter, q]
  );

  // De-duplicated, because a mailing list doesn't want the same address
  // twice — 24 people took the survey more than once.
  const uniqueEmails = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of filtered) {
      const email = c.email?.trim();
      if (!email) continue;
      const key = email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(email);
    }
    return out;
  }, [filtered]);

  function downloadCsv() {
    const header = [
      "Name",
      "Email",
      "Phone",
      "School",
      "Primary use",
      "Would join marketing",
      "Waitlist",
      "Moderator",
      "Collected by",
      "Submitted",
    ];
    const lines = [header.join(",")];
    for (const c of filtered) {
      lines.push(
        [
          csvCell(c.name),
          csvCell(c.email),
          csvCell(c.phone),
          csvCell(c.school),
          csvCell(c.moderatorOnly ? "" : c.primaryUse),
          csvCell(c.joinMarketing === "yes" ? "Yes" : c.joinMarketing === "no" ? "No" : ""),
          csvCell(c.joinWaitlist === "yes" ? "Yes" : c.joinWaitlist === "no" ? "No" : ""),
          csvCell(c.moderator ? "Yes" : ""),
          csvCell(c.collectedBy),
          csvCell(c.submittedAt ? new Date(c.submittedAt).toISOString() : ""),
        ].join(",")
      );
    }

    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sydhustle-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const shown = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone or school…"
            className="h-11 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent/50 focus:bg-white/[0.07]"
          />
        </div>

        <Button
          type="button"
          size="sm"
          variant={copiedEmails ? "default" : "secondary"}
          disabled={uniqueEmails.length === 0}
          onClick={() => copyEmails(uniqueEmails.join(", "))}
        >
          {copiedEmails ? (
            <>
              <Check className="h-4 w-4" />
              {uniqueEmails.length} copied
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Copy {uniqueEmails.length} email{uniqueEmails.length === 1 ? "" : "s"}
            </>
          )}
        </Button>

        <Button type="button" size="sm" variant="secondary" onClick={downloadCsv}>
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count = contacts.filter(
            (c) => matchesFilter(c, f.id) && matchesQuery(c, q)
          ).length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
            >
              {f.label}
              <span className={cn("ml-1.5 tabular-nums", active ? "text-accent/70" : "opacity-60")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="contacts-table"
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] scroll-mt-20"
      >
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="w-12 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Primary use</th>
                <th className="px-4 py-3 font-medium">Marketing</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 align-top last:border-0 hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">
                    {start + i + 1}
                  </td>
                  <td className="min-w-[190px] px-4 py-3">
                    <ContactName contact={c} />
                  </td>
                  <td className="px-4 py-3">
                    <EmailValue contact={c} className="max-w-[260px]" />
                  </td>
                  <td className="px-4 py-3">
                    <PhoneValue contact={c} />
                  </td>
                  <td className="min-w-[140px] px-4 py-3 text-muted-foreground">
                    {c.school ?? "—"}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-muted-foreground"
                    title={c.moderatorOnly ? undefined : c.primaryUse}
                  >
                    {c.moderatorOnly ? "—" : c.primaryUseShort}
                  </td>
                  <td className="px-4 py-3">
                    {c.joinMarketing === "yes" ? (
                      <Badge tone="accent">Yes</Badge>
                    ) : c.joinMarketing === "no" ? (
                      <Badge>No</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nobody matches that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden">
          {shown.map((c, i) => (
            <ContactCard key={c.id} contact={c} index={start + i + 1} />
          ))}
          {shown.length === 0 && (
            <p className="px-4 py-12 text-center text-muted-foreground">
              Nobody matches that search.
            </p>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {start + 1}–{start + shown.length} of {filtered.length}
            </p>
            {pageCount > 1 && (
              <Pager page={current} pageCount={pageCount} onChange={setPage} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
