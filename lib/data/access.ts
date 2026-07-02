// =============================================================================
// Veritrace — Data Access Layer
//
// THE single way the application reads data. API route handlers call these
// functions exclusively; the UI calls the API. To connect real systems
// (NetSuite, Datex Footprint WMS, EUPRY, carrier feeds, GLN registry) you only
// need to reimplement the functions in this file to fetch from those sources —
// the types, API surface and UI remain unchanged.
// =============================================================================

import { format, parseISO } from "date-fns";

import { getDataset } from "@/lib/data/seed";
import { DAY_MS, DEMO_NOW, hoursBetween, isWithinLastDays } from "@/lib/utils/date";
import { round } from "@/lib/utils/prng";
import type {
  Batch,
  Carrier,
  CarrierPerformance,
  ColdChainKpis,
  ControlTowerKpis,
  CustodyEvent,
  CustodyGap,
  ExecutiveKpis,
  HeatmapCell,
  LocationNode,
  NamedValue,
  OwnershipEvent,
  PartnerKpis,
  PartnerRiskPoint,
  PortCongestion,
  Product,
  Recall,
  RecallKpis,
  RiskEvent,
  RiskType,
  SearchResult,
  SerializedUnit,
  Severity,
  Shipment,
  ShipmentEvent,
  TemperatureReading,
  TraceQueryType,
  TraceResult,
  TradingPartner,
  TrendPoint,
} from "@/lib/data/types";

const RISK_TYPES: RiskType[] = [
  "DELAY",
  "TEMPERATURE_EXCURSION",
  "ROUTE_DEVIATION",
  "MISSING_SCAN",
  "UNAUTHORIZED_TRANSFER",
];
const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH"];

// -----------------------------------------------------------------------------
// Simple entity getters
// -----------------------------------------------------------------------------

export function getProducts(): Product[] {
  return getDataset().products;
}
export function getProduct(id: string): Product | undefined {
  return getDataset().products.find((p) => p.id === id);
}
export function getBatches(): Batch[] {
  return getDataset().batches;
}
export function getBatch(batchNumber: string): Batch | undefined {
  return getDataset().batches.find((b) => b.batchNumber === batchNumber);
}
export function getLocations(): LocationNode[] {
  return getDataset().locations;
}
export function getLocation(id: string): LocationNode | undefined {
  return getDataset().locations.find((l) => l.id === id);
}
export function getCarriers(): Carrier[] {
  return getDataset().carriers;
}
export function getCarrier(id: string): Carrier | undefined {
  return getDataset().carriers.find((c) => c.id === id);
}
export function getPartners(): TradingPartner[] {
  return getDataset().tradingPartners;
}
export function getPartner(id: string): TradingPartner | undefined {
  return getDataset().tradingPartners.find((p) => p.id === id);
}
export function getRecalls(): Recall[] {
  return getDataset().recalls;
}
export function getRecall(id: string): Recall | undefined {
  return getDataset().recalls.find((r) => r.id === id);
}

export interface ShipmentFilter {
  mode?: string;
  status?: string;
  carrierId?: string;
}

export function getShipments(filter: ShipmentFilter = {}): Shipment[] {
  let list = getDataset().shipments;
  if (filter.mode) list = list.filter((s) => s.primaryMode === filter.mode);
  if (filter.status) list = list.filter((s) => s.status === filter.status);
  if (filter.carrierId) list = list.filter((s) => s.carrierId === filter.carrierId);
  return list;
}

export function getShipment(id: string): Shipment | undefined {
  return getDataset().shipments.find((s) => s.id === id);
}

export interface RiskFilter {
  resolved?: boolean;
  type?: string;
  shipmentId?: string;
}

export function getRiskEvents(filter: RiskFilter = {}): RiskEvent[] {
  let list = [...getDataset().riskEvents];
  if (filter.resolved !== undefined) list = list.filter((r) => r.resolved === filter.resolved);
  if (filter.type) list = list.filter((r) => r.type === filter.type);
  if (filter.shipmentId) list = list.filter((r) => r.shipmentId === filter.shipmentId);
  return list.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
}

export function getTemperatureReadings(shipmentId: string): TemperatureReading[] {
  return getDataset()
    .temperatureReadings.filter((t) => t.shipmentId === shipmentId)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
}

export function getSerial(serial: string): SerializedUnit | undefined {
  return getDataset().serializedUnits.find(
    (u) => u.serialNumber.toLowerCase() === serial.toLowerCase(),
  );
}

// -----------------------------------------------------------------------------
// Derived helpers
// -----------------------------------------------------------------------------

function isActive(s: Shipment): boolean {
  return s.status !== "DELIVERED";
}

