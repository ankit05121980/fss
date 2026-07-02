// =============================================================================
// Veritrace — AskMe deterministic intent engine
//
// Pattern-matches a natural-language question to one of nine reference intents,
// runs a query over the unified dataset (via the access layer) and returns a
// structured result (table/chart) plus a natural-language summary. Fully
// deterministic — the same question always yields the same answer, and every
// answer reconciles with the dashboards.
//
// An optional LLM hook (NEXT_PUBLIC_USE_LLM) is provided but OFF by default;
// the deterministic engine always ships.
// =============================================================================

import {
  getAtRiskShipments,
  getCarrierPerformance,
  getCustodyGaps,
  getExcursionShipmentsLastWeek,
  getIncompleteTraceabilityShipments,
  getPartner,
  getProduct,
  getRecall,
  getShipment,
  getUnauthorizedInteractions,
  resolveTrace,
} from "@/lib/data/access";
import { getPredictiveBundle } from "@/lib/engines/predictive";
import { fmtDate } from "@/lib/utils/date";
import { HERO } from "@/lib/utils/constants";
import type { AskMeIntent, AskMeResult } from "@/lib/data/types";

export interface AskMeExample {
  intent: AskMeIntent;
  text: string;
}

export const ASKME_EXAMPLES: AskMeExample[] = [
  {
    intent: "AT_RISK_SHIPMENTS",
    text: "Show all shipments currently at risk of DSCSA non-compliance",
  },
  { intent: "TRACE_SERIAL", text: "Trace serial number SN0008743" },
  {
    intent: "EXCURSIONS_LAST_WEEK",
    text: "Which shipments experienced temperature excursions last week?",
  },
  {
    intent: "TOP_DELAY_CARRIERS",
    text: "Which carriers contributed to the highest shipment delays?",
  },
  { intent: "CUSTODY_GAPS", text: "Show custody gaps across all shipments" },
  { intent: "RECALL_IMPACT", text: "List products impacted by Recall RCL-2026-001" },
  { intent: "LATE_OCEAN_SHIPMENTS", text: "Which ocean shipments are likely to arrive late?" },
  {
    intent: "UNAUTHORIZED_PARTNER_INTERACTIONS",
    text: "Show interactions involving unauthorized trading partners",
  },
  {
    intent: "INCOMPLETE_TRACEABILITY",
    text: "What products currently have incomplete traceability chains?",
  },
];

const FALLBACK_MESSAGE =
  "I can answer questions about shipments, traceability, excursions, carriers, custody, recalls, and partners. Try one of the example questions below.";

