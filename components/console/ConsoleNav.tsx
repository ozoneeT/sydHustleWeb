"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  BadgePercent,
  Banknote,
  CircleDollarSign,
  Fingerprint,
  Flag,
  Gavel,
  LayoutDashboard,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageSquareWarning,
  Receipt,
  ShieldAlert,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { ConsoleLogoutButton } from "@/components/console/ConsoleLogoutButton";
import { cn } from "@/lib/utils";

function NavPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent",
        pending ? "animate-pulse opacity-100" : "opacity-0"
      )}
    />
  );
}

type NavIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

type NavLink = {
  href: string;
  label: string;
  icon: NavIcon;
};

type NavGroup = {
  label: string;
  links: NavLink[];
};

const GROUPS: NavGroup[] = [
  {
    label: "Books",
    links: [
      { href: "/console/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/console/earnings", label: "Earnings", icon: CircleDollarSign },
      { href: "/console/costs", label: "Costs", icon: Receipt },
      { href: "/console/transactions", label: "Transactions", icon: Banknote },
      { href: "/console/withdrawals", label: "Withdrawals", icon: Wallet },
    ],
  },
  {
    label: "People",
    links: [
      { href: "/console/users", label: "Users", icon: Users },
      { href: "/console/subscribers", label: "Subscribers", icon: Mail },
      { href: "/console/identity", label: "Identity", icon: Fingerprint },
    ],
  },
  {
    label: "Risk",
    links: [
      { href: "/console/reports", label: "Reports", icon: Flag },
      { href: "/console/appeals", label: "Appeals", icon: Gavel },
      {
        href: "/console/review-appeals",
        label: "Review appeals",
        icon: MessageSquareWarning,
      },
      { href: "/console/moderation", label: "Moderation", icon: ShieldAlert },
      { href: "/console/location", label: "Location", icon: MapPin },
    ],
  },
  {
    label: "Ops",
    links: [
      { href: "/console/featured", label: "Subscriptions", icon: Sparkles },
      { href: "/console/promos", label: "Promotions", icon: BadgePercent },
      { href: "/console/broadcast", label: "Broadcast", icon: Megaphone },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBody({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
            <span className="text-sm font-black tracking-tight text-accent">sH</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">
              sydHustle <span className="text-accent">Console</span>
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Operator session
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.links.map((link) => {
                  const active = isActive(pathname, link.href);
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onNavigate}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-accent/10 font-semibold text-white"
                            : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {active && (
                          <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />
                        )}
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active
                              ? "text-accent"
                              : "text-muted-foreground group-hover:text-white/80"
                          )}
                          strokeWidth={1.75}
                        />
                        <span className="truncate">{link.label}</span>
                        <NavPendingHint />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <ConsoleLogoutButton />
      </div>
    </>
  );
}

export function ConsoleNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const activeLabel =
    GROUPS.flatMap((group) => group.links).find((link) =>
      isActive(pathname, link.href)
    )?.label ?? "Console";

  return (
    <div className="flex h-dvh overflow-hidden bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(45,212,191,0.08),transparent_55%),#0b1120]">
      {/* Desktop sidebar */}
      <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 bg-[#070d1a]/95 lg:flex">
        <SidebarBody pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#070d1a]/95 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold tracking-tight">
              {activeLabel}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              sydHustle Console
            </p>
          </div>
          <div className="w-9" aria-hidden />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex h-dvh w-[min(18rem,88vw)] flex-col border-r border-white/10 bg-[#070d1a] shadow-2xl transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarBody pathname={pathname} onNavigate={() => setOpen(false)} />
        </aside>
      </div>
    </div>
  );
}