export function shipmentIsAtRisk(s: Shipment): boolean {
  if (!s.traceabilityComplete) return true;
  if (s.hasExcursion) return true;
  const openRisks = getDataset().riskEvents.some((r) => r.shipmentId === s.id && !r.resolved);
  return openRisks;
}

export function getCustodyGaps(shipmentId?: string): CustodyGap[] {
  const ds = getDataset();
  const carrierByShipment = new Map(ds.shipments.map((s) => [s.id, s.carrierId]));
  const carrierName = new Map(ds.carriers.map((c) => [c.id, c.name]));
  const partnerName = new Map(ds.tradingPartners.map((p) => [p.id, p.name]));
  return ds.custodyEvents
    .filter((c) => !c.valid && (!shipmentId || c.shipmentId === shipmentId))
    .map((c) => {
      const carrierId = carrierByShipment.get(c.shipmentId) ?? "";
      const toUnauthorized =
        ds.tradingPartners.find((p) => p.id === c.toPartyId)?.auth === "UNAUTHORIZED";
      return {
        shipmentId: c.shipmentId,
        carrierId,
        carrierName: carrierName.get(carrierId) ?? carrierId,
        fromPartyId: c.fromPartyId,
        toPartyId: c.toPartyId,
        timestamp: c.timestamp,
        reason: toUnauthorized
          ? `Unauthorized transfer to ${partnerName.get(c.toPartyId) ?? c.toPartyId}`
          : `Missing custody documentation (${partnerName.get(c.fromPartyId) ?? c.fromPartyId} → ${partnerName.get(c.toPartyId) ?? c.toPartyId})`,
      };
    });
}

// -----------------------------------------------------------------------------
// Traceability resolution
// -----------------------------------------------------------------------------

function buildTraceForShipment(
  shipment: Shipment,
  query: string,
  resolvedType: TraceQueryType,
  unit?: SerializedUnit,
): TraceResult {
  const ds = getDataset();
  const product = ds.products.find((p) => p.id === shipment.productId);
  const batch = ds.batches.find((b) => b.batchNumber === shipment.batchNumber);
  const events = ds.shipmentEvents
    .filter((e) => e.shipmentId === shipment.id)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  const custody = ds.custodyEvents
    .filter((c) => c.shipmentId === shipment.id)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  const ownership = ds.ownershipEvents
    .filter((o) => o.shipmentId === shipment.id)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  const temperatures = getTemperatureReadings(shipment.id);

  const locationsById: Record<string, LocationNode> = {};
  for (const l of ds.locations) locationsById[l.id] = l;
  const partnersById: Record<string, TradingPartner> = {};
  for (const p of ds.tradingPartners) partnersById[p.id] = p;

  const lastEvent = events[events.length - 1];
  const currentLocation = unit
    ? locationsById[unit.currentLocationId]
    : lastEvent
      ? locationsById[lastEvent.locationId]
      : undefined;

  return {
    query,
    resolvedType,
    product,
    batch,
    unit,
    shipment,
    currentLocation,
    events,
    locationsById,
    partnersById,
    custody,
    ownership,
    temperatures,
    custodyGaps: getCustodyGaps(shipment.id),
    verified: unit ? unit.verified : shipment.traceabilityComplete,
    traceabilityComplete: shipment.traceabilityComplete,
  };
}

function shipmentForBatch(batchNumber: string): Shipment | undefined {
  return getDataset().shipments.find((s) => s.batchNumber === batchNumber);
}

