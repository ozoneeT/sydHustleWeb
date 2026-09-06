"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/staff", label: "Staff" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      <nav className="flex items-center gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-white/10 font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form action="/admin/logout" method="post" className="ml-2">
        <Button type="submit" variant="ghost" size="sm">
          Log out
        </Button>
      </form>
    </div>
  );
}
