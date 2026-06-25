"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Activity, Snowflake, ThermometerSun } from "lucide-react";

import { useColdChain } from "@/lib/hooks/useAnalytics";
import { fmtDate } from "@/lib/utils/date";
import { fmtHours, fmtPct, fmtTemp } from "@/lib/utils/format";
import { HERO, MODE_META } from "@/lib/utils/constants";
import type { ColdShipmentSummary } from "@/lib/data/types";
import { KpiStrip } from "@/components/shared/KpiStrip";
import { ChartCard } from "@/components/shared/ChartCard";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { TempChart } from "@/components/cold-chain/TempChart";
import { MapView, type MapMarker, type MapRoute } from "@/components/shared/MapView";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartSkeleton, KpiStripSkeleton } from "@/components/shared/LoadingSkeleton";

export function ColdChainView() {
  const router = useRouter();
  const { data, isLoading, isError } = useColdChain();

  const columns = React.useMemo<ColumnDef<ColdShipmentSummary, unknown>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Shipment",
        cell: ({ row }) => <span className="font-semibold">{row.original.id}</span>,
      },
      { accessorKey: "productName", header: "Product" },
      {
        accessorKey: "primaryMode",
        header: "Mode",
        cell: ({ row }) => (
          <Badge variant="muted">{MODE_META[row.original.primaryMode].label}</Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge kind="shipment" value={row.original.status} />,
      },
      {
        accessorKey: "maxTemp",
        header: "Max Temp",
        cell: ({ row }) => (
          <span
            className={
              row.original.maxTemp > row.original.tempMaxC
                ? "text-danger font-semibold"
                : "text-foreground"
            }
          >
            {fmtTemp(row.original.maxTemp)}
          </span>
        ),
      },
      {
        accessorKey: "excursionCount",
        header: "Excursions",
        cell: ({ row }) =>
          row.original.excursionCount > 0 ? (
            <Badge variant="danger">{row.original.excursionCount}</Badge>
          ) : (
            <Badge variant="success">0</Badge>
          ),
      },
    ],
    [],
  );

  if (isLoading)
    return (
      <div className="space-y-6">
        <KpiStripSkeleton count={4} />
        <ChartSkeleton height={320} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      </div>
    );

  if (isError || !data)
    return (
      <EmptyState
        icon={Snowflake}
        title="Couldn't load cold chain data"
        description="Please retry."
      />
    );

  const { kpis, hero } = data;

  // Hero root-cause facts (computed from data)
  const heroTemps = hero?.temperatures ?? [];
  const heroExcursions = heroTemps.filter((t) => t.excursion);
  const heroMaxTemp = heroTemps.length ? Math.max(...heroTemps.map((t) => t.temperatureC)) : 0;
  const customsEvent = hero?.events.find((e) => e.eventType === "CUSTOMS_ENTRY");
  const product = hero?.product;

  // Hero route map (markers, customs in red)
  const heroMarkers: MapMarker[] = [];
  const heroRoutes: MapRoute[] = [];
  if (hero) {
    const seen = new Set<string>();
    const ordered: { id: string; mode: string; lat: number; lng: number }[] = [];
    for (const ev of hero.events) {
      const loc = ev.location;
      if (!loc) continue;
      ordered.push({ id: loc.id, mode: ev.mode, lat: loc.lat, lng: loc.lng });
      if (!seen.has(loc.id)) {
        seen.add(loc.id);
        heroMarkers.push({
          id: loc.id,
          lat: loc.lat,
          lng: loc.lng,
          label: loc.name,
          type: loc.type,
          country: loc.country,
          sublabel: loc.type === "CUSTOMS" ? "Excursion origin" : undefined,
          color: loc.type === "CUSTOMS" ? "#C62828" : undefined,
          highlight: loc.type === "CUSTOMS",
        });
      }
    }
    for (let i = 0; i < ordered.length - 1; i += 1) {
      if (ordered[i].id === ordered[i + 1].id) continue;
      heroRoutes.push({
        id: `${ordered[i].id}-${i}`,
        points: [
          [ordered[i].lat, ordered[i].lng],
          [ordered[i + 1].lat, ordered[i + 1].lng],
        ],
        color: ordered[i + 1].mode === "OCEAN" ? "#1F3864" : "#2E75B6",
        emphasized: ordered[i + 1].mode === "OCEAN",
        mode: ordered[i + 1].mode as MapRoute["mode"],
      });
    }
  }

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          {
            label: "Temperature Excursions",
            value: kpis.temperatureExcursions,
            icon: ThermometerSun,
            status: kpis.temperatureExcursions > 0 ? "danger" : "success",
            hint: "shipments affected",
          },
          {
            label: "High-Risk Shipments",
            value: kpis.highRiskShipments,
            icon: AlertTriangle,
            status: kpis.highRiskShipments > 0 ? "warning" : "success",
          },
          {
            label: "Sensor Failures",
            value: kpis.sensorFailures,
            icon: Activity,
            status: kpis.sensorFailures > 0 ? "warning" : "success",
            hint: "shipments",
          },
          {
            label: "Cold-Chain Compliance",
            value: fmtPct(kpis.compliancePct, 1),
            icon: Snowflake,
            status: kpis.compliancePct >= 95 ? "success" : "warning",
          },
        ]}
      />

      {/* Root cause analysis (hero) */}
      {hero && (
        <Card className="border-l-danger overflow-hidden border-l-4">
          <CardContent className="grid gap-4 p-5 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="danger" className="gap-1">
                  <AlertTriangle className="size-3.5" /> Root-Cause Analysis
                </Badge>
                <span className="text-foreground text-sm font-semibold">
                  {hero.shipment.id} · {HERO.batchNumber}
                </span>
              </div>
              <h3 className="text-foreground mt-3 text-base font-bold">
                {fmtHours(hero.shipment.delayHours)} customs delay drove a {fmtTemp(heroMaxTemp)}{" "}
                cold-chain excursion
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                During a <strong>{fmtHours(hero.shipment.delayHours)}</strong> hold at{" "}
                <strong>{customsEvent?.location?.name ?? "Customs Clearance — Newark"}</strong>
                {customsEvent ? ` on ${fmtDate(customsEvent.timestamp)}` : ""}, active cooling
                lapsed and the consignment of <strong>{product?.name}</strong> rose to{" "}
                <strong>{fmtTemp(heroMaxTemp)}</strong> — breaching the required{" "}
                {product ? `${fmtTemp(product.tempMinC)}–${fmtTemp(product.tempMaxC)}` : "2–8°C"}{" "}
                range across <strong>{heroExcursions.length}</strong> readings before recovering
                downstream.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <span className="bg-danger size-1.5 rounded-full" /> Trigger: extended customs
                  clearance dwell time
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-warning size-1.5 rounded-full" /> Effect: temperature breach
                  to {fmtTemp(heroMaxTemp)} (limit {fmtTemp(product?.tempMaxC ?? 8)})
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-info size-1.5 rounded-full" /> Consequence: batch{" "}
                  {HERO.batchNumber} flagged for recall {HERO.recallId}
                </li>
              </ul>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Temperature timeline ·{" "}
                {product ? `${fmtTemp(product.tempMinC)}–${fmtTemp(product.tempMaxC)}` : "2–8°C"}{" "}
                band
              </p>
              <TempChart
                readings={heroTemps}
                tempMinC={product?.tempMinC ?? 2}
                tempMaxC={product?.tempMaxC ?? 8}
                height={240}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route overlay + excursion trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Route overlay"
          description="Hero journey — customs node (excursion origin) in red"
        >
          <MapView markers={heroMarkers} routes={heroRoutes} height={320} />
        </ChartCard>
        <ChartCard title="Excursion trend" description="Excursion readings detected per week">
          <AreaTrend
            data={data.excursionTrend}
            name="Excursions"
            color="var(--danger)"
            height={320}
          />
        </ChartCard>
      </div>

      {/* Cold-chain shipments */}
      <ChartCard title="Cold-chain shipments" description="Select a row to open full traceability">
        <DataTable
          columns={columns}
          data={data.coldShipments}
          searchPlaceholder="Filter cold-chain shipments…"
          pageSize={8}
          onRowClick={(row) => router.push(`/traceability?type=shipment&q=${row.id}`)}
          initialSorting={[{ id: "excursionCount", desc: true }]}
          emptyTitle="No cold-chain shipments"
        />
      </ChartCard>
    </div>
  );
}
