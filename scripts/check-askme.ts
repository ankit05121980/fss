/**
 * Verifies AskMe correctly classifies and answers all nine reference questions
 * (plus a few rephrasings and a fallback). Run: npm run askme:check
 */
import { ASKME_EXAMPLES, answerQuestion, classifyIntent } from "@/lib/engines/askme";
import type { AskMeIntent } from "@/lib/data/types";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures += 1;
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

// The 9 reference questions classify to the expected intents and return content.
for (const ex of ASKME_EXAMPLES) {
  const intent = classifyIntent(ex.text);
  const res = answerQuestion(ex.text);
  const hasContent = !!res.summary && (!!res.table?.rows.length || !!res.chart?.data.length || res.intent === "TRACE_SERIAL");
  check(`Q "${ex.text.slice(0, 48)}…" -> ${ex.intent}`, intent === ex.intent && res.intent === ex.intent, intent);
  check(`  …returns content`, hasContent);
}

// Rephrasings (fuzzy / keyword robustness)
const rephrasings: { q: string; intent: AskMeIntent }[] = [
  { q: "which shipments are non-compliant right now", intent: "AT_RISK_SHIPMENTS" },
  { q: "where is SN0008743", intent: "TRACE_SERIAL" },
  { q: "any cold chain temperature breaches recently?", intent: "EXCURSIONS_LAST_WEEK" },
  { q: "worst carriers for delays", intent: "TOP_DELAY_CARRIERS" },
  { q: "broken custody documentation", intent: "CUSTODY_GAPS" },
  { q: "what does RCL-2026-001 affect", intent: "RECALL_IMPACT" },
  { q: "ocean freight predicted to be late", intent: "LATE_OCEAN_SHIPMENTS" },
  { q: "unauthorised partner transfers", intent: "UNAUTHORIZED_PARTNER_INTERACTIONS" },
  { q: "products with broken traceability chains", intent: "INCOMPLETE_TRACEABILITY" },
];
for (const r of rephrasings) {
  check(`Rephrase "${r.q}" -> ${r.intent}`, classifyIntent(r.q) === r.intent, classifyIntent(r.q));
}

// Fallback
check("Gibberish -> FALLBACK", classifyIntent("what is the weather today") === "FALLBACK");

// Specific reconciliation: recall answer mentions 24,500
const recallRes = answerQuestion("List products impacted by Recall RCL-2026-001");
check("Recall answer cites 24,500 impacted", recallRes.summary.includes("24,500"));

console.log("");
if (failures > 0) {
  console.error(`\u2717 ${failures} AskMe check(s) failed`);
  process.exit(1);
} else {
  console.log("\u2713 All AskMe checks passed");
}