export function resolveTrace(rawQuery: string, type?: TraceQueryType): TraceResult | null {
  const ds = getDataset();
  const q = rawQuery.trim();
  if (!q) return null;
  const upper = q.toUpperCase();

  // Serial
  if (!type || type === "serial") {
    const unit = getSerial(q);
    if (unit) {
      const shipment = shipmentForBatch(unit.batchNumber) ?? ds.shipments.find((s) => s.productId);
      if (shipment) return buildTraceForShipment(shipment, q, "serial", unit);
    }
  }

  // Shipment id
  if (!type || type === "shipment") {
    const shipment = ds.shipments.find((s) => s.id.toUpperCase() === upper);
    if (shipment) return buildTraceForShipment(shipment, q, "shipment");
  }

  // Batch
  if (!type || type === "batch") {
    const batch = ds.batches.find((b) => b.batchNumber.toUpperCase() === upper);
    if (batch) {
      const shipment = shipmentForBatch(batch.batchNumber);
      if (shipment) return buildTraceForShipment(shipment, q, "batch");
    }
  }

  // Product (by id or name)
  if (!type || type === "product") {
    const product =
      ds.products.find((p) => p.id.toUpperCase() === upper) ??
      ds.products.find((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (product) {
      const shipment = ds.shipments.find((s) => s.productId === product.id);
      if (shipment) {
        const result = buildTraceForShipment(shipment, q, "product");
        return { ...result, product };
      }
    }
  }

  return null;
}

export function globalSearch(rawQuery: string): SearchResult[] {
  const ds = getDataset();
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const u of ds.serializedUnits) {
    if (u.serialNumber.toLowerCase().includes(q)) {
      results.push({
        type: "serial",
        id: u.serialNumber,
        label: u.serialNumber,
        sublabel: `Serial · batch ${u.batchNumber}`,
        href: `/traceability?type=serial&q=${encodeURIComponent(u.serialNumber)}`,
      });
    }
    if (results.length >= 6) break;
  }
  for (const b of ds.batches) {
    if (b.batchNumber.toLowerCase().includes(q)) {
      results.push({
        type: "batch",
        id: b.batchNumber,
        label: b.batchNumber,
        sublabel: `Batch · ${getProduct(b.productId)?.name ?? ""}`,
        href: `/traceability?type=batch&q=${encodeURIComponent(b.batchNumber)}`,
      });
    }
  }
  for (const s of ds.shipments) {
    if (s.id.toLowerCase().includes(q)) {
      results.push({
        type: "shipment",
        id: s.id,
        label: s.id,
        sublabel: `Shipment · ${s.primaryMode}`,
        href: `/traceability?type=shipment&q=${encodeURIComponent(s.id)}`,
      });
    }
  }
  for (const p of ds.products) {
    if (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) {
      results.push({
        type: "product",
        id: p.id,
        label: p.name,
        sublabel: "Product",
        href: `/traceability?type=product&q=${encodeURIComponent(p.id)}`,
      });
    }
  }
  return results.slice(0, 12);
}

// -----------------------------------------------------------------------------
// Coverage / compliance primitives (computed, never hard-coded)
// -----------------------------------------------------------------------------

export function traceabilityCoveragePct(): number {
  const s = getDataset().shipments;
  return round((s.filter((x) => x.traceabilityComplete).length / s.length) * 100, 1);
}

export function serializationCoveragePct(): number {
  const u = getDataset().serializedUnits;
  return round((u.filter((x) => x.verified).length / u.length) * 100, 1);
}

export function authorizedPartnerPct(): number {
  const p = getDataset().tradingPartners;
  return round((p.filter((x) => x.auth === "AUTHORIZED").length / p.length) * 100, 1);
}

export function recallReadinessScore(): number {
  const recalls = getDataset().recalls;
  const open = recalls.filter((r) => r.status === "OPEN");
  if (open.length === 0) return 100;
  const located = open.reduce((a, r) => a + r.locatedPackages, 0);
  const impacted = open.reduce((a, r) => a + r.impactedPackages, 0);
  return round((located / impacted) * 100, 1);
}

export function activeExcursionCount(): number {
  return getDataset().shipments.filter((s) => s.hasExcursion && isActive(s)).length;
}

export function openComplianceRiskCount(): number {
  return getDataset().riskEvents.filter((r) => !r.resolved).length;
}

export function getExecutiveKpis(): ExecutiveKpis {
  const trace = traceabilityCoveragePct();
  const serial = serializationCoveragePct();
  const authPct = authorizedPartnerPct();
  const recall = recallReadinessScore();
  const openRisks = openComplianceRiskCount();
  const excursions = activeExcursionCount();
  const riskPenalty = Math.min(30, openRisks * 1.4 + excursions * 2);
  const overall = round(
    0.26 * trace + 0.2 * serial + 0.2 * authPct + 0.16 * recall + 0.18 * (100 - riskPenalty),
    0,
  );
  return {
    overallComplianceScore: overall,
    traceabilityCoveragePct: trace,
    serializationCoveragePct: serial,
    authorizedPartnerPct: authPct,
    recallReadinessScore: recall,
    openComplianceRisks: openRisks,
    activeExcursions: excursions,
  };
}

/** Deterministic mini-series (sparkline) ending exactly at `end`, with delta. */
function kpiSpark(end: number, swing: number): import("@/lib/data/types").KpiTrend {
  const pts = 8;
  const spark: number[] = [];
  for (let i = 0; i < pts; i += 1) {
    const t = i / (pts - 1);
    const base = end * (0.86 + 0.14 * t);
    const wave = Math.sin(i * 1.25) * swing;
    spark.push(round(Math.max(0, base + wave), 2));
  }
  spark[pts - 1] = end;
  return { spark, delta: round(spark[pts - 1] - spark[pts - 3], 1) };
}

export function getExecutiveKpiTrends(): Record<string, import("@/lib/data/types").KpiTrend> {
  const k = getExecutiveKpis();
  return {
    overall: kpiSpark(k.overallComplianceScore, 1.4),
    traceability: kpiSpark(k.traceabilityCoveragePct, 1.2),
    serialization: kpiSpark(k.serializationCoveragePct, 0.9),
    authorized: kpiSpark(k.authorizedPartnerPct, 0.8),
    recall: kpiSpark(k.recallReadinessScore, 0.6),
    openRisks: kpiSpark(k.openComplianceRisks, Math.max(1, k.openComplianceRisks * 0.05)),
    excursions: kpiSpark(k.activeExcursions, Math.max(0.3, k.activeExcursions * 0.1)),
  };
}

export function getControlTowerKpis(): ControlTowerKpis {
  const ds = getDataset();
  const ships = ds.shipments;
  const active = ships.filter(isActive);
  const delivered = ships.filter((s) => s.status === "DELIVERED");
  const onTimeDelivered = delivered.filter((s) => s.delayHours === 0).length;
  const carrierScore = ds.carriers.length
    ? round(ds.carriers.reduce((a, c) => a + c.performanceScore, 0) / ds.carriers.length, 0)
    : 0;
  return {
    activeShipments: active.length,
    delayedShipments: ships.filter((s) => s.status === "DELAYED" || s.status === "CUSTOMS_HOLD")
      .length,
    inTransit: ships.filter((s) => s.status === "IN_TRANSIT").length,
    inventoryInMotion: active.reduce((a, s) => a + s.packageCount, 0),
    onTimeDeliveryPct: delivered.length
      ? round((onTimeDelivered / delivered.length) * 100, 1)
      : 100,
    carrierPerformanceScore: carrierScore,
  };
}

export function getColdChainKpis(): ColdChainKpis {
  const ds = getDataset();
  const coldShipments = ds.shipments.filter((s) => {
    const p = getProduct(s.productId);
    return p ? p.tempMaxC <= 8 : false;
  });
  const readings = ds.temperatureReadings;
  const inRange = readings.filter((r) => !r.excursion).length;
  const sensorFailShipments = new Set(readings.filter((r) => !r.sensorOk).map((r) => r.shipmentId));
  return {
    temperatureExcursions: ds.shipments.filter((s) => s.hasExcursion).length,
    highRiskShipments: coldShipments.filter((s) => s.hasExcursion || s.delayHours > 12).length,
    sensorFailures: sensorFailShipments.size,
    compliancePct: readings.length ? round((inRange / readings.length) * 100, 1) : 100,
  };
}

export function getRecallKpis(): RecallKpis {
  const open = getDataset().recalls.filter((r) => r.status === "OPEN");
  return {
    activeRecalls: open.length,
    impactedProducts: open.reduce((a, r) => a + r.impactedPackages, 0),
    locatedProducts: open.reduce((a, r) => a + r.locatedPackages, 0),
    outstandingProducts: open.reduce((a, r) => a + r.outstandingPackages, 0),
  };
}

export function getPartnerKpis(): PartnerKpis {
  const ds = getDataset();
  const partners = ds.tradingPartners;
  const expired = partners.filter((p) => p.license === "EXPIRED").length;
  const violationsPartners = partners.filter(
    (p) => p.auth === "UNAUTHORIZED" || p.license === "EXPIRED",
  ).length;
  const custodyViolations = ds.custodyEvents.filter((c) => !c.valid).length;
  return {
    authorizedPartnerPct: authorizedPartnerPct(),
    expiredLicenses: expired,
    complianceViolations: violationsPartners,
    custodyTransferViolations: custodyViolations,
  };
}

// -----------------------------------------------------------------------------
// Trends, heatmaps & breakdowns
// -----------------------------------------------------------------------------

interface WeekBucket {
  startMs: number;
  endMs: number;
  label: string;
}

function lastWeeks(n: number): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  const end = DEMO_NOW.getTime();
  for (let i = n - 1; i >= 0; i -= 1) {
    const endMs = end - i * 7 * DAY_MS;
    const startMs = endMs - 7 * DAY_MS;
    buckets.push({ startMs, endMs, label: format(new Date(endMs), "dd MMM") });
  }
  return buckets;
}

