"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Clock, Gauge, Package, Ship, Truck } from "lucide-react";

import { useControlTower, useMapContext } from "@/lib/hooks/useAnalytics";
import { toMapCircles, toMapTraffic } from "@/lib/utils/map-context";
import { fmtCompact, fmtHours, fmtPct } from "@/lib/utils/format";
import { fromNow } from "@/lib/utils/date";
import { MODE_META, STATUS_HEX } from "@/lib/utils/constants";
import type { Mode, ShipmentRow, ShipmentStatus } from "@/lib/data/types";
import { KpiStrip } from "@/components/shared/KpiStrip";
import { ChartCard } from "@/components/shared/ChartCard";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarCompare } from "@/components/charts/BarCompare";
import { MapView, type MapMarker, type MapRoute } from "@/components/shared/MapView";
import {
  ChartSkeleton,
  KpiStripSkeleton,
  TableSkeleton,
} from "@/components/shared/LoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PredictiveAlertsStrip } from "@/components/predictive/PredictiveAlertsStrip";

const MODES: Mode[] = ["OCEAN", "AIR", "TRUCK", "RAIL"];
const STATUSES: ShipmentStatus[] = ["IN_TRANSIT", "DELAYED", "DELIVERED", "CUSTOMS_HOLD"];

export function ControlTowerView() {
  const router = useRouter();
  const { data, isLoading, isError } = useControlTower();
  const { data: context } = useMapContext();

  const [layers, setLayers] = React.useState({ traffic: true, weather: true, congestion: true });
  const [mode, setMode] = React.useState<string>("ALL");
  const [status, setStatus] = React.useState<string>("ALL");
  const [carrier, setCarrier] = React.useState<string>("ALL");

  const filtered = React.useMemo(() => {
    if (!data) return [];
    return data.shipments.filter(
      (s) =>
        (mode === "ALL" || s.primaryMode === mode) &&
        (status === "ALL" || s.status === status) &&
        (carrier === "ALL" || s.carrierId === carrier),
    );
  }, [data, mode, status, carrier]);

  const { markers, routes } = React.useMemo(() => {
    if (!data) return { markers: [] as MapMarker[], routes: [] as MapRoute[] };
    const locById = new Map(data.locations.map((l) => [l.id, l]));
    const usedLocations = new Set<string>();
    const rts: MapRoute[] = [];
    for (const s of filtered) {
      const o = locById.get(s.originId);
      const d = locById.get(s.destinationId);
      if (!o || !d) continue;
      usedLocations.add(o.id);
      usedLocations.add(d.id);
      rts.push({
        id: s.id,
        points: [
          [o.lat, o.lng],
          [d.lat, d.lng],
        ],
        color: STATUS_HEX[s.status],
        emphasized: s.primaryMode === "OCEAN",
        mode: s.primaryMode,
      });
    }
    const mks: MapMarker[] = [...usedLocations].map((id) => {
      const l = locById.get(id)!;
      return {
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        label: l.name,
        type: l.type,
        country: l.country,
      };
    });
    return { markers: mks, routes: rts };
  }, [data, filtered]);

  const columns = React.useMemo<ColumnDef<ShipmentRow, unknown>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Shipment",
        cell: ({ row }) => <span className="text-foreground font-semibold">{row.original.id}</span>,
      },
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => <span className="text-sm">{row.original.productName}</span>,
      },
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
        accessorKey: "carrierName",
        header: "Carrier",
        cell: ({ row }) => <span className="text-sm">{row.original.carrierName}</span>,
      },
      {
        id: "lane",
        header: "Lane",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.originName.split("—")[0].trim()} →{" "}
            {row.original.destinationName.split("—")[0].trim()}
          </span>
        ),
      },
      {
        accessorKey: "delayHours",
        header: "Delay",
        cell: ({ row }) =>
          row.original.delayHours > 0 ? (
            <span className="text-warning font-medium">{fmtHours(row.original.delayHours)}</span>
          ) : (
            <span className="text-muted-foreground">On time</span>
          ),
      },
      {
        accessorKey: "etaAt",
        header: "ETA",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">{fromNow(row.original.etaAt)}</span>
        ),
      },
    ],
    [],
  );

  if (isLoading)
    return (
      <div className="space-y-6">
        <KpiStripSkeleton count={6} />
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartSkeleton className="lg:col-span-2" height={360} />
          <ChartSkeleton height={360} />
        </div>
        <TableSkeleton />
      </div>
    );

  if (isError || !data)
    return (
      <EmptyState
        icon={Activity}
        title="Couldn't load control tower"
        description="There was a problem retrieving shipment data. Please retry."
      />
    );

  const { kpis } = data;

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          {
            label: "Active Shipments",
            value: kpis.activeShipments,
            icon: Ship,
            status: "info",
            hint: "in motion",
          },
          {
            label: "Delayed",
            value: kpis.delayedShipments,
            icon: Clock,
            status: kpis.delayedShipments > 8 ? "warning" : "neutral",
            hint: "delayed / held",
          },
          { label: "In Transit", value: kpis.inTransit, icon: Truck, status: "neutral" },
          {
            label: "Inventory in Motion",
            value: fmtCompact(kpis.inventoryInMotion),
            icon: Package,
            status: "neutral",
            hint: "packages",
          },
          {
            label: "On-Time Delivery",
            value: fmtPct(kpis.onTimeDeliveryPct, 1),
            icon: Activity,
            status: kpis.onTimeDeliveryPct >= 80 ? "success" : "warning",
          },
          {
            label: "Carrier Score",
            value: kpis.carrierPerformanceScore,
            icon: Gauge,
            status: kpis.carrierPerformanceScore >= 80 ? "success" : "warning",
            hint: "/ 100",
          },
        ]}
      />

      <PredictiveAlertsStrip context="control-tower" />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span className="text-muted-foreground text-sm font-medium">Filter</span>
          <FilterSelect
            label="Mode"
            value={mode}
            onChange={setMode}
            options={MODES.map((m) => ({ value: m, label: MODE_META[m].label }))}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))}
          />
          <FilterSelect
            label="Carrier"
            value={carrier}
            onChange={setCarrier}
            options={data.carrierPerformance.map((c) => ({ value: c.carrierId, label: c.name }))}
          />
          <span className="text-muted-foreground text-xs sm:ml-auto">
            Showing {filtered.length} of {data.shipments.length} shipments
          </span>
        </CardContent>
      </Card>

      {/* Map + congestion */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Global shipment map"
          description="Lanes coloured by status · ocean freight emphasized"
          className="lg:col-span-2"
          contentClassName="pt-0"
          dataFlow="ct-map"
          action={
            <div className="flex flex-wrap gap-1.5">
              <LayerToggle label="Other traffic" on={layers.traffic} onClick={() => setLayers((l) => ({ ...l, traffic: !l.traffic }))} />
              <LayerToggle label="Weather" on={layers.weather} onClick={() => setLayers((l) => ({ ...l, weather: !l.weather }))} />
              <LayerToggle label="Congestion" on={layers.congestion} onClick={() => setLayers((l) => ({ ...l, congestion: !l.congestion }))} />
            </div>
          }
        >
          <MapView
            markers={markers}
            routes={routes}
            circles={
              context
                ? toMapCircles(
                    context.environmental.filter((e) =>
                      e.kind === "CONGESTION" ? layers.congestion : layers.weather,
                    ),
                  )
                : []
            }
            traffic={context && layers.traffic ? toMapTraffic(context.traffic) : []}
            height={380}
            zoom={2}
          />
          <div className="text-muted-foreground mt-3 flex flex-wrap gap-3 text-xs">
            {STATUSES.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: STATUS_HEX[s] }} />
                {s.replaceAll("_", " ")}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-5 border-t-2 border-dashed"
                style={{ borderColor: "#1F3864" }}
              />{" "}
              Ocean lane
            </span>
            <span className="border-border ml-1 inline-flex items-center gap-2 border-l pl-3">
              <span title="Ocean">{"\u{1F6A2}"} Ocean</span>
              <span title="Air">{"\u2708\uFE0F"} Air</span>
              <span title="Truck">{"\u{1F69B}"} Road</span>
              <span title="Rail">{"\u{1F686}"} Rail</span>
            </span>
            <span className="border-border ml-1 inline-flex items-center gap-3 border-l pl-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: "#2E75B6", opacity: 0.5 }} /> Weather
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: "#ED6C02", opacity: 0.5 }} /> Congestion
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-5 border-t border-dashed" style={{ borderColor: "#94a3b8" }} /> Other traffic
              </span>
            </span>
          </div>
          <p className="text-muted-foreground mt-2 text-[11px]">
            Environmental conditions shown here feed the predictive risk model — see matching drivers
            on the Predictive page.
          </p>
        </ChartCard>

        <ChartCard title="Port & customs congestion" description="Shipments held + dwell time">
          {data.portCongestion.length === 0 ? (
            <EmptyState title="No congestion" description="No ports are currently congested." />
          ) : (
            <ul className="space-y-2">
              {data.portCongestion.map((p) => (
                <li key={p.locationId} className="border-border bg-muted/40 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm font-medium">{p.name}</span>
                    <Badge variant={p.shipmentsHeld > 2 ? "danger" : "warning"}>
                      {p.shipmentsHeld} held
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Avg dwell {fmtHours(p.avgDwellHours)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      {/* Carrier performance + delay analysis */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Carrier performance" description="Performance score (0–100) by carrier">
          <BarCompare
            data={data.carrierPerformance.map((c) => ({
              name: c.name.split(" ")[0],
              value: c.performanceScore,
            }))}
            layout="vertical"
            unit=""
            color="var(--brand-blue)"
            height={300}
          />
        </ChartCard>
        <ChartCard title="Delay analysis" description="Total delay hours by transport mode">
          <BarCompare
            data={data.delayByMode}
            unit="h"
            colorByIndex
            height={300}
            barName="Delay hours"
          />
        </ChartCard>
      </div>

      {/* Shipment table */}
      <ChartCard
        title="Shipments"
        description="Select a row to open full traceability"
        dataFlow="ct-table"
      >
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Filter shipments…"
          pageSize={10}
          onRowClick={(row) => router.push(`/traceability?type=shipment&q=${row.id}`)}
          emptyTitle="No shipments match the filters"
          exportFilename="veritrace-shipments"
        />
      </ChartCard>
    </div>
  );
}

function LayerToggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={
        on
          ? "border-brand-blue bg-brand-surface-2 text-brand-navy rounded-full border px-2.5 py-1 text-[11px] font-medium"
          : "border-border text-muted-foreground hover:bg-accent rounded-full border px-2.5 py-1 text-[11px] font-medium"
      }
    >
      {label}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-44" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All {label.toLowerCase()}s</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
