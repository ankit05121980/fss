// =============================================================================
// Lumenore — Unified Supply Chain Data Model
// All TypeScript interfaces for the FSS DSCSA Readiness POC.
// These types are the single contract shared by the seed, data-access layer,
// engines, API route handlers, React Query hooks, and UI components.
// =============================================================================

export type Mode = "OCEAN" | "AIR" | "TRUCK" | "RAIL";
export type ShipmentStatus = "IN_TRANSIT" | "DELAYED" | "DELIVERED" | "CUSTOMS_HOLD";
export type RiskType =
  | "DELAY"
  | "TEMPERATURE_EXCURSION"
  | "ROUTE_DEVIATION"
  | "MISSING_SCAN"
  | "UNAUTHORIZED_TRANSFER";
export type Severity = "LOW" | "MEDIUM" | "HIGH";
export type PartnerAuth = "AUTHORIZED" | "UNAUTHORIZED";
export type LicenseStatus = "VALID" | "EXPIRED" | "EXPIRING_SOON";

export type LocationType =
  | "MANUFACTURER"
  | "WAREHOUSE"
  | "PORT"
  | "CUSTOMS"
  | "3PL"
  | "DC"
  | "HOSPITAL";

export type PartnerRole =
  | "MANUFACTURER"
  | "CARRIER"
  | "3PL"
  | "DISTRIBUTOR"
  | "DISPENSER"
  | "FREIGHT_FORWARDER"
  | "CUSTOMS_BROKER";

// -----------------------------------------------------------------------------
// Core entities (mirror the BRD unified data model)
// -----------------------------------------------------------------------------

export interface Product {
  id: string;
  name: string;
  drugCategory: string;
  storageRequirement: string;
  tempMinC: number;
  tempMaxC: number;
  gtin: string;
}

export interface Batch {
  batchNumber: string;
  productId: string;
  manufacturingDate: string;
  expirationDate: string;
  manufacturerName: string;
  manufacturerCountry: string;
  unitCount: number;
}

export interface SerializedUnit {
  serialNumber: string;
  gtin: string;
  lotNumber: string;
  batchNumber: string;
  expiry: string;
  currentLocationId: string;
  verified: boolean;
}

export interface LocationNode {
  id: string;
  name: string;
  type: LocationType;
  lat: number;
  lng: number;
  country: string;
}

export interface Carrier {
  id: string;
  name: string;
  modes: Mode[];
  onTimePct: number;
  performanceScore: number;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  locationId: string;
  eventType: string;
  mode: Mode;
  timestamp: string;
  note?: string;
}

export interface CustodyEvent {
  id: string;
  shipmentId: string;
  fromPartyId: string;
  toPartyId: string;
  timestamp: string;
  valid: boolean;
}

export interface OwnershipEvent {
  id: string;
  shipmentId: string;
  previousOwnerId: string;
  newOwnerId: string;
  timestamp: string;
}

export interface TemperatureReading {
  id: string;
  shipmentId: string;
  timestamp: string;
  temperatureC: number;
  humidityPct: number;
  sensorOk: boolean;
  locationId: string;
  excursion: boolean;
}

export interface TradingPartner {
  id: string;
  name: string;
  role: PartnerRole;
  auth: PartnerAuth;
  license: LicenseStatus;
  licenseExpiry: string;
  gln: string;
  riskScore: number;
}

export interface RiskEvent {
  id: string;
  shipmentId: string;
  type: RiskType;
  severity: Severity;
  timestamp: string;
  description: string;
  resolved: boolean;
}

export interface Shipment {
  id: string;
  batchNumber: string;
  productId: string;
  primaryMode: Mode;
  status: ShipmentStatus;
  originId: string;
  destinationId: string;
  carrierId: string;
  departedAt: string;
  etaAt: string;
  deliveredAt?: string;
  delayHours: number;
  packageCount: number;
  events: string[];
  hasExcursion: boolean;
  traceabilityComplete: boolean;
}

export interface Recall {
  id: string;
  batchNumber: string;
  reason: string;
  openedAt: string;
  impactedPackages: number;
  locatedPackages: number;
  outstandingPackages: number;
  status: "OPEN" | "CLOSED";
  impactedPartnerIds: string[];
}

export interface PredictiveScore {
  shipmentId: string;
  delayProbability: number;
  excursionProbability: number;
  recallExposure: number;
  traceabilityFailureRisk: number;
  topDrivers: { factor: string; weight: number }[];
}