/** Deterministic series that ramps up to `endValue` with a gentle ripple. */
function rampTo(endValue: number, points: number, drop = 6, ripple = 1.5): TrendPoint[] {
  const weeks = lastWeeks(points);
  return weeks.map((w, i) => {
    const t = i / (points - 1);
    const base = endValue - (1 - t) * drop;
    const wave = Math.sin(i * 1.3) * ripple;
    return { date: w.label, value: round(Math.max(0, Math.min(100, base + wave)), 1) };
  });
}

export function getComplianceTrend(points = 12): TrendPoint[] {
  return rampTo(getExecutiveKpis().overallComplianceScore, points, 9, 1.6);
}

export function getCoverageTrend(
  points = 12,
): { date: string; traceability: number; serialization: number }[] {
  const trace = rampTo(traceabilityCoveragePct(), points, 7, 1.2);
  const serial = rampTo(serializationCoveragePct(), points, 5, 1);
  return trace.map((p, i) => ({
    date: p.date,
    traceability: p.value,
    serialization: serial[i].value,
  }));
}

export function getRiskHeatmap(): HeatmapCell[] {
  const events = getDataset().riskEvents;
  const cells: HeatmapCell[] = [];
  for (const category of RISK_TYPES) {
    for (const severity of SEVERITIES) {
      cells.push({
        category,
        severity,
        count: events.filter((e) => e.type === category && e.severity === severity).length,
      });
    }
  }
  return cells;
}