function normalize(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSerial(q: string): string | null {
  const m = q.match(/\bSN\d{4,}\b/i);
  return m ? m[0].toUpperCase() : null;
}

function extractRecallId(q: string): string | null {
  const m = q.match(/\bRCL-\d{4}-\d{3}\b/i);
  return m ? m[0].toUpperCase() : null;
}

function has(n: string, ...words: string[]): boolean {
  return words.some((w) => n.includes(w));
}

/** Token Jaccard similarity for fuzzy fallback matching. */
function similarity(a: string, b: string): number {
  const stop = new Set([
    "the",
    "a",
    "an",
    "of",
    "to",
    "for",
    "is",
    "are",
    "all",
    "show",
    "which",
    "what",
    "list",
    "me",
    "currently",
  ]);
  const ta = new Set(a.split(" ").filter((t) => t && !stop.has(t)));
  const tb = new Set(b.split(" ").filter((t) => t && !stop.has(t)));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : inter / union;
}

export function classifyIntent(question: string): AskMeIntent {
  const n = normalize(question);

  if (extractSerial(question) || (has(n, "trace") && has(n, "serial", "sn", "unit")))
    return "TRACE_SERIAL";
  if (
    extractRecallId(question) ||
    (has(n, "recall") && has(n, "product", "impact", "affect", "list"))
  )
    return "RECALL_IMPACT";
  if (has(n, "unauthorized", "unauthorised") || (has(n, "suspect") && has(n, "partner")))
    return "UNAUTHORIZED_PARTNER_INTERACTIONS";
  if (has(n, "custody") && has(n, "gap", "missing", "broken", "documentation"))
    return "CUSTODY_GAPS";
  if (has(n, "ocean") && has(n, "late", "delay", "arrive", "likely", "predict"))
    return "LATE_OCEAN_SHIPMENTS";
  if (has(n, "excursion", "temperature", "cold chain", "cold-chain")) return "EXCURSIONS_LAST_WEEK";
  if (has(n, "carrier") && has(n, "delay", "highest", "contribut", "worst", "late"))
    return "TOP_DELAY_CARRIERS";
  if (has(n, "incomplete", "missing", "broken", "gap") && has(n, "traceab"))
    return "INCOMPLETE_TRACEABILITY";
  if (has(n, "traceab") && has(n, "chain")) return "INCOMPLETE_TRACEABILITY";
  if (
    has(
      n,
      "at risk",
      "at-risk",
      "non-compliance",
      "non compliance",
      "non-compliant",
      "noncompliant",
      "compliance risk",
      "risk of",
    )
  )
    return "AT_RISK_SHIPMENTS";
  if (has(n, "custody")) return "CUSTODY_GAPS";

  // Fuzzy fallback to the closest reference question.
  let best: { intent: AskMeIntent; score: number } = { intent: "FALLBACK", score: 0 };
  for (const ex of ASKME_EXAMPLES) {
    const score = similarity(n, normalize(ex.text));
    if (score > best.score) best = { intent: ex.intent, score };
  }
  return best.score >= 0.34 ? best.intent : "FALLBACK";
}

// -----------------------------------------------------------------------------
// Intent handlers
// -----------------------------------------------------------------------------

function answerAtRisk(question: string): AskMeResult {
  const ships = getAtRiskShipments();
  const rows = ships.map((s) => ({
    Shipment: s.id,
    Product: getProduct(s.productId)?.name ?? s.productId,
    Mode: s.primaryMode,
    Status: s.status.replaceAll("_", " "),
    Reason: !s.traceabilityComplete
      ? "Custody gap"
      : s.hasExcursion
        ? "Temperature excursion"
        : "Open risk event",
  }));
  return {
    intent: "AT_RISK_SHIPMENTS",
    matchedQuestion: question,
    summary: `${ships.length} shipments are currently at risk of DSCSA non-compliance — flagged for custody gaps, temperature excursions or open risk events.`,
    table: {
      columns: [
        { key: "Shipment", label: "Shipment" },
        { key: "Product", label: "Product" },
        { key: "Mode", label: "Mode" },
        { key: "Status", label: "Status" },
        { key: "Reason", label: "Risk reason" },
      ],
      rows,
    },
    links: [{ label: "Open Control Tower", href: "/control-tower" }],
  };
}

function answerTraceSerial(question: string): AskMeResult {
  const serial = extractSerial(question) ?? HERO.serial;
  const trace = resolveTrace(serial, "serial");
  if (!trace) {
    return {
      intent: "TRACE_SERIAL",
      matchedQuestion: question,
      summary: `I couldn't find serial ${serial}. Try ${HERO.serial}, which is fully traceable.`,
      links: [{ label: "Open Traceability", href: "/traceability" }],
    };
  }
  const gaps = trace.custodyGaps.length;
  return {
    intent: "TRACE_SERIAL",
    matchedQuestion: question,
    summary: `Serial ${serial} is ${trace.verified ? "verified" : "unverified"} — ${trace.product?.name} from batch ${trace.batch?.batchNumber}, currently at ${trace.currentLocation?.name ?? "unknown"}. Traceability is ${trace.traceabilityComplete ? "complete" : "incomplete"} with ${gaps} custody gap(s).`,
    table: {
      columns: [
        { key: "field", label: "Field" },
        { key: "value", label: "Value" },
      ],
      rows: [
        { field: "Product", value: trace.product?.name ?? "—" },
        { field: "Batch", value: trace.batch?.batchNumber ?? "—" },
        { field: "Shipment", value: trace.shipment?.id ?? "—" },
        { field: "Current location", value: trace.currentLocation?.name ?? "—" },
        { field: "Custody events", value: trace.custody.length },
        { field: "Ownership transfers", value: trace.ownership.length },
        { field: "Temperature readings", value: trace.temperatures.length },
        { field: "Verified", value: trace.verified ? "Yes" : "No" },
      ],
    },
    links: [
      { label: `Open full trace for ${serial}`, href: `/traceability?type=serial&q=${serial}` },
    ],
  };
}

function answerExcursions(question: string): AskMeResult {
  const ships = getExcursionShipmentsLastWeek();
  const rows = ships.map((s) => ({
    Shipment: s.id,
    Product: getProduct(s.productId)?.name ?? s.productId,
    Mode: s.primaryMode,
    Status: s.status.replaceAll("_", " "),
  }));
  return {
    intent: "EXCURSIONS_LAST_WEEK",
    matchedQuestion: question,
    summary:
      ships.length > 0
        ? `${ships.length} shipment(s) experienced temperature excursions in the last 7 days, including the hero consignment ${HERO.shipmentId}.`
        : "No temperature excursions were detected in the last 7 days.",
    table: {
      columns: [
        { key: "Shipment", label: "Shipment" },
        { key: "Product", label: "Product" },
        { key: "Mode", label: "Mode" },
        { key: "Status", label: "Status" },
      ],
      rows,
    },
    links: [{ label: "Open Cold Chain Intelligence", href: "/cold-chain" }],
  };
}

function answerTopDelayCarriers(question: string): AskMeResult {
  const carriers = [...getCarrierPerformance()]
    .filter((c) => c.totalDelayHours > 0)
    .sort((a, b) => b.totalDelayHours - a.totalDelayHours)
    .slice(0, 6);
  return {
    intent: "TOP_DELAY_CARRIERS",
    matchedQuestion: question,
    summary: `${carriers[0]?.name ?? "No carrier"} contributed the most delay (${carriers[0]?.totalDelayHours ?? 0}h across ${carriers[0]?.shipmentCount ?? 0} shipments). The top contributors are shown below.`,
    chart: {
      kind: "bar",
      unit: "h",
      data: carriers.map((c) => ({ name: c.name.split(" ")[0], value: c.totalDelayHours })),
    },
    table: {
      columns: [
        { key: "Carrier", label: "Carrier" },
        { key: "DelayHours", label: "Total delay (h)" },
        { key: "Delayed", label: "Delayed shipments" },
        { key: "OnTime", label: "On-time %" },
      ],
      rows: carriers.map((c) => ({
        Carrier: c.name,
        DelayHours: c.totalDelayHours,
        Delayed: c.delayedCount,
        OnTime: `${c.onTimePct}%`,
      })),
    },
    links: [{ label: "Open Control Tower", href: "/control-tower" }],
  };
}

function answerCustodyGaps(question: string): AskMeResult {
  const gaps = getCustodyGaps();
  const byCarrier = new Map<string, number>();
  for (const g of gaps) byCarrier.set(g.carrierName, (byCarrier.get(g.carrierName) ?? 0) + 1);
  const topCarrier = [...byCarrier.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    intent: "CUSTODY_GAPS",
    matchedQuestion: question,
    summary: `${gaps.length} custody gap(s) detected across all shipments${topCarrier ? `, with ${topCarrier[0]} accounting for the largest share (${topCarrier[1]})` : ""}.`,
    table: {
      columns: [
        { key: "Shipment", label: "Shipment" },
        { key: "Carrier", label: "Carrier" },
        { key: "Reason", label: "Gap reason" },
        { key: "When", label: "When" },
      ],
      rows: gaps.slice(0, 25).map((g) => ({
        Shipment: g.shipmentId,
        Carrier: g.carrierName,
        Reason: g.reason,
        When: fmtDate(g.timestamp),
      })),
    },
    links: [{ label: "Open Trading Partners", href: "/partners" }],
  };
}

function answerRecallImpact(question: string): AskMeResult {
  const recallId = extractRecallId(question) ?? HERO.recallId;
  const recall = getRecall(recallId);
  if (!recall) {
    return {
      intent: "RECALL_IMPACT",
      matchedQuestion: question,
      summary: `I couldn't find recall ${recallId}.`,
      links: [{ label: "Open Recall Readiness", href: "/recall" }],
    };
  }
  const product = getProduct(getShipment(HERO.shipmentId)?.productId ?? "");
  const partners = recall.impactedPartnerIds.map((id) => getPartner(id)).filter((p) => p);
  return {
    intent: "RECALL_IMPACT",
    matchedQuestion: question,
    summary: `Recall ${recall.id} affects batch ${recall.batchNumber} (${product?.name ?? "product"}): ${recall.impactedPackages.toLocaleString()} packages impacted, ${recall.locatedPackages.toLocaleString()} located, ${recall.outstandingPackages.toLocaleString()} outstanding. ${partners.length} trading partners are involved.`,
    table: {
      columns: [
        { key: "Partner", label: "Impacted partner" },
        { key: "Role", label: "Role" },
        { key: "License", label: "Licence" },
      ],
      rows: partners.map((p) => ({
        Partner: p!.name,
        Role: p!.role.replaceAll("_", " "),
        License: p!.license.replaceAll("_", " "),
      })),
    },
    links: [{ label: "Open Recall Readiness", href: "/recall" }],
  };
}

function answerLateOcean(question: string): AskMeResult {
  const { scores } = getPredictiveBundle();
  const oceanScores = scores
    .filter((s) => getShipment(s.shipmentId)?.primaryMode === "OCEAN")
    .sort((a, b) => b.delayProbability - a.delayProbability)
    .slice(0, 10);
  return {
    intent: "LATE_OCEAN_SHIPMENTS",
    matchedQuestion: question,
    summary: `${oceanScores.filter((s) => s.delayProbability >= 50).length} ocean shipment(s) have a 50%+ predicted probability of arriving late (POC heuristic model).`,
    chart: {
      kind: "bar",
      unit: "%",
      data: oceanScores.slice(0, 6).map((s) => ({ name: s.shipmentId, value: s.delayProbability })),
    },
    table: {
      columns: [
        { key: "Shipment", label: "Shipment" },
        { key: "DelayProb", label: "Delay probability" },
        { key: "Driver", label: "Top driver" },
      ],
      rows: oceanScores.map((s) => ({
        Shipment: s.shipmentId,
        DelayProb: `${s.delayProbability}%`,
        Driver: s.topDrivers[0]?.factor ?? "—",
      })),
    },
    links: [{ label: "Open Predictive Analytics", href: "/predictive" }],
  };
}

function answerUnauthorized(question: string): AskMeResult {
  const interactions = getUnauthorizedInteractions();
  const rows = interactions.map((c) => ({
    Shipment: c.shipmentId,
    From: getPartner(c.fromPartyId)?.name ?? c.fromPartyId,
    To: getPartner(c.toPartyId)?.name ?? c.toPartyId,
    When: fmtDate(c.timestamp),
  }));
  return {
    intent: "UNAUTHORIZED_PARTNER_INTERACTIONS",
    matchedQuestion: question,
    summary: `${interactions.length} custody interaction(s) involve unauthorized trading partners — a potential counterfeit/diversion signal requiring investigation.`,
    table: {
      columns: [
        { key: "Shipment", label: "Shipment" },
        { key: "From", label: "From" },
        { key: "To", label: "To" },
        { key: "When", label: "When" },
      ],
      rows,
    },
    links: [{ label: "Open Trading Partners", href: "/partners" }],
  };
}

function answerIncompleteTraceability(question: string): AskMeResult {
  const ships = getIncompleteTraceabilityShipments();
  const productSet = new Map<string, { product: string; count: number }>();
  for (const s of ships) {
    const name = getProduct(s.productId)?.name ?? s.productId;
    const e = productSet.get(s.productId) ?? { product: name, count: 0 };
    e.count += 1;
    productSet.set(s.productId, e);
  }
  const products = [...productSet.values()].sort((a, b) => b.count - a.count);
  return {
    intent: "INCOMPLETE_TRACEABILITY",
    matchedQuestion: question,
    summary: `${ships.length} shipment(s) across ${products.length} product(s) currently have incomplete traceability chains (missing custody handoffs).`,
    chart: {
      kind: "bar",
      data: products.slice(0, 6).map((p) => ({ name: p.product.split(" ")[0], value: p.count })),
    },
    table: {
      columns: [
        { key: "Product", label: "Product" },
        { key: "Shipments", label: "Affected shipments" },
      ],
      rows: products.map((p) => ({ Product: p.product, Shipments: p.count })),
    },
    links: [{ label: "Open Traceability", href: "/traceability" }],
  };
}

export function answerQuestion(question: string): AskMeResult {
  const intent = classifyIntent(question);
  switch (intent) {
    case "AT_RISK_SHIPMENTS":
      return answerAtRisk(question);
    case "TRACE_SERIAL":
      return answerTraceSerial(question);
    case "EXCURSIONS_LAST_WEEK":
      return answerExcursions(question);
    case "TOP_DELAY_CARRIERS":
      return answerTopDelayCarriers(question);
    case "CUSTODY_GAPS":
      return answerCustodyGaps(question);
    case "RECALL_IMPACT":
      return answerRecallImpact(question);
    case "LATE_OCEAN_SHIPMENTS":
      return answerLateOcean(question);
    case "UNAUTHORIZED_PARTNER_INTERACTIONS":
      return answerUnauthorized(question);
    case "INCOMPLETE_TRACEABILITY":
      return answerIncompleteTraceability(question);
    case "FALLBACK":
    default:
      return {
        intent: "FALLBACK",
        matchedQuestion: question,
        summary: FALLBACK_MESSAGE,
        links: [],
      };
  }
}
