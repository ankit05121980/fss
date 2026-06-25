"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Box,
  MapPin,
  PackageSearch,
  ShieldCheck,
  ShieldX,
  Thermometer,
} from "lucide-react";

import { useShipmentJourney, useTrace } from "@/lib/hooks/useAnalytics";
import { fmtDate, fmtDateTime } from "@/lib/utils/date";
import { fmtTemp } from "@/lib/utils/format";
import { HERO, MODE_HEX, MODE_META } from "@/lib/utils/constants";
import type { TraceResult } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/shared/ChartCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline, type TimelineItem } from "@/components/shared/Timeline";
import { TrendChart } from "@/components/charts/TrendChart";
import { MapView, type MapMarker, type MapRoute } from "@/components/shared/MapView";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyView } from "@/components/traceability/JourneyView";

const EXAMPLES = [
  { label: `Serial ${HERO.serial}`, q: HERO.serial, type: "serial" },
  { label: `Batch ${HERO.batchNumber}`, q: HERO.batchNumber, type: "batch" },
  { label: `Shipment ${HERO.shipmentId}`, q: HERO.shipmentId, type: "shipment" },
  { label: HERO.productName, q: "COVID", type: "product" },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-border flex items-start justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function TraceabilityView({
  initialQuery,
  initialType,
}: {
  initialQuery: string;
  initialType?: string;
}) {
  const router = useRouter();
  const { data, isLoading, isError } = useTrace(initialQuery || null, initialType);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    if (q) router.push(`/traceability?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        role="search"
      >
        <div className="relative flex-1">
          <PackageSearch className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            key={initialQuery}
            name="q"
            defaultValue={initialQuery}
            placeholder="Enter a serial (SN0008743), batch (VX-2026-001), shipment (SHP-001) or product…"
            aria-label="Traceability search"
            className="border-input bg-card focus-visible:ring-ring h-11 w-full rounded-lg border pr-3 pl-10 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
        <Button type="submit" size="lg" className="h-11">
          Trace
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.q}
            type="button"
            onClick={() =>
              router.push(`/traceability?type=${ex.type}&q=${encodeURIComponent(ex.q)}`)
            }
            className="border-border bg-secondary text-secondary-foreground hover:border-brand-blue hover:bg-accent rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {!initialQuery && (
        <EmptyState
          icon={PackageSearch}
          title="Search to trace a product"
          description="Resolve full DSCSA provenance — product, batch, custody, ownership, verification and temperature history — for any serial, batch, shipment or product."
        />
      )}

      {initialQuery && isLoading && <TraceSkeleton />}

      {initialQuery && isError && (
        <EmptyState
          icon={AlertTriangle}
          title={`No match for “${initialQuery}”`}
          description="Check the identifier and try again. You can search by serial number, batch, shipment ID or product name."
        />
      )}

      {initialQuery && !isLoading && !isError && data && <TraceDetail trace={data} />}
    </div>
  );
}

function TraceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function TraceDetail({ trace }: { trace: TraceResult }) {
  const { shipment, product, batch, unit, currentLocation } = trace;

  // Build journey map markers + routes from ordered events.
  const seen = new Set<string>();
  const markers: MapMarker[] = [];
  const orderedLocs: { id: string; mode: string }[] = [];
  for (const ev of trace.events) {
    const loc = trace.locationsById[ev.locationId];
    if (!loc) continue;
    orderedLocs.push({ id: loc.id, mode: ev.mode });
    if (!seen.has(loc.id)) {
      seen.add(loc.id);
      markers.push({
        id: loc.id,
        lat: loc.lat,
        lng: loc.lng,
        label: loc.name,
        type: loc.type,
        country: loc.country,
        highlight: loc.id === currentLocation?.id,
      });
    }
  }
  const routes: MapRoute[] = [];
  for (let i = 0; i < orderedLocs.length - 1; i += 1) {
    const a = trace.locationsById[orderedLocs[i].id];
    const b = trace.locationsById[orderedLocs[i + 1].id];
    if (!a || !b || a.id === b.id) continue;
    const isOcean = orderedLocs[i + 1].mode === "OCEAN";
    routes.push({
      id: `${a.id}-${b.id}-${i}`,
      points: [
        [a.lat, a.lng],
        [b.lat, b.lng],
      ],
      color: MODE_HEX[orderedLocs[i + 1].mode as keyof typeof MODE_HEX] ?? "#2E75B6",
      emphasized: isOcean,
      mode: orderedLocs[i + 1].mode as MapRoute["mode"],
    });
  }

  const timelineItems: TimelineItem[] = trace.events.map((ev) => {
    const loc = trace.locationsById[ev.locationId];
    return {
      id: ev.id,
      title: loc?.name ?? ev.locationId,
      subtitle: `${ev.eventType.replaceAll("_", " ")} · ${MODE_META[ev.mode].label}`,
      timestamp: fmtDateTime(ev.timestamp),
      tone: ev.note ? "warning" : "default",
      note: ev.note,
      badge: loc ? <Badge variant="muted">{loc.type}</Badge> : undefined,
    };
  });

  const tempData = trace.temperatures.map((t) => ({
    date: fmtDateTime(t.timestamp).replace(/^\d+ \w+ \d+, /, ""),
    temperature: t.temperatureC,
  }));
  const excursionCount = trace.temperatures.filter((t) => t.excursion).length;

  return (
    <div className="space-y-6">
      {/* Resolution banner */}
      <Card className="border-l-brand-blue border-l-4">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="bg-secondary text-secondary-foreground flex size-11 shrink-0 items-center justify-center rounded-lg">
              <Box className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-foreground text-lg font-bold">
                  {product?.name ?? trace.query}
                </h2>
                <Badge variant="secondary">Resolved by {trace.resolvedType}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {unit ? `Serial ${unit.serialNumber} · ` : ""}
                Batch {batch?.batchNumber} · Shipment {shipment?.id}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {trace.verified ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="size-3.5" /> Verified
              </Badge>
            ) : (
              <Badge variant="danger" className="gap-1">
                <ShieldX className="size-3.5" /> Unverified
              </Badge>
            )}
            {trace.traceabilityComplete ? (
              <Badge variant="success" className="gap-1">
                <BadgeCheck className="size-3.5" /> Traceability complete
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="size-3.5" /> Custody gap detected
              </Badge>
            )}
            {shipment && <StatusBadge kind="shipment" value={shipment.status} />}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="journey">End-to-End Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
      {/* Detail cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Product & Batch</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Product" value={product?.name} />
            <DetailRow label="Category" value={product?.drugCategory} />
            <DetailRow label="GTIN" value={product?.gtin} />
            <DetailRow label="Storage" value={product?.storageRequirement} />
            <DetailRow label="Batch" value={batch?.batchNumber} />
            <DetailRow label="Manufacturer" value={batch?.manufacturerName} />
            <DetailRow label="Origin country" value={batch?.manufacturerCountry} />
            <DetailRow label="Expiry" value={batch ? fmtDate(batch.expirationDate) : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Serialization & Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Serial" value={unit?.serialNumber ?? "Aggregate (batch-level)"} />
            <DetailRow label="Lot" value={unit?.lotNumber ?? `LOT-${batch?.batchNumber}`} />
            <DetailRow
              label="Verification"
              value={
                trace.verified ? (
                  <span className="text-success">Verified ✓</span>
                ) : (
                  <span className="text-danger">Unverified</span>
                )
              }
            />
            <DetailRow label="Units in batch" value={batch?.unitCount.toLocaleString()} />
            <DetailRow
              label="Current location"
              value={
                <span className="inline-flex items-center gap-1">
                  <MapPin className="text-brand-blue size-3.5" />
                  {currentLocation?.name ?? "—"}
                </span>
              }
            />
            <DetailRow
              label="Primary mode"
              value={shipment ? MODE_META[shipment.primaryMode].label : "—"}
            />
            <DetailRow label="Delay" value={shipment ? `${shipment.delayHours}h` : "—"} />
            <DetailRow label="Packages" value={shipment?.packageCount.toLocaleString()} />
          </CardContent>
        </Card>

        <ChartCard
          title="Shipment journey"
          description="Ocean lanes emphasized"
          className="lg:row-span-1"
        >
          <MapView markers={markers} routes={routes} height={300} />
        </ChartCard>
      </div>

      {/* Timeline + chains */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Shipment history" description="Complete chain of events">
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <Timeline items={timelineItems} />
          </div>
        </ChartCard>

        <div className="space-y-4">
          <ChartCard title="Chain of ownership" description="Title transfers (DSCSA)">
            {trace.ownership.length === 0 ? (
              <EmptyState title="No ownership events" />
            ) : (
              <ul className="space-y-2">
                {trace.ownership.map((o) => (
                  <li
                    key={o.id}
                    className="border-border bg-muted/40 flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="text-foreground font-medium">
                      {trace.partnersById[o.previousOwnerId]?.name ?? o.previousOwnerId}
                    </span>
                    <ArrowRight className="text-muted-foreground size-3.5" />
                    <span className="text-foreground font-medium">
                      {trace.partnersById[o.newOwnerId]?.name ?? o.newOwnerId}
                    </span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {fmtDate(o.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>

          <ChartCard title="Chain of custody" description="Physical handoffs — gaps flagged">
            <ul className="space-y-2">
              {trace.custody.map((c) => {
                const invalid = !c.valid;
                return (
                  <li
                    key={c.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      invalid ? "border-danger/40 bg-danger/5" : "border-border bg-muted/40"
                    }`}
                  >
                    <span className="text-foreground font-medium">
                      {trace.partnersById[c.fromPartyId]?.name ?? c.fromPartyId}
                    </span>
                    <ArrowRight className="text-muted-foreground size-3.5" />
                    <span className="text-foreground font-medium">
                      {trace.partnersById[c.toPartyId]?.name ?? c.toPartyId}
                    </span>
                    {invalid ? (
                      <Badge variant="danger" className="ml-auto">
                        Gap
                      </Badge>
                    ) : (
                      <Badge variant="success" className="ml-auto">
                        Valid
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </ChartCard>
        </div>
      </div>

      {/* Temperature */}
      {tempData.length > 0 && (
        <ChartCard
          title="Temperature history"
          description={
            product
              ? `Required ${fmtTemp(product.tempMinC)}–${fmtTemp(product.tempMaxC)} · ${excursionCount} excursion reading(s)`
              : undefined
          }
          action={
            excursionCount > 0 ? (
              <Badge variant="danger" className="gap-1">
                <Thermometer className="size-3.5" /> Excursion
              </Badge>
            ) : (
              <Badge variant="success">In range</Badge>
            )
          }
        >
          <TrendChart
            data={tempData}
            xKey="date"
            unit="°C"
            yDomain={[0, 12]}
            thresholdBand={product ? { y1: product.tempMinC, y2: product.tempMaxC } : undefined}
            series={[{ key: "temperature", name: "Temperature", color: "#2E75B6" }]}
            height={260}
          />
        </ChartCard>
      )}
        </TabsContent>

        <TabsContent value="journey">
          <JourneyTab shipmentId={shipment?.id ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JourneyTab({ shipmentId }: { shipmentId: string | null }) {
  const { data, isLoading, isError } = useShipmentJourney(shipmentId);
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !data)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Journey unavailable"
        description="The end-to-end journey could not be loaded for this item."
      />
    );
  return (
    <ChartCard
      title="End-to-end shipment journey"
      description="Stage-by-stage flow with custody, ownership, dwell time, temperature and exceptions"
    >
      <JourneyView journey={data} />
    </ChartCard>
  );
}