export function getViolationsByCategory(): NamedValue[] {
  const events = getDataset().riskEvents;
  const labels: Record<RiskType, string> = {
    DELAY: "Delay",
    TEMPERATURE_EXCURSION: "Excursion",
    ROUTE_DEVIATION: "Route Deviation",
    MISSING_SCAN: "Missing Scan",
    UNAUTHORIZED_TRANSFER: "Unauthorized",
  };
  return RISK_TYPES.map((t) => ({
    name: labels[t],
    value: events.filter((e) => e.type === t).length,
  }));
}

export function getExcursionTrend(points = 10): TrendPoint[] {
  const weeks = lastWeeks(points);
  const readings = getDataset().temperatureReadings.filter((r) => r.excursion);
  return weeks.map((w) => ({
    date: w.label,
    value: readings.filter((r) => {
      const t = parseISO(r.timestamp).getTime();
      return t >= w.startMs && t < w.endMs;
    }).length,
  }));
}

export function getCarrierPerformance(): CarrierPerformance[] {
  const ds = getDataset();
  const gaps = getCustodyGaps();
  return ds.carriers
    .map((c) => {
      const own = ds.shipments.filter((s) => s.carrierId === c.id);
      const custodyGaps = gaps.filter((g) => g.carrierId === c.id).length;
      return {
        carrierId: c.id,
        name: c.name,
        onTimePct: c.onTimePct,
        performanceScore: c.performanceScore,
        totalDelayHours: own.reduce((a, s) => a + s.delayHours, 0),
        delayedCount: own.filter((s) => s.status === "DELAYED" || s.status === "CUSTOMS_HOLD")
          .length,
        shipmentCount: own.length,
        custodyGaps,
      };
    })
    .sort((a, b) => b.shipmentCount - a.shipmentCount);
}

export function getPortCongestion(): PortCongestion[] {
  const ds = getDataset();
  const ports = ds.locations.filter((l) => l.type === "PORT" || l.type === "CUSTOMS");
  return ports
    .map((port) => {
      const eventsHere = ds.shipmentEvents.filter((e) => e.locationId === port.id);
      const shipmentsHere = new Set(eventsHere.map((e) => e.shipmentId));
      const held = [...shipmentsHere].filter((sid) => {
        const s = ds.shipments.find((x) => x.id === sid);
        return s && (s.status === "CUSTOMS_HOLD" || s.delayHours > 12);
      }).length;
      const avgDwell = port.type === "CUSTOMS" ? 14 + held * 1.5 : 6 + held;
      return {
        locationId: port.id,
        name: port.name,
        shipmentsHeld: held,
        avgDwellHours: round(avgDwell, 0),
      };
    })
    .filter((p) => p.shipmentsHeld > 0)
    .sort((a, b) => b.shipmentsHeld - a.shipmentsHeld);
}

export function getDelayByMode(): NamedValue[] {
  const ds = getDataset();
  const modes = ["OCEAN", "AIR", "TRUCK", "RAIL"] as const;
  return modes
    .map((m) => {
      const own = ds.shipments.filter((s) => s.primaryMode === m);
      return { name: m, value: own.reduce((a, s) => a + s.delayHours, 0) };
    })
    .filter((x) => x.value > 0);
}

export function getPartnerRiskMatrix(): PartnerRiskPoint[] {
  const ds = getDataset();
  return ds.tradingPartners.map((p) => {
    // volume = custody/ownership events involving this partner
    const volume =
      ds.custodyEvents.filter((c) => c.fromPartyId === p.id || c.toPartyId === p.id).length +
      ds.ownershipEvents.filter((o) => o.previousOwnerId === p.id || o.newOwnerId === p.id).length;
    return {
      partnerId: p.id,
      name: p.name,
      role: p.role,
      riskScore: p.riskScore,
      volume,
      auth: p.auth,
      license: p.license,
    };
  });
}

// -----------------------------------------------------------------------------
// Rich shipment detail (used by Control Tower drill + Traceability)
// -----------------------------------------------------------------------------

