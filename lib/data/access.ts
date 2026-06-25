// =============================================================================
// Lumenore — Data Access Layer
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
      const toUnauthorized = ds.tradingPartners.find((p) => p.id === c.toPartyId)?.auth === "UNAUTHORIZED";
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

function buildTraceForShipment(shipment: Shipment, query: string, resolvedType: TraceQueryType, unit?: SerializedUnit): TraceResult {
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
      const shipment =
        shipmentForBatch(unit.batchNumber) ?? ds.shipments.find((s) => s.productId);
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

export function getControlTowerKpis(): ControlTowerKpis {
  const ds = getDataset();
  const ships = ds.shipments;
  const active = ships.filter(isActive);
  const delivered = ships.filter((s) => s.status === "DELIVERED");
  const onTimeDelivered = delivered.filter((s) => s.delayHours === 0).length;
  const carrierScore = ds.carriers.length
    ? round(
        ds.carriers.reduce((a, c) => a + c.performanceScore, 0) / ds.carriers.length,
        0,
      )
    : 0;
  return {
    activeShipments: active.length,
    delayedShipments: ships.filter((s) => s.status === "DELAYED" || s.status === "CUSTOMS_HOLD").length,
    inTransit: ships.filter((s) => s.status === "IN_TRANSIT").length,
    inventoryInMotion: active.reduce((a, s) => a + s.packageCount, 0),
    onTimeDeliveryPct: delivered.length ? round((onTimeDelivered / delivered.length) * 100, 1) : 100,
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
  const sensorFailShipments = new Set(
    readings.filter((r) => !r.sensorOk).map((r) => r.shipmentId),
  );
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

export function getCoverageTrend(points = 12): { date: string; traceability: number; serialization: number }[] {
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
        delayedCount: own.filter((s) => s.status === "DELAYED" || s.status === "CUSTOMS_HOLD").length,
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

export function getShipmentRows(filter: ShipmentFilter = {}): import("@/lib/data/types").ShipmentRow[] {
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
