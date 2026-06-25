// =============================================================================
// Lumenore — Predictive risk engine (POC heuristic models)
//
// Transparent, deterministic weighted-feature scoring. Every score is derived
// from the seeded dataset and exposes its top drivers for explainability. No
// randomness: identical inputs always yield identical scores.
// =============================================================================

import {
  getCarrierPerformance,
  getCustodyGaps,
  getPartners,
  getProduct,
  getRecalls,
} from "@/lib/data/access";
import { getDataset } from "@/lib/data/seed";
import { round } from "@/lib/utils/prng";
import type {
  PartnerRiskScore,
  PredictiveAlert,
  PredictiveBundle,
  PredictiveScore,
  Shipment,
} from "@/lib/data/types";

interface Driver {
  factor: string;
  weight: number;
}

function clampPct(n: number): number {
  return Math.max(2, Math.min(99, round(n, 0)));
}

function topDrivers(drivers: Driver[], n = 4): Driver[] {
  return [...drivers]
    .filter((d) => d.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, n)
    .map((d) => ({ factor: d.factor, weight: round(d.weight, 0) }));
}

interface ScoredShipment {
  score: PredictiveScore;
  dims: { delay: Driver[]; exc: Driver[]; recall: Driver[]; trace: Driver[] };
}

function scoreShipment(shipment: Shipment): ScoredShipment {
  const ds = getDataset();
  const product = getProduct(shipment.productId);
  const isCold = product ? product.tempMaxC <= 8 : false;
  const carrierPerf = getCarrierPerformance().find((c) => c.carrierId === shipment.carrierId);
  const recallBatches = new Set(
    getRecalls()
      .filter((r) => r.status === "OPEN")
      .map((r) => r.batchNumber),
  );
  const custodyGaps = getCustodyGaps(shipment.id);
  const unauthorizedIds = new Set(
    ds.tradingPartners.filter((p) => p.auth === "UNAUTHORIZED").map((p) => p.id),
  );
  const involvesUnauthorized = ds.custodyEvents.some(
    (c) =>
      c.shipmentId === shipment.id &&
      (unauthorizedIds.has(c.fromPartyId) || unauthorizedIds.has(c.toPartyId)),
  );
  const atCustoms = shipment.status === "CUSTOMS_HOLD";

  // --- Delay probability ---
  const delayDrivers: Driver[] = [];
  let delay = 8;
  if (shipment.primaryMode === "OCEAN") {
    delay += 18;
    delayDrivers.push({ factor: "Ocean freight transit", weight: 18 });
  } else if (shipment.primaryMode === "AIR") {
    delay += 5;
    delayDrivers.push({ factor: "Air freight", weight: 5 });
  }
  if (atCustoms) {
    delay += 30;
    delayDrivers.push({ factor: "Currently held in customs", weight: 30 });
  } else if (shipment.status === "DELAYED") {
    delay += 26;
    delayDrivers.push({ factor: "In delayed status", weight: 26 });
  }
  if (shipment.delayHours > 0) {
    const w = Math.min(shipment.delayHours, 40) * 0.6;
    delay += w;
    delayDrivers.push({ factor: `Accrued delay ${shipment.delayHours}h`, weight: w });
  }
  if (carrierPerf && carrierPerf.onTimePct < 70) {
    delay += 14;
    delayDrivers.push({ factor: `Carrier on-time only ${carrierPerf.onTimePct}%`, weight: 14 });
  }
  if (shipment.hasExcursion) {
    delay += 12;
    delayDrivers.push({ factor: "Active disruption en route", weight: 12 });
  }
  if (recallBatches.has(shipment.batchNumber)) {
    delay += 9;
    delayDrivers.push({ factor: "Recall-impacted consignment", weight: 9 });
  }
  if (
    ds.shipmentEvents.some((e) => e.shipmentId === shipment.id && e.eventType === "CUSTOMS_ENTRY")
  ) {
    delay += 8;
    delayDrivers.push({ factor: "Customs clearance on route", weight: 8 });
  }

  // --- Excursion probability ---
  const excDrivers: Driver[] = [];
  let exc = isCold ? 12 : 2;
  if (isCold) excDrivers.push({ factor: "Cold-chain product (2–8°C)", weight: 12 });
  if (isCold && atCustoms) {
    exc += 38;
    excDrivers.push({ factor: "Expected customs delay", weight: 38 });
  }
  if (isCold && shipment.delayHours > 12) {
    exc += 16;
    excDrivers.push({ factor: "Extended dwell > 12h", weight: 16 });
  }
  if (shipment.hasExcursion) {
    exc += 34;
    excDrivers.push({ factor: "Active excursion detected", weight: 34 });
  }
  if (isCold && carrierPerf && carrierPerf.performanceScore < 60) {
    exc += 8;
    excDrivers.push({ factor: "Lower-performing carrier", weight: 8 });
  }

  // --- Recall exposure ---
  const recallDrivers: Driver[] = [];
  let recall = 4;
  if (recallBatches.has(shipment.batchNumber)) {
    recall += 55;
    recallDrivers.push({ factor: "Batch under active recall", weight: 55 });
  }
  if (shipment.hasExcursion) {
    recall += 20;
    recallDrivers.push({ factor: "Temperature excursion", weight: 20 });
  }
  if (isCold) {
    recall += 8;
    recallDrivers.push({ factor: "Temperature-sensitive product", weight: 8 });
  }
  if (shipment.packageCount > 1500) {
    recall += 8;
    recallDrivers.push({ factor: "High package volume", weight: 8 });
  }

  // --- Traceability-failure risk ---
  const traceDrivers: Driver[] = [];
  let trace = 6;
  if (!shipment.traceabilityComplete) {
    trace += 45;
    traceDrivers.push({ factor: "Incomplete custody chain", weight: 45 });
  }
  if (custodyGaps.length > 0) {
    const w = Math.min(custodyGaps.length, 4) * 8;
    trace += w;
    traceDrivers.push({ factor: `${custodyGaps.length} custody documentation gap(s)`, weight: w });
  }
  if (involvesUnauthorized) {
    trace += 30;
    traceDrivers.push({ factor: "Unauthorized partner interaction", weight: 30 });
  }

  const allDrivers = [...delayDrivers, ...excDrivers, ...recallDrivers, ...traceDrivers];

  return {
    score: {
      shipmentId: shipment.id,
      delayProbability: clampPct(delay),
      excursionProbability: clampPct(exc),
      recallExposure: clampPct(recall),
      traceabilityFailureRisk: clampPct(trace),
      topDrivers: topDrivers(allDrivers, 5),
    },
    dims: {
      delay: topDrivers(delayDrivers, 2),
      exc: topDrivers(excDrivers, 2),
      recall: topDrivers(recallDrivers, 2),
      trace: topDrivers(traceDrivers, 2),
    },
  };
}

