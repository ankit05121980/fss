"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Box, CornerDownLeft, FlaskConical, Package, Search, Ship } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useSearch } from "@/lib/hooks/useAnalytics";
import { ALL_NAV_ITEMS } from "@/lib/utils/constants";
import type { TraceQueryType } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const TYPE_ICON: Record<TraceQueryType, LucideIcon> = {
  serial: Box,
  batch: Package,
  shipment: Ship,
  product: FlaskConical,
};

interface CommandItem {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: LucideIcon;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const { data: searchResults } = useSearch(query);

  // Global ⌘K / Ctrl+K shortcut.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const navMatches: CommandItem[] = ALL_NAV_ITEMS.filter(
    (n) => !q || n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q),
  ).map((n) => ({ id: `nav-${n.href}`, label: n.title, sublabel: n.description, href: n.href, icon: n.icon }));

  const recordMatches: CommandItem[] = (searchResults ?? []).map((r) => ({
    id: `rec-${r.type}-${r.id}`,
    label: r.label,
    sublabel: r.sublabel,
    href: r.href,
    icon: TYPE_ICON[r.type],
  }));

  const items = [...navMatches, ...recordMatches];

  // Keep the active index in range as the list changes.
  const clampedActive = Math.min(active, Math.max(0, items.length - 1));

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setActive(0);
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[clampedActive];
      if (item) go(item.href);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="hidden gap-2 text-muted-foreground lg:inline-flex"
      >
        <Search className="size-4" />
        <span className="text-xs">Quick nav</span>
        <kbd className="ml-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium">⌘K</kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Jump to a page, or search a serial / batch / shipment / product…"
              aria-label="Command palette input"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches found.</p>
            ) : (
              <>
                {navMatches.length > 0 && <SectionLabel>Pages</SectionLabel>}
                {navMatches.map((item, i) => (
                  <Row
                    key={item.id}
                    item={item}
                    active={clampedActive === i}
                    onSelect={() => go(item.href)}
                  />
                ))}
                {recordMatches.length > 0 && <SectionLabel>Records</SectionLabel>}
                {recordMatches.map((item, i) => (
                  <Row
                    key={item.id}
                    item={item}
                    active={clampedActive === navMatches.length + i}
                    onSelect={() => go(item.href)}
                  />
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function Row({
  item,
  active,
  onSelect,
}: {
  item: CommandItem;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
      )}
    >
      <Icon className="size-4 shrink-0 text-brand-blue" />
      <span className="font-medium text-foreground">{item.label}</span>
      <span className="ml-auto truncate text-xs text-muted-foreground">{item.sublabel}</span>
      {active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
    </button>
  );
}
