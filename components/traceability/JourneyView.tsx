"use client";

import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  Factory,
  Hospital,
  Loader2,
  ShieldCheck,
  Stamp,
  Thermometer,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { fmtDateTime } from "@/lib/utils/date";
import { fmtHours, fmtTemp } from "@/lib/utils/format";
import { MODE_META } from "@/lib/utils/constants";
import type {
  JourneyStage,
  JourneyStageStatus,
  LocationType,
  ShipmentJourney,
} from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_ICON: Record<LocationType, LucideIcon> = {
  MANUFACTURER: Factory,
  WAREHOUSE: Warehouse,
  PORT: Anchor,
  CUSTOMS: Stamp,
  "3PL": Boxes,
  DC: Building2,
  HOSPITAL: Hospital,
};

const STATUS_RING: Record<JourneyStageStatus, string> = {
  COMPLETE: "border-success bg-success text-success-foreground",
  CURRENT: "border-brand-blue bg-brand-blue text-white ring-4 ring-brand-blue/20",
  UPCOMING: "border-border bg-muted text-muted-foreground",
};

function shortName(name: string): string {
  return name.split("—")[0].trim();
}

export function JourneyView({ journey }: { journey: ShipmentJourney }) {
  return (
    <div className="space-y-5">
      {/* Summary line */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">{journey.shipmentId}</Badge>
        <span className="font-medium text-foreground">{journey.productName}</span>
        <span className="text-muted-foreground">· batch {journey.batchNumber}</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          {shortName(journey.originName)} <ArrowRight className="size-3" /> {shortName(journey.destinationName)}
        </span>
      </div>

      <ProcessRibbon journey={journey} />

      <div className="space-y-3">
        {journey.stages.map((stage, i) => (
          <StageCard key={stage.index} stage={stage} isLast={i === journey.stages.length - 1} />
        ))}
      </div>
    </div>
  );
}

function ProcessRibbon({ journey }: { journey: ShipmentJourney }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4">
      <ol className="flex min-w-max items-start gap-1">
        {journey.stages.map((stage, i) => {
          const Icon = TYPE_ICON[stage.locationType];
          const isLast = i === journey.stages.length - 1;
          return (
            <li key={stage.index} className="flex items-start">
              <div className="flex w-24 flex-col items-center text-center">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2",
                    STATUS_RING[stage.status],
                  )}
                >
                  {stage.status === "COMPLETE" ? (
                    <CheckCircle2 className="size-5" />
                  ) : stage.status === "CURRENT" ? (
                    <Icon className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </span>
                <span className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
                  {shortName(stage.locationName)}
                </span>
                {stage.legMode && (
                  <span className="text-[10px] text-muted-foreground">{MODE_META[stage.legMode].label}</span>
                )}
                {stage.temp?.excursion && (
                  <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-danger">
                    <Thermometer className="size-3" /> {fmtTemp(stage.temp.max)}
                  </span>
                )}
              </div>
              {!isLast && (
                <div className="mt-5 h-0.5 w-6 shrink-0 bg-border" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StatusBadgeForStage({ status }: { status: JourneyStageStatus }) {
  if (status === "COMPLETE")
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="size-3" /> Complete
      </Badge>
    );
  if (status === "CURRENT")
    return (
      <Badge variant="info" className="gap-1">
        <Loader2 className="size-3 animate-spin" /> In progress
      </Badge>
    );
  return (
    <Badge variant="muted" className="gap-1">
      <Circle className="size-3" /> Upcoming
    </Badge>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm text-foreground">{children}</div>
    </div>
  );
}

function StageCard({ stage, isLast }: { stage: JourneyStage; isLast: boolean }) {
  const Icon = TYPE_ICON[stage.locationType];
  return (
    <div className="relative flex gap-3">
      {/* Rail */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2",
            STATUS_RING[stage.status],
          )}
        >
          <Icon className="size-4" />
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>

      <Card className={cn("mb-1 flex-1", stage.temp?.excursion && "border-danger/40")}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{stage.locationName}</span>
              <Badge variant="muted">{stage.locationType}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {stage.legMode && <Badge variant="secondary">{MODE_META[stage.legMode].label}</Badge>}
              <StatusBadgeForStage status={stage.status} />
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Arrival">
              {stage.arrivalTs ? fmtDateTime(stage.arrivalTs) : "—"}
            </Field>
            <Field label="Departure">
              {stage.departureTs ? fmtDateTime(stage.departureTs) : "—"}
            </Field>
            <Field label="Dwell time">
              {stage.dwellHours !== undefined ? (
                <span className={cn(stage.dwellHours > 24 && "font-semibold text-warning")}>
                  <Clock className="mr-1 inline size-3.5" />
                  {fmtHours(stage.dwellHours)}
                </span>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Owner">{stage.owner ?? "—"}</Field>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Chain of custody">
              {stage.custodyTo ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground">{stage.custodyFrom}</span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span>{stage.custodyTo}</span>
                  {stage.custodyValid ? (
                    <Badge variant="success" className="gap-1">
                      <ShieldCheck className="size-3" /> Valid
                    </Badge>
                  ) : (
                    <Badge variant="danger" className="gap-1">
                      <AlertTriangle className="size-3" /> Gap
                    </Badge>
                  )}
                </span>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Temperature">
              {stage.temp ? (
                <span className="flex items-center gap-2">
                  <Thermometer className={cn("size-3.5", stage.temp.excursion ? "text-danger" : "text-info")} />
                  {fmtTemp(stage.temp.min)} – {fmtTemp(stage.temp.max)} (avg {fmtTemp(stage.temp.avg)})
                  {stage.temp.excursion && <Badge variant="danger">Excursion</Badge>}
                </span>
              ) : (
                <span className="text-muted-foreground">No sensor data</span>
              )}
            </Field>
          </div>

          {stage.events.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Events
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {stage.events.map((e, i) => (
                  <Badge key={i} variant="outline" className="font-normal" title={e.note}>
                    {e.eventType.replaceAll("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {stage.events.some((e) => e.note) && (
            <p className="mt-2 rounded-md bg-warning/10 px-2 py-1 text-xs text-warning">
              {stage.events.find((e) => e.note)?.note}
            </p>
          )}

          {stage.risks.length > 0 && (
            <div className="mt-3 space-y-1">
              {stage.risks.map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md bg-danger/5 px-2 py-1 text-xs">
                  <AlertTriangle className="size-3.5 text-danger" />
                  <span className="font-medium text-foreground">{r.type.replaceAll("_", " ")}</span>
                  <span className="text-muted-foreground">{r.description}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