// -----------------------------------------------------------------------------
// The full in-memory dataset (produced once by the seed)
// -----------------------------------------------------------------------------

export interface Dataset {
  products: Product[];
  batches: Batch[];
  serializedUnits: SerializedUnit[];
  locations: LocationNode[];
  carriers: Carrier[];
  shipments: Shipment[];
  shipmentEvents: ShipmentEvent[];
  custodyEvents: CustodyEvent[];
  ownershipEvents: OwnershipEvent[];
  temperatureReadings: TemperatureReading[];
  tradingPartners: TradingPartner[];
  riskEvents: RiskEvent[];
  recalls: Recall[];
}

// -----------------------------------------------------------------------------
// Derived / aggregate types
// -----------------------------------------------------------------------------

export interface TrendPoint {
  date: string;
  value: number;
}

export interface HeatmapCell {
  category: RiskType;
  severity: Severity;
  count: number;
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface ExecutiveKpis {
  overallComplianceScore: number;
  traceabilityCoveragePct: number;
  serializationCoveragePct: number;
  authorizedPartnerPct: number;
  recallReadinessScore: number;
  openComplianceRisks: number;
  activeExcursions: number;
}

export interface ControlTowerKpis {
  activeShipments: number;
  delayedShipments: number;
  inTransit: number;
  inventoryInMotion: number;
  onTimeDeliveryPct: number;
  carrierPerformanceScore: number;
}

export interface ColdChainKpis {
  temperatureExcursions: number;
  highRiskShipments: number;
  sensorFailures: number;
  compliancePct: number;
}

export interface RecallKpis {
  activeRecalls: number;
  impactedProducts: number;
  locatedProducts: number;
  outstandingProducts: number;
}

export interface PartnerKpis {
  authorizedPartnerPct: number;
  expiredLicenses: number;
  complianceViolations: number;
  custodyTransferViolations: number;
}

export interface CarrierPerformance {
  carrierId: string;
  name: string;
  onTimePct: number;
  performanceScore: number;
  totalDelayHours: number;
  delayedCount: number;
  shipmentCount: number;
  custodyGaps: number;
}

export interface PortCongestion {
  locationId: string;
  name: string;
  shipmentsHeld: number;
  avgDwellHours: number;
}

export interface PartnerRiskPoint {
  partnerId: string;
  name: string;
  role: PartnerRole;
  riskScore: number;
  volume: number;
  auth: PartnerAuth;
  license: LicenseStatus;
}

export interface CustodyGap {
  shipmentId: string;
  carrierId: string;
  carrierName: string;
  fromPartyId: string;
  toPartyId: string;
  timestamp: string;
  reason: string;
}

// -----------------------------------------------------------------------------
// Traceability resolution result
// -----------------------------------------------------------------------------

export type TraceQueryType = "serial" | "batch" | "shipment" | "product";

export interface TraceResult {
  query: string;
  resolvedType: TraceQueryType;
  product?: Product;
  batch?: Batch;
  unit?: SerializedUnit;
  shipment?: Shipment;
  currentLocation?: LocationNode;
  events: ShipmentEvent[];
  locationsById: Record<string, LocationNode>;
  partnersById: Record<string, TradingPartner>;
  custody: CustodyEvent[];
  ownership: OwnershipEvent[];
  temperatures: TemperatureReading[];
  custodyGaps: CustodyGap[];
  verified: boolean;
  traceabilityComplete: boolean;
}

// -----------------------------------------------------------------------------
// Global search
// -----------------------------------------------------------------------------

export interface SearchResult {
  type: TraceQueryType;
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

// -----------------------------------------------------------------------------
// AskMe engine result envelope
// -----------------------------------------------------------------------------

export type AskMeIntent =
  | "AT_RISK_SHIPMENTS"
  | "TRACE_SERIAL"
  | "EXCURSIONS_LAST_WEEK"
  | "TOP_DELAY_CARRIERS"
  | "CUSTODY_GAPS"
  | "RECALL_IMPACT"
  | "LATE_OCEAN_SHIPMENTS"
  | "UNAUTHORIZED_PARTNER_INTERACTIONS"
  | "INCOMPLETE_TRACEABILITY"
  | "FALLBACK";

export interface AskMeTable {
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
}

export interface AskMeChart {
  kind: "bar" | "line";
  data: NamedValue[];
  unit?: string;
}

export interface AskMeLink {
  label: string;
  href: string;
}

export interface AskMeResult {
  intent: AskMeIntent;
  matchedQuestion: string;
  summary: string;
  table?: AskMeTable;
  chart?: AskMeChart;
  links: AskMeLink[];
}

// -----------------------------------------------------------------------------
// Do You Know insights
// -----------------------------------------------------------------------------

export interface Insight {
  id: string;
  title: string;
  headline: string;
  detail: string;
  value: string;
  chartKind: "bar" | "line";
  chart: NamedValue[];
}

// -----------------------------------------------------------------------------
// Predictive analytics
// -----------------------------------------------------------------------------

export interface PartnerRiskScore {
  partnerId: string;
  name: string;
  riskScore: number;
  trend: "RISING" | "STABLE" | "FALLING";
  topDrivers: { factor: string; weight: number }[];
}

export interface PredictiveAlert {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  riskType: RiskType | "TRADING_PARTNER";
  href: string;
}

export interface PredictiveBundle {
  scores: PredictiveScore[];
  partnerScores: PartnerRiskScore[];
  alerts: PredictiveAlert[];
}

// -----------------------------------------------------------------------------
// Analytics API response envelopes
// -----------------------------------------------------------------------------

export interface CoverageTrendPoint {
  date: string;
  traceability: number;
  serialization: number;
  // Index signature lets this DTO flow into generic chart components.
  [key: string]: string | number;
}

export interface KpiTrend {
  spark: number[];
  delta: number;
}

export interface ExecutiveAnalytics {
  kpis: ExecutiveKpis;
  kpiTrends: Record<string, KpiTrend>;
  complianceTrend: TrendPoint[];
  coverageTrend: CoverageTrendPoint[];
  riskHeatmap: HeatmapCell[];
  violationsByCategory: NamedValue[];
}

export interface ShipmentRow {
  id: string;
  batchNumber: string;
  productName: string;
  primaryMode: Mode;
  status: ShipmentStatus;
  carrierId: string;
  carrierName: string;
  originId: string;
  originName: string;
  destinationId: string;
  destinationName: string;
  delayHours: number;
  etaAt: string;
  departedAt: string;
  packageCount: number;
  hasExcursion: boolean;
  traceabilityComplete: boolean;
}

export interface ControlTowerAnalytics {
  kpis: ControlTowerKpis;
  shipments: ShipmentRow[];
  carrierPerformance: CarrierPerformance[];
  portCongestion: PortCongestion[];
  delayByMode: NamedValue[];
  locations: LocationNode[];
}

export interface ColdShipmentSummary {
  id: string;
  productName: string;
  status: ShipmentStatus;
  primaryMode: Mode;
  hasExcursion: boolean;
  delayHours: number;
  excursionCount: number;
  maxTemp: number;
  readingCount: number;
  tempMaxC: number;
  tempMinC: number;
}

export interface EnrichedRecall extends Recall {
  impactedPartners: TradingPartner[];
}

export interface RecallAnalytics {
  kpis: RecallKpis;
  recalls: EnrichedRecall[];
  locations: LocationNode[];
}

export interface PartnerAnalytics {
  kpis: PartnerKpis;
  partners: TradingPartner[];
  riskMatrix: PartnerRiskPoint[];
  custodyGaps: CustodyGap[];
  unauthorizedInteractions: CustodyEvent[];
}

// -----------------------------------------------------------------------------
// End-to-end shipment journey (stage-by-stage flow)
// -----------------------------------------------------------------------------

export type JourneyStageStatus = "COMPLETE" | "CURRENT" | "UPCOMING";

export interface JourneyStageEvent {
  eventType: string;
  timestamp: string;
  mode: Mode;
  note?: string;
}

export interface JourneyStageTemp {
  min: number;
  max: number;
  avg: number;
  excursion: boolean;
  count: number;
}

export interface JourneyStage {
  index: number;
  locationId: string;
  locationName: string;
  locationType: LocationType;
  country: string;
  lat: number;
  lng: number;
  legMode?: Mode;
  arrivalTs?: string;
  departureTs?: string;
  dwellHours?: number;
  custodyFrom?: string;
  custodyTo?: string;
  custodyValid?: boolean;
  owner?: string;
  temp?: JourneyStageTemp;
  events: JourneyStageEvent[];
  risks: { type: RiskType; severity: Severity; description: string }[];
  status: JourneyStageStatus;
}

export interface ShipmentJourney {
  shipmentId: string;
  productName: string;
  batchNumber: string;
  primaryMode: Mode;
  status: ShipmentStatus;
  originName: string;
  destinationName: string;
  currentStageIndex: number;
  stages: JourneyStage[];
}
