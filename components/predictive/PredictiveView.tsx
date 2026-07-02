"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, Minus, Radar, TrendingUp } from "lucide-react";

import { usePredictive } from "@/lib/hooks/useAnalytics";
import type { PartnerRiskScore, PredictiveScore } from "@/lib/data/types";
import { SEVERITY_META } from "@/lib/utils/constants";
import { KpiStrip } from "@/components/shared/KpiStrip";
import { ChartCard } from "@/components/shared/ChartCard";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { RiskScorePill } from "@/components/shared/RiskScorePill";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartSkeleton, KpiStripSkeleton } from "@/components/shared/LoadingSkeleton";

export function PredictiveView() {
  const router = useRouter();
  const { data, isLoading, isError } = usePredictive();

  const columns = React.useMemo<ColumnDef<PredictiveScore, unknown>[]>(
    () => [
      {
        accessorKey: "shipmentId",
        header: "Shipment",
        cell: ({ row }) => <span className="font-semibold">{row.original.shipmentId}</span>,
      },
      {
        accessorKey: "delayProbability",
        header: "Delay",
        cell: ({ row }) => (
          <RiskScorePill score={row.original.delayProbability} showLabel={false} />
        ),
      },
      {
        accessorKey: "excursionProbability",
        header: "Excursion",
        cell: ({ row }) => (
          <RiskScorePill score={row.original.excursionProbability} showLabel={false} />
        ),
      },
      {
        accessorKey: "recallExposure",
        header: "Recall",
        cell: ({ row }) => <RiskScorePill score={row.original.recallExposure} showLabel={false} />,
      },
      {
        accessorKey: "traceabilityFailureRisk",
        header: "Traceability",
        cell: ({ row }) => (
          <RiskScorePill score={row.original.traceabilityFailureRisk} showLabel={false} />
        ),
      },
      {
        id: "drivers",
        header: "Top drivers",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.topDrivers.slice(0, 2).map((d, i) => (
              <Badge key={i} variant="muted" className="font-normal">
                {d.factor}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  if (isLoading)
    return (
      <div className="space-y-6">
        <KpiStripSkeleton count={3} />
        <ChartSkeleton height={360} />
      </div>
    );

  if (isError || !data)
    return (
      <EmptyState icon={Radar} title="Couldn't load predictions" description="Please retry." />
    );

  const highRisk = data.scores.filter(
    (s) =>
      Math.max(
        s.delayProbability,
        s.excursionProbability,
        s.recallExposure,
        s.traceabilityFailureRisk,
      ) >= 70,
  ).length;
  const risingPartners = data.partnerScores.filter((p) => p.trend === "RISING").length;

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          {
            label: "Scored Active Shipments",
            value: data.scores.length,
            icon: Radar,
            status: "info",
            hint: "5 risk types each",
          },
          {
            label: "High-Risk Predictions",
            value: highRisk,
            icon: TrendingUp,
            status: highRisk > 0 ? "danger" : "success",
            hint: "≥ 70% any type",
          },
          {
            label: "Rising Partner Risks",
            value: risingPartners,
            icon: ArrowUpRight,
            status: risingPartners > 0 ? "warning" : "success",
          },
        ]}
      />

      {/* Predicted alerts */}
      <ChartCard
        title="Predicted alerts"
        description="Proactive risk identification"
        action={<Badge variant="muted">POC heuristic models</Badge>}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {data.alerts.map((a) => {
            const sev = SEVERITY_META[a.severity];
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => router.push(a.href)}
                className="border-border bg-card hover:border-brand-blue rounded-lg border p-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground text-sm font-semibold">{a.title}</span>
                  <Badge variant={sev.variant}>{sev.label}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{a.detail}</p>
              </button>
            );
          })}
        </div>
      </ChartCard>

      {/* Risk leaderboard */}
      <ChartCard
        title="Risk leaderboard"
        description="Five predictive risk types per active shipment — select a row to investigate"
        action={<Badge variant="muted">POC heuristic models</Badge>}
        dataFlow="risk-leaderboard"
      >
        <DataTable
          columns={columns}
          data={data.scores}
          searchPlaceholder="Filter shipments…"
          pageSize={10}
          onRowClick={(row) => router.push(`/traceability?type=shipment&q=${row.shipmentId}`)}
          initialSorting={[{ id: "delayProbability", desc: true }]}
          exportFilename="veritrace-risk-leaderboard"
        />
      </ChartCard>

      {/* Partner risk */}
      <ChartCard
        title="Trading-partner risk"
        description="Predicted partner compliance risk with drivers"
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.partnerScores.slice(0, 9).map((p) => (
            <PartnerRiskCard key={p.partnerId} partner={p} />
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function PartnerRiskCard({ partner }: { partner: PartnerRiskScore }) {
  const TrendIcon = partner.trend === "RISING" ? ArrowUpRight : Minus;
  const trendTone = partner.trend === "RISING" ? "text-danger" : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-foreground truncate text-sm font-medium">{partner.name}</span>
          <RiskScorePill score={partner.riskScore} showLabel={false} />
        </div>
        <div className={`mt-1 flex items-center gap-1 text-xs ${trendTone}`}>
          <TrendIcon className="size-3.5" /> {partner.trend.toLowerCase()}
        </div>
        {partner.topDrivers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {partner.topDrivers.map((d, i) => (
              <Badge key={i} variant="muted" className="font-normal">
                {d.factor}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