export function getShipmentRows(
  filter: ShipmentFilter = {},
): import("@/lib/data/types").ShipmentRow[] {
  const ds = getDataset();
  const locById = new Map(ds.locations.map((l) => [l.id, l]));
  const carrierById = new Map(ds.carriers.map((c) => [c.id, c]));
  return getShipments(filter).map((s) => ({
    id: s.id,
    batchNumber: s.batchNumber,
    productName: getProduct(s.productId)?.name ?? s.productId,
    primaryMode: s.primaryMode,
    status: s.status,
    carrierId: s.carrierId,
    carrierName: carrierById.get(s.carrierId)?.name ?? s.carrierId,
    originId: s.originId,
    originName: locById.get(s.originId)?.name ?? s.originId,
    destinationId: s.destinationId,
    destinationName: locById.get(s.destinationId)?.name ?? s.destinationId,
    delayHours: s.delayHours,
    etaAt: s.etaAt,
    departedAt: s.departedAt,
    packageCount: s.packageCount,
    hasExcursion: s.hasExcursion,
    traceabilityComplete: s.traceabilityComplete,
  }));
}

export interface ShipmentDetail {
  shipment: Shipment;
  product?: Product;
  batch?: Batch;
  carrier?: Carrier;
  origin?: LocationNode;
  destination?: LocationNode;
  events: (ShipmentEvent & { location?: LocationNode })[];
  custody: CustodyEvent[];
  ownership: OwnershipEvent[];
  temperatures: TemperatureReading[];
  risks: RiskEvent[];
}

export function getShipmentDetail(id: string): ShipmentDetail | null {
  const ds = getDataset();
  const shipment = getShipment(id);
  if (!shipment) return null;
  const locById = new Map(ds.locations.map((l) => [l.id, l]));
  const events = ds.shipmentEvents
    .filter((e) => e.shipmentId === id)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())
    .map((e) => ({ ...e, location: locById.get(e.locationId) }));
  return {
    shipment,
    product: getProduct(shipment.productId),
    batch: getBatch(shipment.batchNumber),
    carrier: getCarrier(shipment.carrierId),
    origin: locById.get(shipment.originId),
    destination: locById.get(shipment.destinationId),
    events,
    custody: ds.custodyEvents
      .filter((c) => c.shipmentId === id)
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()),
    ownership: ds.ownershipEvents
      .filter((o) => o.shipmentId === id)
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()),
    temperatures: getTemperatureReadings(id),
    risks: getRiskEvents({ shipmentId: id }),
  };
}

// -----------------------------------------------------------------------------
// Map context — environmental conditions & ambient traffic (deterministic)
// -----------------------------------------------------------------------------

const ENVIRONMENTAL_EVENTS: import("@/lib/data/types").MapContextEvent[] = [
  {
    id: "env-storm-atlantic",
    kind: "WEATHER",
    label: "North Atlantic Storm System",
    description: "Severe storm with high seas across the trans-Atlantic shipping corridor.",
    impact: "Slows ocean transit and stresses reefer power — raises delay & excursion risk.",
    lat: 47,
    lng: -38,
    radiusKm: 1100,
    severity: "HIGH",
    affects: ["DELAY", "EXCURSION"],
  },
  {
    id: "env-congestion-newark",
    kind: "CONGESTION",
    label: "Customs Congestion — Newark",
    description: "Customs inspection backlog at the Port of Newark clearance facility.",
    impact: "Extended customs dwell time — the primary driver of the hero excursion.",
    lat: 40.709,
    lng: -74.1726,
    radiusKm: 90,
    severity: "HIGH",
    affects: ["DELAY", "EXCURSION"],
  },
  {
    id: "env-heat-ne",
    kind: "HEAT",
    label: "Heatwave — US Northeast",
    description: "Ambient temperatures of 34–38°C across the US Northeast distribution region.",
    impact: "Raises cold-chain excursion risk during cross-dock and last-mile handling.",
    lat: 40.4,
    lng: -74.2,
    radiusKm: 340,
    severity: "MEDIUM",
    affects: ["EXCURSION"],
  },
  {
    id: "env-fog-hamburg",
    kind: "FOG",
    label: "Fog — Port of Hamburg",
    description: "Dense morning fog reducing throughput at the origin port.",
    impact: "Minor loading delays at origin.",
    lat: 53.5413,
    lng: 9.9326,
    radiusKm: 70,
    severity: "LOW",
    affects: ["DELAY"],
  },
  {
    id: "env-congestion-la",
    kind: "CONGESTION",
    label: "Port Congestion — Los Angeles",
    description: "Vessel queue and berth waiting at the Port of Los Angeles.",
    impact: "Berth waiting time on Pacific lanes.",
    lat: 33.7395,
    lng: -118.2597,
    radiusKm: 80,
    severity: "MEDIUM",
    affects: ["DELAY"],
  },
];

