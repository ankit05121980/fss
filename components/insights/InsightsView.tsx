"use client";

import { Lightbulb, TrendingUp } from "lucide-react";

import { useInsights } from "@/lib/hooks/useAnalytics";
import type { Insight } from "@/lib/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarCompare } from "@/components/charts/BarCompare";
import { GridSkeleton } from "@/components/shared/LoadingSkeleton";

export function InsightsView() {
  const { data, isLoading, isError } = useInsights();

  if (isLoading) return <GridSkeleton count={6} height={260} />;
  if (isError || !data)
    return (
      <EmptyState icon={Lightbulb} title="Couldn't load insights" description="Please retry." />
    );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-flow="insights">
      {data.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="gap-1">
            <Lightbulb className="size-3" /> Do You Know
          </Badge>
          <span className="text-brand-blue text-2xl font-bold tabular-nums">{insight.value}</span>
        </div>
        <CardTitle className="mt-2 text-sm">{insight.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="text-foreground text-sm font-medium">{insight.headline}</p>
        <p className="text-muted-foreground mt-1 text-xs">{insight.detail}</p>
        <div className="mt-3 flex-1">
          {insight.chart.length > 0 ? (
            <BarCompare data={insight.chart} colorByIndex height={180} />
          ) : (
            <div className="text-muted-foreground flex h-[180px] items-center justify-center text-xs">
              <TrendingUp className="mr-1 size-4" /> No data
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
