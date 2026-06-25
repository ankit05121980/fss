"use client";

import { CircleCheck, CircleDashed, ClipboardCheck, PackageX, Boxes } from "lucide-react";

import { useRecallAnalytics } from "@/lib/hooks/useAnalytics";
import { fmtNumber, fmtPct } from "@/lib/utils/format";
import { fmtDate, fromNow } from "@/lib/utils/date";
import { HERO } from "@/lib/utils/constants";
import type { EnrichedRecall } from "@/lib/data/types";
import { KpiStrip } from "@/components/shared/KpiStrip";
import { ChartCard } from "@/components/shared/ChartCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MapView, type MapMarker } from "@/components/shared/MapView";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartSkeleton, KpiStripSkeleton } from "@/components/shared/LoadingSkeleton";

function ProgressTracker({ recall }: { recall: EnrichedRecall }) {
  const locatedPct = (recall.locatedPackages / recall.impactedPackages) * 100;
  const outstandingPct = 100 - locatedPct;
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-foreground text-3xl font-bold tabular-nums">
            {fmtNumber(recall.locatedPackages)}
            <span className="text-muted-foreground text-lg font-medium">
              {" "}
              / {fmtNumber(recall.impactedPackages)}
            </span>
          </p>
          <p className="text-muted-foreground text-xs">packages located</p>
        </div>
        <div className="text-right">
          <p className="text-danger text-2xl font-bold tabular-nums">
            {fmtNumber(recall.outstandingPackages)}
          </p>
          <p className="text-muted-foreground text-xs">outstanding</p>
        </div>
      </div>
      <div className="bg-muted mt-3 flex h-3 w-full overflow-hidden rounded-full">
        <div
          className="bg-success"
          style={{ width: `${locatedPct}%` }}
          title={`Located ${locatedPct.toFixed(1)}%`}
        />
        <div
          className="bg-danger"
          style={{ width: `${outstandingPct}%` }}
          title={`Outstanding ${outstandingPct.toFixed(1)}%`}
        />
      </div>
      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="bg-success size-2 rounded-full" /> Located {fmtPct(locatedPct, 1)}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="bg-danger size-2 rounded-full" /> Outstanding {fmtPct(outstandingPct, 1)}
        </span>
      </div>
    </div>
  );
}

export function RecallView() {
  const { data, isLoading, isError } = useRecallAnalytics();

  if (isLoading)
    return (
      <div className="space-y-6">
        <KpiStripSkeleton count={4} />
        <ChartSkeleton height={200} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartSkeleton height={320} />
          <ChartSkeleton height={320} />
        </div>
      </div>
    );

  if (isError || !data)
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Couldn't load recall data"
        description="Please retry."
      />
    );

  const { kpis } = data;
  const heroRecall = data.recalls.find((r) => r.id === HERO.recallId) ?? data.recalls[0];

  // Distribution footprint: US downstream nodes where impacted product sits.
  const usNodes = data.locations.filter(
    (l) =>
      l.country === "United States" &&
      ["3PL", "DC", "HOSPITAL", "CUSTOMS", "PORT"].includes(l.type),
  );
  const markers: MapMarker[] = usNodes.map((l, i) => ({
    id: l.id,
    lat: l.lat,
    lng: l.lng,
    label: l.name,
    sublabel: i === usNodes.length - 1 ? "Outstanding units in field" : "Located",
    color: i === usNodes.length - 1 ? "#C62828" : "#2E7D32",
  }));

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          {
            label: "Active Recalls",
            value: kpis.activeRecalls,
            icon: ClipboardCheck,
            status: kpis.activeRecalls > 0 ? "danger" : "success",
          },
          {
            label: "Impacted Products",
            value: fmtNumber(kpis.impactedProducts),
            icon: Boxes,
            status: "warning",
            hint: "packages",
          },
          {
            label: "Located Products",
            value: fmtNumber(kpis.locatedProducts),
            icon: CircleCheck,
            status: "success",
            hint: "packages",
          },
          {
            label: "Outstanding Products",
            value: fmtNumber(kpis.outstandingProducts),
            icon: PackageX,
            status: kpis.outstandingProducts > 0 ? "danger" : "success",
            hint: "packages",
          },
        ]}
      />

      {/* Featured recall */}
      {heroRecall && (
        <Card className="border-l-danger border-l-4">
          <CardContent className="grid gap-6 p-5 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="danger">{heroRecall.id}</Badge>
                <Badge variant={heroRecall.status === "OPEN" ? "danger" : "success"}>
                  {heroRecall.status}
                </Badge>
                <span className="text-foreground text-sm font-semibold">
                  Batch {heroRecall.batchNumber}
                </span>
              </div>
              <p className="text-muted-foreground mt-3 text-sm">{heroRecall.reason}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric
                  label="Opened"
                  value={fmtDate(heroRecall.openedAt)}
                  sub={fromNow(heroRecall.openedAt)}
                />
                <Metric
                  label="Located"
                  value={fmtPct(
                    (heroRecall.locatedPackages / heroRecall.impactedPackages) * 100,
                    1,
                  )}
                  sub="of impacted"
                />
                <Metric
                  label="Impacted partners"
                  value={String(heroRecall.impactedPartners.length)}
                  sub="downstream"
                />
                <Metric label="Status" value={heroRecall.status} sub="recall state" />
              </div>
            </div>
            <div className="border-border bg-muted/30 flex flex-col justify-center rounded-lg border p-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                Recall progress tracker
              </p>
              <ProgressTracker recall={heroRecall} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Recall distribution map"
          description="Downstream footprint of impacted product (located vs outstanding)"
        >
          <MapView markers={markers} height={340} zoom={4} center={[39.5, -84]} />
        </ChartCard>

        <ChartCard
          title="Impacted trading partners"
          description="Partners holding or handling recalled product"
        >
          {heroRecall && heroRecall.impactedPartners.length > 0 ? (
            <ul className="space-y-2">
              {heroRecall.impactedPartners.map((p) => (
                <li
                  key={p.id}
                  className="border-border bg-muted/40 flex items-center justify-between gap-2 rounded-md border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">{p.name}</p>
                    <p className="text-muted-foreground text-xs">{p.role.replaceAll("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge kind="license" value={p.license} />
                    <StatusBadge kind="auth" value={p.auth} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No impacted partners" />
          )}
        </ChartCard>
      </div>

      {/* Response-time metrics */}
      <ChartCard title="Response metrics" description="All recalls">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.recalls.map((r) => (
            <div key={r.id} className="border-border rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm font-semibold">{r.id}</span>
                <Badge variant={r.status === "OPEN" ? "danger" : "success"}>{r.status}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">Batch {r.batchNumber}</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                {r.status === "OPEN" ? (
                  <CircleDashed className="text-warning size-4" />
                ) : (
                  <CircleCheck className="text-success size-4" />
                )}
                <span className="text-muted-foreground">
                  {fmtPct((r.locatedPackages / r.impactedPackages) * 100, 1)} located · opened{" "}
                  {fromNow(r.openedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className="text-foreground text-sm font-semibold">{value}</p>
      <p className="text-muted-foreground text-xs">{sub}</p>
    </div>
  );
}
