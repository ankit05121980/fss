"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb, Pin, PinOff, Search, Sparkles, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useInsights } from "@/lib/hooks/useAnalytics";
import { SEVERITY_META } from "@/lib/utils/constants";
import type { Insight, InsightCategory } from "@/lib/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarCompare } from "@/components/charts/BarCompare";
import { GridSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SEV_RANK: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export function InsightsView() {
  const { data, isLoading, isError } = useInsights();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("ALL");
  const [sort, setSort] = React.useState<string>("impact");
  const [pinned, setPinned] = React.useState<Set<string>>(new Set());
  const [selected, setSelected] = React.useState<Insight | null>(null);

  const categories = React.useMemo(
    () => Array.from(new Set((data ?? []).map((i) => i.category))) as InsightCategory[],
    [data],
  );

  const visible = React.useMemo(() => {
    let list = [...(data ?? [])];
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.headline.toLowerCase().includes(q) ||
          i.detail.toLowerCase().includes(q),
      );
    if (category !== "ALL") list = list.filter((i) => i.category === category);
    list.sort((a, b) => {
      const pa = pinned.has(a.id) ? 1 : 0;
      const pb = pinned.has(b.id) ? 1 : 0;
      if (pa !== pb) return pb - pa;
      if (sort === "az") return a.title.localeCompare(b.title);
      return SEV_RANK[b.severity] - SEV_RANK[a.severity];
    });
    return list;
  }, [data, query, category, sort, pinned]);

  function togglePin(id: string) {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) return <GridSkeleton count={6} height={260} />;
  if (isError || !data)
    return <EmptyState icon={Lightbulb} title="Couldn't load insights" description="Please retry." />;

  const highImpact = data.filter((i) => i.severity === "HIGH").length;

  return (
    <div className="space-y-5">
      {/* Summary + toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3.5" /> {data.length} insights
          </Badge>
          <Badge variant="danger" className="gap-1">
            <TrendingUp className="size-3.5" /> {highImpact} high impact
          </Badge>
          {pinned.size > 0 && <Badge variant="info">{pinned.size} pinned</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search insights…"
              aria-label="Search insights"
              className="border-input bg-card focus-visible:ring-ring h-9 w-52 rounded-md border pr-3 pl-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40" aria-label="Sort insights">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impact">Sort: Impact</SelectItem>
              <SelectItem value="az">Sort: A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip label="All" active={category === "ALL"} onClick={() => setCategory("ALL")} />
        {categories.map((c) => (
          <CategoryChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No matching insights" description="Try a different search or category." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-flow="insights">
          {visible.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              pinned={pinned.has(insight.id)}
              onPin={() => togglePin(insight.id)}
              onOpen={() => setSelected(insight)}
            />
          ))}
        </div>
      )}

      <InsightDialog insight={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand-blue bg-brand-surface-2 text-brand-navy"
          : "border-border text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}

function InsightCard({
  insight,
  pinned,
  onPin,
  onOpen,
}: {
  insight: Insight;
  pinned: boolean;
  onPin: () => void;
  onOpen: () => void;
}) {
  const sev = SEVERITY_META[insight.severity];
  return (
    <Card className="flex flex-col transition-colors hover:border-brand-blue">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="muted">{insight.category}</Badge>
            <Badge variant={sev.variant}>{sev.label} impact</Badge>
          </div>
          <button
            type="button"
            onClick={onPin}
            aria-label={pinned ? "Unpin insight" : "Pin insight"}
            className="text-muted-foreground hover:text-brand-blue"
          >
            {pinned ? <Pin className="size-4 fill-brand-blue text-brand-blue" /> : <PinOff className="size-4" />}
          </button>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <CardTitle className="text-sm">{insight.title}</CardTitle>
          <span className="text-brand-blue text-2xl font-bold tabular-nums">{insight.value}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="text-foreground text-sm font-medium">{insight.headline}</p>
        <div className="mt-3 flex-1">
          {insight.chart.length > 0 ? (
            <BarCompare data={insight.chart} colorByIndex height={150} />
          ) : (
            <div className="text-muted-foreground flex h-[150px] items-center justify-center text-xs">
              No data
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" className="mt-2 self-start px-2" onClick={onOpen}>
          View details <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

function InsightDialog({
  insight,
  onOpenChange,
}: {
  insight: Insight | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!insight} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        {insight && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="muted">{insight.category}</Badge>
                <Badge variant={SEVERITY_META[insight.severity].variant}>
                  {SEVERITY_META[insight.severity].label} impact
                </Badge>
              </div>
              <DialogTitle className="mt-1">{insight.headline}</DialogTitle>
              <DialogDescription>{insight.detail}</DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border p-2">
              <BarCompare data={insight.chart} colorByIndex height={240} />
            </div>

            <div className="border-brand-blue/30 bg-brand-surface-2/50 rounded-lg border p-3">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
                Recommended action
              </p>
              <p className="text-foreground mt-0.5 text-sm">{insight.recommendedAction}</p>
            </div>

            <div className="flex justify-end">
              <Button asChild size="sm">
                <Link href={insight.href}>
                  Investigate in dashboard <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
