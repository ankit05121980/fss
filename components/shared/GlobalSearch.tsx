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
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
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
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border pr-3 pl-9 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        />
      </form>

      {open && value.trim().length >= 2 && (
        <div
          id="global-search-results"
          className="border-border bg-popover absolute top-11 right-0 left-0 z-50 overflow-hidden rounded-lg border shadow-lg"
        >
          {list.length === 0 ? (
            <p className="text-muted-foreground px-3 py-4 text-sm">
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
                      className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors"
                    >
                      <Icon className="text-brand-blue size-4 shrink-0" />
                      <span className="text-foreground font-medium">{r.label}</span>
                      <span className="text-muted-foreground ml-auto truncate text-xs">
                        {r.sublabel}
                      </span>
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