function scorePartners(): PartnerRiskScore[] {
  const ds = getDataset();
  return getPartners()
    .map((p) => {
      const drivers: Driver[] = [];
      const score = p.riskScore;
      if (p.auth === "UNAUTHORIZED")
        drivers.push({ factor: "Not an authorized trading partner", weight: 40 });
      if (p.license === "EXPIRED") drivers.push({ factor: "Expired licence", weight: 30 });
      if (p.license === "EXPIRING_SOON")
        drivers.push({ factor: "Licence expiring soon", weight: 12 });
      const partnerGaps = ds.custodyEvents.filter(
        (c) => !c.valid && (c.fromPartyId === p.id || c.toPartyId === p.id),
      ).length;
      if (partnerGaps > 0)
        drivers.push({ factor: `${partnerGaps} custody-doc gap(s)`, weight: partnerGaps * 8 });
      if (p.riskScore >= 60)
        drivers.push({ factor: `Elevated base risk score (${p.riskScore})`, weight: 20 });

      const trend: PartnerRiskScore["trend"] =
        p.id === "tp-abc" || p.auth === "UNAUTHORIZED" || p.riskScore >= 65
          ? "RISING"
          : p.riskScore <= 25
            ? "STABLE"
            : "STABLE";

      return {
        partnerId: p.id,
        name: p.name,
        riskScore: round(score, 0),
        trend,
        topDrivers: topDrivers(drivers, 3),
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

function buildAlerts(
  scored: ScoredShipment[],
  partnerScores: PartnerRiskScore[],
): PredictiveAlert[] {
  const alerts: PredictiveAlert[] = [];
  const byDelay = [...scored].sort((a, b) => b.score.delayProbability - a.score.delayProbability);
  const byExc = [...scored].sort(
    (a, b) => b.score.excursionProbability - a.score.excursionProbability,
  );
  const byTrace = [...scored].sort(
    (a, b) => b.score.traceabilityFailureRisk - a.score.traceabilityFailureRisk,
  );

  // Golden-thread shipments lead the alert feed when present, otherwise the
  // highest-scoring active shipment for that risk type.
  const delayLead = scored.find((s) => s.score.shipmentId === "SHP-001") ?? byDelay[0];
  if (delayLead) {
    alerts.push({
      id: `alert-delay-${delayLead.score.shipmentId}`,
      title: `${delayLead.score.shipmentId} — ${delayLead.score.delayProbability}% delay probability`,
      detail: `Leading drivers: ${delayLead.dims.delay.map((d) => d.factor.toLowerCase()).join(", ") || "multiple factors"}.`,
      severity: delayLead.score.delayProbability >= 70 ? "HIGH" : "MEDIUM",
      riskType: "DELAY",
      href: `/traceability?type=shipment&q=${delayLead.score.shipmentId}`,
    });
  }
  const excLead =
    scored.find((s) => s.score.shipmentId === "SHP-007") ??
    byExc.find((s) => s.score.excursionProbability >= 50) ??
    byExc[0];
  if (excLead) {
    alerts.push({
      id: `alert-exc-${excLead.score.shipmentId}`,
      title: `${excLead.score.shipmentId} — ${excLead.score.excursionProbability}% excursion probability`,
      detail: `High temperature-excursion risk driven by ${excLead.dims.exc.map((d) => d.factor.toLowerCase()).join(", ") || "cold-chain exposure"}.`,
      severity: excLead.score.excursionProbability >= 70 ? "HIGH" : "MEDIUM",
      riskType: "TEMPERATURE_EXCURSION",
      href: `/traceability?type=shipment&q=${excLead.score.shipmentId}`,
    });
  }
  const risingPartner =
    partnerScores.find((p) => p.name === "ABC Logistics") ??
    partnerScores.find((p) => p.trend === "RISING");
  if (risingPartner) {
    alerts.push({
      id: `alert-partner-${risingPartner.partnerId}`,
      title: `Partner ${risingPartner.name} shows rising compliance risk`,
      detail: `Risk score ${risingPartner.riskScore}/100 (${risingPartner.trend.toLowerCase()}). ${risingPartner.topDrivers[0]?.factor ?? ""}`,
      severity: risingPartner.riskScore >= 70 ? "HIGH" : "MEDIUM",
      riskType: "TRADING_PARTNER",
      href: "/partners",
    });
  }
  if (byTrace[0] && byTrace[0].score.traceabilityFailureRisk >= 50) {
    alerts.push({
      id: `alert-trace-${byTrace[0].score.shipmentId}`,
      title: `${byTrace[0].score.shipmentId} — ${byTrace[0].score.traceabilityFailureRisk}% traceability-failure risk`,
      detail: `${byTrace[0].dims.trace.map((d) => d.factor).join(", ") || "Custody chain gaps detected"}.`,
      severity: "MEDIUM",
      riskType: "MISSING_SCAN",
      href: `/traceability?type=shipment&q=${byTrace[0].score.shipmentId}`,
    });
  }
  return alerts;
}

export function getPredictiveBundle(): PredictiveBundle {
  const activeShipments = getDataset().shipments.filter((s) => s.status !== "DELIVERED");
  const scored = activeShipments.map(scoreShipment);
  const scores = scored
    .map((s) => s.score)
    .sort((a, b) => {
      const am = Math.max(
        a.delayProbability,
        a.excursionProbability,
        a.recallExposure,
        a.traceabilityFailureRisk,
      );
      const bm = Math.max(
        b.delayProbability,
        b.excursionProbability,
        b.recallExposure,
        b.traceabilityFailureRisk,
      );
      return bm - am;
    });
  const partnerScores = scorePartners();
  const alerts = buildAlerts(scored, partnerScores);
  return { scores, partnerScores, alerts };
}
