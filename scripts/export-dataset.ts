/**
 * Exports the EXACT unified dataset that powers the application and the Ask Me
 * feature. Because the dataset is generated deterministically (fixed seed), the
 * exported files match the running app end-to-end: every dashboard, trace and
 * Ask Me answer is derived from this same data.
 *
 * Run: npm run export:data
 * Output: public/data/veritrace-dataset.json, veritrace-askme-reference.json,
 *         and per-entity CSVs under public/data/csv/.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import * as XLSX from "xlsx";

import { getDataset } from "@/lib/data/seed";
import { ASKME_EXAMPLES, answerQuestion } from "@/lib/engines/askme";
import { DEMO_NOW } from "@/lib/utils/date";

const OUT = "public/data";
const CSV_OUT = `${OUT}/csv`;
mkdirSync(CSV_OUT, { recursive: true });

const ds = getDataset();

// ---- 1. Full unified dataset (canonical JSON) ----
const datasetFile = {
  product: "Veritrace — Netlink's Flagship AI Product",
  description:
    "Unified supply-chain dataset powering Veritrace and its Ask Me assistant. Deterministic snapshot; matches the application end-to-end.",
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
writeFileSync(`${OUT}/veritrace-dataset.json`, JSON.stringify(datasetFile, null, 2));

// ---- 2. Ask Me reference: the 9 questions + engine-computed answers ----
const askmeFile = {
  product: "Veritrace — Ask Me",
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
writeFileSync(`${OUT}/veritrace-askme-reference.json`, JSON.stringify(askmeFile, null, 2));

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

// Ask Me sheet
const askmeRows = askmeFile.questions.map((q, i) => ({
  "#": i + 1,
  Question: q.question,
  Intent: q.intent,
  Answer: q.summary,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(askmeRows), "Ask Me");

XLSX.writeFile(wb, `${OUT}/veritrace-dataset.xlsx`);

console.log(
  `Exported dataset (${Object.values(datasetFile.counts).reduce((a, b) => a + b, 0)} records) ->\n` +
    `  ${OUT}/veritrace-dataset.json\n` +
    `  ${OUT}/veritrace-askme-reference.json\n` +
    `  ${OUT}/veritrace-dataset.xlsx (${Object.keys(tables).length + 2} sheets)\n` +
    `  ${CSV_OUT}/*.csv (${Object.keys(tables).length} tables)`,
);
