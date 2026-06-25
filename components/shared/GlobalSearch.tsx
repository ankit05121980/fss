"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Box, FlaskConical, Package, Search, Ship } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useSearch } from "@/lib/hooks/useAnalytics";
import type { SearchResult, TraceQueryType } from "@/lib/data/types";

const TYPE_ICON: Record<TraceQueryType, typeof Box> = {
  serial: Box,
  batch: Package,
  shipment: Ship,
  product: FlaskConical,
};

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const { data: results } = useSearch(value);
  const containerRef = React.useRef<HTMLDivElement>(null);

  function go(href: string) {
    setOpen(false);
    setValue("");
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    go(`/traceability?q=${encodeURIComponent(q)}`);
  }

  const list: SearchResult[] = results ?? [];

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <form onSubmit={submit} role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search serial, batch, shipment or product…"
          aria-label="Global search"
          role="combobox"
          aria-controls="global-search-results"
          aria-expanded={open}
          className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      {open && value.trim().length >= 2 && (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          {list.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No matches. Press Enter to open full traceability search.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {list.map((r) => {
                const Icon = TYPE_ICON[r.type];
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(r.href)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <Icon className="size-4 shrink-0 text-brand-blue" />
                      <span className="font-medium text-foreground">{r.label}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">{r.sublabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