const AMBIENT_TRAFFIC: import("@/lib/data/types").TrafficLane[] = [
  { id: "tl-1", label: "Shanghai → Los Angeles", points: [[31.23, 121.47], [35, -160], [33.74, -118.26]], intensity: "HIGH" },
  { id: "tl-2", label: "Rotterdam → Newark", points: [[51.95, 4.14], [50, -30], [40.69, -74.17]], intensity: "MEDIUM" },
  { id: "tl-3", label: "Singapore → Rotterdam", points: [[1.26, 103.84], [12, 60], [30, 32], [38, 8], [51.95, 4.14]], intensity: "MEDIUM" },
  { id: "tl-4", label: "Los Angeles → Chicago", points: [[33.74, -118.26], [39, -104], [41.88, -87.63]], intensity: "LOW" },
  { id: "tl-5", label: "Newark → Atlanta", points: [[40.69, -74.17], [37, -78], [33.75, -84.39]], intensity: "LOW" },
  { id: "tl-6", label: "Mumbai → Rotterdam", points: [[19.07, 72.87], [12, 55], [30, 32], [38, 8], [51.95, 4.14]], intensity: "LOW" },
];

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function getEnvironmentalContext(): import("@/lib/data/types").MapContextEvent[] {
  return ENVIRONMENTAL_EVENTS;
}

export function getAmbientTraffic(): import("@/lib/data/types").TrafficLane[] {
  return AMBIENT_TRAFFIC;
}

export function getMapContext(): import("@/lib/data/types").MapContext {
  return { environmental: ENVIRONMENTAL_EVENTS, traffic: AMBIENT_TRAFFIC };
}

/** Environmental events that affect a given shipment (used by maps + predictive). */
export function eventsAffectingShipment(
  shipment: Shipment,
): import("@/lib/data/types").MapContextEvent[] {
  const ds = getDataset();
  const locById = new Map(ds.locations.map((l) => [l.id, l]));
  // Key coordinates along this shipment's path.
  const nodeIds = new Set<string>([shipment.originId, shipment.destinationId]);
  for (const evId of shipment.events) {
    const ev = ds.shipmentEvents.find((e) => e.id === evId);
    if (ev) nodeIds.add(ev.locationId);
  }
  const coords = [...nodeIds]
    .map((id) => locById.get(id))
    .filter((l): l is NonNullable<typeof l> => !!l)
    .map((l) => [l.lat, l.lng] as [number, number]);

  return ENVIRONMENTAL_EVENTS.filter((ev) => {
    // Ocean shipments cross the trans-Atlantic storm corridor.
    if (ev.id === "env-storm-atlantic" && shipment.primaryMode === "OCEAN") return true;
    return coords.some(([lat, lng]) => haversineKm(lat, lng, ev.lat, ev.lng) <= ev.radiusKm);
  });
}

// -----------------------------------------------------------------------------
// End-to-end shipment journey (stage-by-stage flow)
// -----------------------------------------------------------------------------

