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

console.log(
  `Exported dataset (${Object.values(datasetFile.counts).reduce((a, b) => a + b, 0)} records) ->\n` +
    `  ${OUT}/veritrace-dataset.json\n` +
    `  ${OUT}/veritrace-askme-reference.json\n` +
    `  ${CSV_OUT}/*.csv (${Object.keys(tables).length} tables)`,
);
