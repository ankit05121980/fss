/**
 * Exports the EXACT unified dataset that powers the application and the Ask Me
 * feature. Because the dataset is generated deterministically (fixed seed), the
 * exported files match the running app end-to-end: every dashboard, trace and
 * Ask Me answer is derived from this same data.
 *
 * Run: npm run export:data
 * Output: public/data/nettrace-dataset.json, nettrace-askme-reference.json,
 *         and per-entity CSVs under public/data/csv/.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import * as XLSX from "xlsx";

import {
  eventsAffectingShipment,
  getRecalls,
  getShipmentDetail,
  getShipments,
} from "@/lib/data/access";
import { getDataset } from "@/lib/data/seed";
import { ASKME_EXAMPLES, answerQuestion } from "@/lib/engines/askme";
import { DEMO_NOW } from "@/lib/utils/date";
import { round } from "@/lib/utils/prng";

const OUT = "public/data";
const CSV_OUT = `${OUT}/csv`;
mkdirSync(CSV_OUT, { recursive: true });

const ds = getDataset();

// ---- 1. Full unified dataset (canonical JSON) ----
const datasetFile = {
  product: "NetTrace — Netlink's Flagship AI Product",
  description:
    "Unified supply-chain dataset powering NetTrace and its Ask Me assistant. Deterministic snapshot; matches the application end-to-end.",
  dataAsOf: DEMO_NOW.toISOString(),
  counts: {
    products: ds.products.length,
    batches: ds.batches.length,
    serializedUnits: ds.serializedUnits.length,
    locations: ds.locations.length,
    carriers: ds.carriers.length,
    shipments: ds.shipments.length,
    shipmentEvents: ds.shipmentEvents.length,
    custodyEvents: ds.custodyEvents.length,
    ownershipEvents: ds.ownershipEvents.length,
    temperatureReadings: ds.temperatureReadings.length,
    tradingPartners: ds.tradingPartners.length,
    riskEvents: ds.riskEvents.length,
    recalls: ds.recalls.length,
  },
  data: ds,
};
writeFileSync(`${OUT}/nettrace-dataset.json`, JSON.stringify(datasetFile, null, 2));

// ---- 2. Ask Me reference: the 9 questions + engine-computed answers ----
const askmeFile = {
  product: "NetTrace — Ask Me",
  note: "The nine reference questions and the deterministic answers computed from the dataset above. These reconcile with the dashboards.",
  dataAsOf: DEMO_NOW.toISOString(),
  questions: ASKME_EXAMPLES.map((ex) => {
    const result = answerQuestion(ex.text);
    return {
      question: ex.text,
      intent: result.intent,
      summary: result.summary,
      table: result.table ?? null,
      chart: result.chart ?? null,
      links: result.links,
    };
  }),
};
writeFileSync(`${OUT}/nettrace-askme-reference.json`, JSON.stringify(askmeFile, null, 2));

// ---- 3. Per-entity CSVs (open in Excel) ----
function toCsv(input: readonly unknown[]): string {
  const rows = input as Record<string, unknown>[];
  if (rows.length === 0) return "";
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = Array.isArray(v)
      ? v.join("|")
      : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

const tables: Record<string, readonly unknown[]> = {
  products: ds.products,
  batches: ds.batches,
  serialized_units: ds.serializedUnits,
  locations: ds.locations,
  carriers: ds.carriers,
  shipments: ds.shipments,
  shipment_events: ds.shipmentEvents,
  custody_events: ds.custodyEvents,
  ownership_events: ds.ownershipEvents,
  temperature_readings: ds.temperatureReadings,
  trading_partners: ds.tradingPartners,
  risk_events: ds.riskEvents,
  recalls: ds.recalls,
};
for (const [name, rows] of Object.entries(tables)) {
  writeFileSync(`${CSV_OUT}/${name}.csv`, toCsv(rows));
}

// ---- 3b. Single denormalized Shipment table (one row per shipment, all dimensions joined) ----
const partnerName = new Map(ds.tradingPartners.map((p) => [p.id, p.name]));
const recalls = getRecalls();

const denormShipments = getShipments().map((s) => {
  const d = getShipmentDetail(s.id)!;
  const t = d.temperatures.map((r) => r.temperatureC);
  const risksByType: Record<string, number> = {};
  for (const r of d.risks) risksByType[r.type] = (risksByType[r.type] ?? 0) + 1;
  const recall = recalls.find((r) => r.batchNumber === s.batchNumber);
  const env = eventsAffectingShipment(s);
  const ownerChain =
    d.ownership.length > 0
      ? [d.ownership[0].previousOwnerId, ...d.ownership.map((o) => o.newOwnerId)]
          .map((id) => partnerName.get(id) ?? id)
          .join(" → ")
      : "";
  const currentLocation = d.events[d.events.length - 1]?.location?.name ?? "";

  return {
    // Shipment
    shipment_id: s.id,
    status: s.status,
    primary_mode: s.primaryMode,
    delay_hours: s.delayHours,
    package_count: s.packageCount,
    departed_at: s.departedAt,
    eta_at: s.etaAt,
    delivered_at: s.deliveredAt ?? "",
    has_excursion: s.hasExcursion,
    traceability_complete: s.traceabilityComplete,
    current_location: currentLocation,
    // Product dimension
    product_id: d.product?.id ?? "",
    product_name: d.product?.name ?? "",
    drug_category: d.product?.drugCategory ?? "",
    storage_requirement: d.product?.storageRequirement ?? "",
    temp_min_c: d.product?.tempMinC ?? "",
    temp_max_c: d.product?.tempMaxC ?? "",
    gtin: d.product?.gtin ?? "",
    // Batch dimension
    batch_number: d.batch?.batchNumber ?? "",
    manufacturing_date: d.batch?.manufacturingDate ?? "",
    expiration_date: d.batch?.expirationDate ?? "",
    manufacturer_name: d.batch?.manufacturerName ?? "",
    manufacturer_country: d.batch?.manufacturerCountry ?? "",
    batch_unit_count: d.batch?.unitCount ?? "",
    // Carrier dimension
    carrier_id: d.carrier?.id ?? "",
    carrier_name: d.carrier?.name ?? "",
    carrier_modes: (d.carrier?.modes ?? []).join(" | "),
    carrier_on_time_pct: d.carrier?.onTimePct ?? "",
    carrier_performance_score: d.carrier?.performanceScore ?? "",
    // Origin location dimension
    origin_id: d.origin?.id ?? "",
    origin_name: d.origin?.name ?? "",
    origin_type: d.origin?.type ?? "",
    origin_country: d.origin?.country ?? "",
    origin_lat: d.origin?.lat ?? "",
    origin_lng: d.origin?.lng ?? "",
    // Destination location dimension
    destination_id: d.destination?.id ?? "",
    destination_name: d.destination?.name ?? "",
    destination_type: d.destination?.type ?? "",
    destination_country: d.destination?.country ?? "",
    destination_lat: d.destination?.lat ?? "",
    destination_lng: d.destination?.lng ?? "",
    // Event / custody / ownership aggregates
    event_count: d.events.length,
    custody_event_count: d.custody.length,
    custody_gap_count: d.custody.filter((c) => !c.valid).length,
    ownership_transfer_count: d.ownership.length,
    ownership_chain: ownerChain,
    // Temperature aggregates
    temp_reading_count: t.length,
    temp_min_observed: t.length ? round(Math.min(...t), 1) : "",
    temp_max_observed: t.length ? round(Math.max(...t), 1) : "",
    temp_avg_observed: t.length ? round(t.reduce((a, b) => a + b, 0) / t.length, 1) : "",
    excursion_reading_count: d.temperatures.filter((r) => r.excursion).length,
    // Risk aggregates
    risk_event_count: d.risks.length,
    open_risk_count: d.risks.filter((r) => !r.resolved).length,
    risk_delay: risksByType.DELAY ?? 0,
    risk_temperature_excursion: risksByType.TEMPERATURE_EXCURSION ?? 0,
    risk_route_deviation: risksByType.ROUTE_DEVIATION ?? 0,
    risk_missing_scan: risksByType.MISSING_SCAN ?? 0,
    risk_unauthorized_transfer: risksByType.UNAUTHORIZED_TRANSFER ?? 0,
    // Environmental conditions on route
    environmental_conditions: env.map((e) => e.label).join(" | "),
    // Recall dimension
    recall_id: recall?.id ?? "",
    recall_status: recall?.status ?? "",
    recall_impacted_packages: recall?.impactedPackages ?? "",
    recall_located_packages: recall?.locatedPackages ?? "",
    recall_outstanding_packages: recall?.outstandingPackages ?? "",
  };
});

writeFileSync(`${OUT}/shipments_denormalized.json`, JSON.stringify(denormShipments, null, 2));
writeFileSync(`${OUT}/shipments_denormalized.csv`, toCsv(denormShipments));

// ---- 4. Real multi-sheet Excel workbook ----
function flattenForSheet(input: readonly unknown[]): Record<string, string | number | boolean>[] {
  return (input as Record<string, unknown>[]).map((row) => {
    const out: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v === null || v === undefined) out[k] = "";
      else if (Array.isArray(v)) out[k] = v.join(" | ");
      else if (typeof v === "object") out[k] = JSON.stringify(v);
      else out[k] = v as string | number | boolean;
    }
    return out;
  });
}

const wb = XLSX.utils.book_new();

// Overview sheet
const overviewRows = Object.entries(datasetFile.counts).map(([entity, count]) => ({
  Entity: entity,
  Records: count,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewRows), "Overview");

// One sheet per entity (sheet names <= 31 chars)
const SHEET_NAMES: Record<string, string> = {
  products: "Products",
  batches: "Batches",
  serialized_units: "Serialized Units",
  locations: "Locations",
  carriers: "Carriers",
  shipments: "Shipments",
  shipment_events: "Shipment Events",
  custody_events: "Custody Events",
  ownership_events: "Ownership Events",
  temperature_readings: "Temperature Readings",
  trading_partners: "Trading Partners",
  risk_events: "Risk Events",
  recalls: "Recalls",
};
for (const [name, rows] of Object.entries(tables)) {
  const ws = XLSX.utils.json_to_sheet(flattenForSheet(rows));
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAMES[name] ?? name.slice(0, 31));
}

// Denormalized shipments sheet (one row per shipment, all dimensions)
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.json_to_sheet(flattenForSheet(denormShipments)),
  "Shipments Denormalized",
);

// Ask Me sheet
const askmeRows = askmeFile.questions.map((q, i) => ({
  "#": i + 1,
  Question: q.question,
  Intent: q.intent,
  Answer: q.summary,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(askmeRows), "Ask Me");

XLSX.writeFile(wb, `${OUT}/nettrace-dataset.xlsx`);

console.log(
  `Exported dataset (${Object.values(datasetFile.counts).reduce((a, b) => a + b, 0)} records) ->\n` +
    `  ${OUT}/nettrace-dataset.json\n` +
    `  ${OUT}/nettrace-askme-reference.json\n` +
    `  ${OUT}/nettrace-dataset.xlsx (${Object.keys(tables).length + 3} sheets)\n` +
    `  ${OUT}/shipments_denormalized.csv (${denormShipments.length} rows, ${Object.keys(denormShipments[0] ?? {}).length} columns)\n` +
    `  ${CSV_OUT}/*.csv (${Object.keys(tables).length} tables)`,
);
