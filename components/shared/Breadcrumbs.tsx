"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { NAV_GROUPS } from "@/lib/utils/constants";
import { fmtDateTime } from "@/lib/utils/date";
import { DEMO_NOW } from "@/lib/utils/date";

export function Breadcrumbs() {
  const pathname = usePathname();

  let group: string | undefined;
  let title: string | undefined;
  for (const g of NAV_GROUPS) {
    for (const item of g.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        group = g.label;
        title = item.title;
      }
    }
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"
    >
      <ol className="flex items-center gap-1.5">
        <li>
          <Link href="/executive" className="flex items-center gap-1 hover:text-foreground">
            <Home className="size-3.5" /> Lumenore
          </Link>
        </li>
        {group && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="size-3" />
            <span>{group}</span>
          </li>
        )}
        {title && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="size-3" />
            <span className="font-medium text-foreground">{title}</span>
          </li>
        )}
      </ol>
      <span className="hidden sm:inline" title="The demo dataset is a fixed point-in-time snapshot">
        Data as of {fmtDateTime(DEMO_NOW.toISOString())} UTC
      </span>
    </nav>
  );
}
