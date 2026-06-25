"use client";

import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Gauge,
  PackageCheck,
  ShieldCheck,
  ThermometerSun,
  Users,
} from "lucide-react";

import { useExecutive } from "@/lib/hooks/useAnalytics";
import { fmtPct } from "@/lib/utils/format";
import { CHART_COLORS } from "@/lib/utils/constants";
import { KpiStrip } from "@/components/shared/KpiStrip";
import { ChartCard } from "@/components/shared/ChartCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarCompare } from "@/components/charts/BarCompare";
import { Heatmap } from "@/components/charts/Heatmap";
import { ChartSkeleton, KpiStripSkeleton } from "@/components/shared/LoadingSkeleton";
import { PredictiveAlertsStrip } from "@/components/predictive/PredictiveAlertsStrip";

export function ExecutiveView() {
  const { data, isLoading, isError } = useExecutive();

  if (isLoading)
    return (
      <div className="space-y-6">
        <KpiStripSkeleton count={7} />
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartSkeleton height={300} />
          <ChartSkeleton className="lg:col-span-2" height={300} />
        </div>
      </div>
    );

  if (isError || !data)
    return <EmptyState icon={Gauge} title="Couldn't load executive summary" description="Please retry." />;

  const { kpis } = data;
  const complianceStatus = kpis.overallComplianceScore >= 85 ? "success" : kpis.overallComplianceScore >= 70 ? "info" : "warning";

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          { label: "Overall Compliance", value: kpis.overallComplianceScore, icon: ShieldCheck, status: complianceStatus, hint: "/ 100", href: "/insights" },
          { label: "Traceability Coverage", value: fmtPct(kpis.traceabilityCoveragePct, 1), icon: PackageCheck, status: kpis.traceabilityCoveragePct >= 85 ? "success" : "warning", href: "/traceability" },
          { label: "Serialization Coverage", value: fmtPct(kpis.serializationCoveragePct, 1), icon: BadgeCheck, status: kpis.serializationCoveragePct >= 90 ? "success" : "warning", href: "/traceability" },
          { label: "Authorized Partners", value: fmtPct(kpis.authorizedPartnerPct, 1), icon: Users, status: kpis.authorizedPartnerPct >= 90 ? "success" : "warning", href: "/partners" },
          { label: "Recall Readiness", value: fmtPct(kpis.recallReadinessScore, 1), icon: Activity, status: kpis.recallReadinessScore >= 95 ? "success" : "warning", href: "/recall" },
          { label: "Open Compliance Risks", value: kpis.openComplianceRisks, icon: AlertTriangle, status: kpis.openComplianceRisks > 20 ? "danger" : "warning", href: "/control-tower" },
          { label: "Active Excursions", value: kpis.activeExcursions, icon: ThermometerSun, status: kpis.activeExcursions > 0 ? "danger" : "success", href: "/cold-chain" },
        ]}
      />

      <PredictiveAlertsStrip context="executive" />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Compliance score" description="Overall DSCSA readiness">
          <GaugeChart value={kpis.overallComplianceScore} label="readiness" height={220} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Weighted across coverage, partners, recall readiness and open risks.
          </p>
        </ChartCard>

        <ChartCard
          title="Compliance trend"
          description="Overall readiness over the last 12 weeks"
          className="lg:col-span-2"
        >
          <TrendChart
            data={data.complianceTrend}
            series={[{ key: "value", name: "Compliance score", color: CHART_COLORS[0] }]}
            yDomain={[60, 100]}
            unit=""
            height={240}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Risk heatmap" description="Risk events by category and severity">
          <Heatmap cells={data.riskHeatmap} />
        </ChartCard>

        <ChartCard title="Traceability & serialization coverage" description="Coverage trend over time">
          <TrendChart
            data={data.coverageTrend}
            series={[
              { key: "traceability", name: "Traceability", color: CHART_COLORS[0] },
              { key: "serialization", name: "Serialization", color: CHART_COLORS[3] },
            ]}
            yDomain={[70, 100]}
            unit="%"
            height={260}
          />
        </ChartCard>
      </div>

      <ChartCard title="Compliance violations by category" description="Open and resolved risk events by type">
        <BarCompare data={data.violationsByCategory} colorByIndex height={280} barName="Events" />
      </ChartCard>
    </div>
  );
}