export function getShipmentJourney(id: string): import("@/lib/data/types").ShipmentJourney | null {
  const ds = getDataset();
  const shipment = getShipment(id);
  if (!shipment) return null;
  const locById = new Map(ds.locations.map((l) => [l.id, l]));
  const partnerName = (pid: string) => ds.tradingPartners.find((p) => p.id === pid)?.name ?? pid;

  const events = ds.shipmentEvents
    .filter((e) => e.shipmentId === id)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  const custody = ds.custodyEvents
    .filter((c) => c.shipmentId === id)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  const ownership = ds.ownershipEvents
    .filter((o) => o.shipmentId === id)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  const temps = getTemperatureReadings(id);
  const risks = getRiskEvents({ shipmentId: id });
  const now = DEMO_NOW.getTime();

  // Build ordered, de-duplicated node sequence from events.
  interface Acc {
    locationId: string;
    legMode?: import("@/lib/data/types").Mode;
    arrivalMs: number;
    events: import("@/lib/data/types").JourneyStageEvent[];
  }
  const ordered: Acc[] = [];
  for (const e of events) {
    const last = ordered[ordered.length - 1];
    if (last && last.locationId === e.locationId) {
      last.events.push({ eventType: e.eventType, timestamp: e.timestamp, mode: e.mode, note: e.note });
      continue;
    }
    ordered.push({
      locationId: e.locationId,
      legMode: e.mode,
      arrivalMs: parseISO(e.timestamp).getTime(),
      events: [{ eventType: e.eventType, timestamp: e.timestamp, mode: e.mode, note: e.note }],
    });
  }

  const stages: import("@/lib/data/types").JourneyStage[] = ordered.map((acc, i) => {
    const loc = locById.get(acc.locationId);
    const next = ordered[i + 1];
    const arrivalMs = acc.arrivalMs;
    const departureMs = next ? next.arrivalMs : undefined;
    const prevArrivalMs = i > 0 ? ordered[i - 1].arrivalMs : arrivalMs;

    // Custody handoff landing in this stage window (prevArrival, departure]
    const windowEnd = departureMs ?? now;
    const custodyHere = custody.filter((c) => {
      const t = parseISO(c.timestamp).getTime();
      return t > prevArrivalMs - 1 && t <= windowEnd;
    });
    const handoff = custodyHere[custodyHere.length - 1];

    // Current owner at arrival
    let owner: string | undefined;
    for (const o of ownership) {
      if (parseISO(o.timestamp).getTime() <= arrivalMs) owner = partnerName(o.newOwnerId);
    }
    if (!owner && ownership[0]) owner = partnerName(ownership[0].previousOwnerId);

    // Temperature stats at this node
    const stageTemps = temps.filter((t) => t.locationId === acc.locationId);
    const temp = stageTemps.length
      ? {
          min: round(Math.min(...stageTemps.map((t) => t.temperatureC)), 1),
          max: round(Math.max(...stageTemps.map((t) => t.temperatureC)), 1),
          avg: round(stageTemps.reduce((a, t) => a + t.temperatureC, 0) / stageTemps.length, 1),
          excursion: stageTemps.some((t) => t.excursion),
          count: stageTemps.length,
        }
      : undefined;

    // Risks within stage window
    const stageRisks = risks
      .filter((r) => {
        const t = parseISO(r.timestamp).getTime();
        return t > prevArrivalMs - 1 && t <= windowEnd;
      })
      .map((r) => ({ type: r.type, severity: r.severity, description: r.description }));

    const status: import("@/lib/data/types").JourneyStageStatus =
      arrivalMs > now
        ? "UPCOMING"
        : departureMs && departureMs <= now
          ? "COMPLETE"
          : "CURRENT";

    return {
      index: i,
      locationId: acc.locationId,
      locationName: loc?.name ?? acc.locationId,
      locationType: loc?.type ?? "WAREHOUSE",
      country: loc?.country ?? "",
      lat: loc?.lat ?? 0,
      lng: loc?.lng ?? 0,
      legMode: acc.legMode,
      arrivalTs: new Date(arrivalMs).toISOString(),
      departureTs: departureMs ? new Date(departureMs).toISOString() : undefined,
      dwellHours: departureMs ? round((departureMs - arrivalMs) / (1000 * 60 * 60), 0) : undefined,
      custodyFrom: handoff ? partnerName(handoff.fromPartyId) : undefined,
      custodyTo: handoff ? partnerName(handoff.toPartyId) : undefined,
      custodyValid: handoff ? handoff.valid : undefined,
      owner,
      temp,
      events: acc.events,
      risks: stageRisks,
      status,
    };
  });

  let currentStageIndex = stages.findIndex((s) => s.status === "CURRENT");
  if (currentStageIndex < 0) {
    const lastComplete = [...stages].reverse().find((s) => s.status === "COMPLETE");
    currentStageIndex = lastComplete ? lastComplete.index : 0;
  }

  return {
    shipmentId: shipment.id,
    productName: getProduct(shipment.productId)?.name ?? shipment.productId,
    batchNumber: shipment.batchNumber,
    primaryMode: shipment.primaryMode,
    status: shipment.status,
    originName: locById.get(shipment.originId)?.name ?? shipment.originId,
    destinationName: locById.get(shipment.destinationId)?.name ?? shipment.destinationId,
    currentStageIndex,
    stages,
  };
}

// -----------------------------------------------------------------------------
// AskMe helpers (reused by the engine)
// -----------------------------------------------------------------------------

export function getAtRiskShipments(): Shipment[] {
  return getDataset().shipments.filter(shipmentIsAtRisk);
}

export function getExcursionShipmentsLastWeek(): Shipment[] {
  const ds = getDataset();
  const recentExcursionShipmentIds = new Set(
    ds.temperatureReadings
      .filter((r) => r.excursion && isWithinLastDays(r.timestamp, 7))
      .map((r) => r.shipmentId),
  );
  return ds.shipments.filter((s) => recentExcursionShipmentIds.has(s.id));
}

export function getUnauthorizedInteractions(): CustodyEvent[] {
  const ds = getDataset();
  const unauthorized = new Set(
    ds.tradingPartners.filter((p) => p.auth === "UNAUTHORIZED").map((p) => p.id),
  );
  return ds.custodyEvents.filter(
    (c) => unauthorized.has(c.fromPartyId) || unauthorized.has(c.toPartyId),
  );
}

export function getIncompleteTraceabilityShipments(): Shipment[] {
  return getDataset().shipments.filter((s) => !s.traceabilityComplete);
}

export { hoursBetween };
