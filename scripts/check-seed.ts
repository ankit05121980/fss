/**
 * Deterministic-reconciliation check for the Lumenore dataset.
 *
 * Run with: npm run seed:check
 *
 * Verifies the golden-thread invariants the demo depends on AND that the
 * generator is fully deterministic (two independent generations are identical).
 */
import {
  activeExcursionCount,
  authorizedPartnerPct,
  getExecutiveKpis,
  getPartners,
  getRecall,
  getRiskEvents,
  getSerial,
  resolveTrace,
  serializationCoveragePct,
  traceabilityCoveragePct,
} from "@/lib/data/access";
import { regenerateDataset } from "@/lib/data/seed";
import { HERO } from "@/lib/utils/constants";
import type { RiskType } from "@/lib/data/types";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  const status = cond ? "PASS" : "FAIL";
  if (!cond) failures += 1;
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

// --- Determinism -------------------------------------------------------------
const a = regenerateDataset();
const b = regenerateDataset();
check(
  "Dataset is deterministic (two generations identical)",
  JSON.stringify(a) === JSON.stringify(b),
);

// --- Entity population -------------------------------------------------------
check("Products = 10", a.products.length === 10, `${a.products.length}`);
check("Batches = 20", a.batches.length === 20, `${a.batches.length}`);
check("Shipments = 50", a.shipments.length === 50, `${a.shipments.length}`);
check("Trading partners = 18", a.tradingPartners.length === 18, `${a.tradingPartners.length}`);
check("Carriers = 8", a.carriers.length === 8, `${a.carriers.length}`);
check("Risk events >= 30", a.riskEvents.length >= 30, `${a.riskEvents.length}`);
check(
  "Ocean shipments ~12",
  a.shipments.filter((s) => s.primaryMode === "OCEAN").length >= 12,
  `${a.shipments.filter((s) => s.primaryMode === "OCEAN").length}`,
);
check(
  "Rail shipments >= 2",
  a.shipments.filter((s) => s.primaryMode === "RAIL").length >= 2,
  `${a.shipments.filter((s) => s.primaryMode === "RAIL").length}`,
);

// --- A2: SN0008743 resolves fully -------------------------------------------
const unit = getSerial(HERO.serial);
check("SN0008743 exists", !!unit);
const trace = resolveTrace(HERO.serial, "serial");
check("SN0008743 resolves to a shipment", !!trace?.shipment);
check("SN0008743 trace has product", trace?.product?.name === HERO.productName);
check("SN0008743 trace has custody chain", (trace?.custody.length ?? 0) > 0);
check("SN0008743 trace has ownership chain", (trace?.ownership.length ?? 0) > 0);
check("SN0008743 trace has temperature history", (trace?.temperatures.length ?? 0) > 0);
check("SN0008743 is verified", unit?.verified === true);

// --- A4: hero excursion linked to customs -----------------------------------
const heroTemps = a.temperatureReadings.filter((t) => t.shipmentId === HERO.shipmentId);
const heroExcursions = heroTemps.filter((t) => t.excursion);
check("Hero shipment has excursion readings", heroExcursions.length > 0);
check(
  "Hero excursion peaks near 10°C",
  heroExcursions.some((t) => t.temperatureC >= 9.5),
  `max ${Math.max(...heroExcursions.map((t) => t.temperatureC)).toFixed(1)}°C`,
);
check(
  "Hero excursion occurs at customs node",
  heroExcursions.some((t) => t.locationId === "loc-customs-newark"),
);

// --- A6: recall counts -------------------------------------------------------
const recall = getRecall(HERO.recallId);
check("RCL-2026-001 impacted = 24500", recall?.impactedPackages === 24500);
check("RCL-2026-001 located = 24120", recall?.locatedPackages === 24120);
check("RCL-2026-001 outstanding = 380", recall?.outstandingPackages === 380);
check(
  "RCL-2026-001 reconciles (located + outstanding = impacted)",
  (recall?.locatedPackages ?? 0) + (recall?.outstandingPackages ?? 0) === (recall?.impactedPackages ?? -1),
);

// --- A7: expired & unauthorized partners ------------------------------------
const partners = getPartners();
check(
  "Exactly 3 expired-licence partners",
  partners.filter((p) => p.license === "EXPIRED").length === 3,
  `${partners.filter((p) => p.license === "EXPIRED").length}`,
);
check(
  "Exactly 2 unauthorized partners",
  partners.filter((p) => p.auth === "UNAUTHORIZED").length === 2,
  `${partners.filter((p) => p.auth === "UNAUTHORIZED").length}`,
);

// --- A8: every risk type present --------------------------------------------
const riskTypes: RiskType[] = [
  "DELAY",
  "TEMPERATURE_EXCURSION",
  "ROUTE_DEVIATION",
  "MISSING_SCAN",
  "UNAUTHORIZED_TRANSFER",
];
for (const t of riskTypes) {
  check(`Risk type present: ${t}`, getRiskEvents({ type: t }).length > 0);
}

// --- Reconciled KPIs are sane -----------------------------------------------
const exec = getExecutiveKpis();
check("Traceability coverage 0-100", exec.traceabilityCoveragePct > 0 && exec.traceabilityCoveragePct <= 100, `${exec.traceabilityCoveragePct}%`);
check("Serialization coverage matches helper", exec.serializationCoveragePct === serializationCoveragePct());
check("Authorized partner % matches helper", exec.authorizedPartnerPct === authorizedPartnerPct());
check("Active excursions >= 1 (hero)", activeExcursionCount() >= 1, `${activeExcursionCount()}`);
check("Traceability helper consistent", exec.traceabilityCoveragePct === traceabilityCoveragePct());

console.log("");
if (failures > 0) {
  console.error(`\u2717 ${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\u2713 All reconciliation checks passed");
}
