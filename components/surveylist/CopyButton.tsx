"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard that shows its own result. Outreach means going down
 * this list one contact at a time, so the confirmation has to be on the row
 * you clicked — a toast somewhere else is no help at row 200.
 */
export function useCopy(resetAfterMs = 1600) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API needs a secure context; fall back to a hidden textarea.
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(el);
      }
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), resetAfterMs);
  }

  return { copied, copy };
}

/**
 * A value that copies itself when clicked — the whole cell is the target, so
 * there's nothing small to hit.
 */
export function CopyValue({
  value,
  className,
  title,
}: {
  value: string;
  className?: string;
  title?: string;
}) {
  const { copied, copy } = useCopy();

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      title={title ?? `Copy ${value}`}
      className={cn(
        "group/copy inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        copied && "bg-accent/15",
        className
      )}
    >
      <span className={cn("truncate", copied && "text-accent")}>{value}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/copy:opacity-100" />
      )}
    </button>
  );
}
