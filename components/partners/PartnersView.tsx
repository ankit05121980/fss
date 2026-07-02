"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertOctagon, FileWarning, Network, ShieldX, Users } from "lucide-react";

import { usePartnersAnalytics } from "@/lib/hooks/useAnalytics";
import { fmtNumber, fmtPct } from "@/lib/utils/format";
import { fmtDate } from "@/lib/utils/date";
import { KpiStrip } from "@/components/shared/KpiStrip";
import { ChartCard } from "@/components/shared/ChartCard";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RiskScorePill } from "@/components/shared/RiskScorePill";
import { ScatterRisk } from "@/components/charts/ScatterRisk";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartSkeleton, KpiStripSkeleton } from "@/components/shared/LoadingSkeleton";
import type { TradingPartner } from "@/lib/data/types";

export function PartnersView() {
  const { data, isLoading, isError } = usePartnersAnalytics();

  const columns = React.useMemo<ColumnDef<TradingPartner, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Partner",
        cell: ({ row }) => <span className="text-foreground font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <Badge variant="muted">{row.original.role.replaceAll("_", " ")}</Badge>,
      },
      {
        accessorKey: "auth",
        header: "Authorization",
        cell: ({ row }) => <StatusBadge kind="auth" value={row.original.auth} />,
      },
      {
        accessorKey: "license",
        header: "Licence",
        cell: ({ row }) => <StatusBadge kind="license" value={row.original.license} />,
      },
      {
        accessorKey: "licenseExpiry",
        header: "Licence Expiry",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {fmtDate(row.original.licenseExpiry)}
          </span>
        ),
      },
      {
        accessorKey: "riskScore",
        header: "Risk",
        cell: ({ row }) => <RiskScorePill score={row.original.riskScore} />,
      },
    ],
    [],
  );

  if (isLoading)
    return (
      <div className="space-y-6">
        <KpiStripSkeleton count={4} />
        <ChartSkeleton height={340} />
      </div>
    );

  if (isError || !data)
    return (
      <EmptyState icon={Network} title="Couldn't load partner data" description="Please retry." />
    );

  const { kpis, partners } = data;

  const unauthorized = partners.filter((p) => p.auth === "UNAUTHORIZED");
  const expired = partners.filter((p) => p.license === "EXPIRED");
  const expiringSoon = partners.filter((p) => p.license === "EXPIRING_SOON");

  // Suspect-product signals (counterfeit / diverted / unauthorized)
  const suspectSignals = [
    ...data.unauthorizedInteractions.map((c) => ({
      id: c.id,
      label: "Unauthorized custody transfer",
      detail: `${c.shipmentId}: custody involving an unauthorized partner`,
      severity: "HIGH" as const,
    })),
    ...unauthorized.map((p) => ({
      id: `unauth-${p.id}`,
      label: "Unauthorized trading partner",
      detail: `${p.name} (${p.role.replaceAll("_", " ")}) is not an authorized trading partner`,
      severity: "HIGH" as const,
    })),
    ...expired.map((p) => ({
      id: `exp-${p.id}`,
      label: "Expired licence handling product",
      detail: `${p.name} licence expired ${fmtDate(p.licenseExpiry)}`,
      severity: "MEDIUM" as const,
    })),
  ];

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          {
            label: "Authorized Partners",
            value: fmtPct(kpis.authorizedPartnerPct, 1),
            icon: Users,
            status: kpis.authorizedPartnerPct >= 90 ? "success" : "warning",
          },
          {
            label: "Expired Licences",
            value: kpis.expiredLicenses,
            icon: FileWarning,
            status: kpis.expiredLicenses > 0 ? "danger" : "success",
          },
          {
            label: "Compliance Violations",
            value: kpis.complianceViolations,
            icon: ShieldX,
            status: kpis.complianceViolations > 0 ? "danger" : "success",
            hint: "partners",
          },
          {
            label: "Custody Transfer Violations",
            value: kpis.custodyTransferViolations,
            icon: AlertOctagon,
            status: kpis.custodyTransferViolations > 0 ? "warning" : "success",
            hint: "events",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Partner risk matrix"
          description="Risk score vs shipment volume — red = unauthorized / expired"
          className="lg:col-span-2"
        >
          <ScatterRisk data={data.riskMatrix} height={340} />
        </ChartCard>

        <ChartCard title="Authorization status" description="Compliance breakdown">
          <div className="space-y-3">
            <StatRow
              label="Authorized"
              value={partners.length - unauthorized.length}
              total={partners.length}
              tone="success"
            />
            <StatRow
              label="Unauthorized"
              value={unauthorized.length}
              total={partners.length}
              tone="danger"
            />
            <StatRow
              label="Valid licence"
              value={partners.filter((p) => p.license === "VALID").length}
              total={partners.length}
              tone="success"
            />
            <StatRow
              label="Expiring soon"
              value={expiringSoon.length}
              total={partners.length}
              tone="warning"
            />
            <StatRow
              label="Expired licence"
              value={expired.length}
              total={partners.length}
              tone="danger"
            />
          </div>
        </ChartCard>
      </div>

      {/* Suspect Product Investigation */}
      <Card className="border-l-danger border-l-4" data-flow="suspect">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertOctagon className="text-danger size-4" />
            <h2 className="text-foreground text-sm font-semibold">Suspect Product Investigation</h2>
            <Badge variant="danger">{suspectSignals.length} signals</Badge>
          </div>
          {suspectSignals.length === 0 ? (
            <EmptyState
              title="No suspect signals"
              description="No counterfeit, diversion or unauthorized signals detected."
            />
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {suspectSignals.map((s) => (
                <div
                  key={s.id}
                  className="border-border bg-muted/40 flex items-start gap-3 rounded-md border p-3"
                >
                  <span
                    className={`mt-0.5 size-2 shrink-0 rounded-full ${s.severity === "HIGH" ? "bg-danger" : "bg-warning"}`}
                  />
                  <div>
                    <p className="text-foreground text-sm font-medium">{s.label}</p>
                    <p className="text-muted-foreground text-xs">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ChartCard
        title="Trading partners"
        description="Expired licences and unauthorized partners are flagged"
      >
        <DataTable
          columns={columns}
          data={partners}
          searchPlaceholder="Filter partners…"
          pageSize={10}
          initialSorting={[{ id: "riskScore", desc: true }]}
          exportFilename="veritrace-trading-partners"
        />
      </ChartCard>
    </div>
  );
}

function StatRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "success" | "warning" | "danger";
}) {
  const pct = total ? (value / total) * 100 : 0;
  const bar = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger";
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-foreground font-semibold tabular-nums">{fmtNumber(value)}</span>
      </div>
      <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
        <div className={bar} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
