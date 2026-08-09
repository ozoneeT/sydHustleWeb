"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/console/overview", label: "Overview" },
  { href: "/console/earnings", label: "Earnings" },
  { href: "/console/costs", label: "Costs" },
  { href: "/console/users", label: "Users" },
  { href: "/console/subscribers", label: "Subscribers" },
  { href: "/console/transactions", label: "Transactions" },
  { href: "/console/withdrawals", label: "Withdrawals" },
  { href: "/console/appeals", label: "Appeals" },
  { href: "/console/identity", label: "Identity" },
  { href: "/console/location", label: "Location" },
  { href: "/console/moderation", label: "Moderation" },
  { href: "/console/broadcast", label: "Broadcast" },
];

export function ConsoleNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-white/10 font-semibold text-white"
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
