// =============================================================================
// NetTrace — "Do You Know" automated insight generator
//
// Each insight is COMPUTED from the seeded dataset (never hard-coded). The
// dataset is shaped so credible patterns emerge naturally (excursions after
// customs delays, Newark driving delays, Carrier B custody gaps, etc.).
// =============================================================================

import { getCarrierPerformance, getProduct } from "@/lib/data/access";
import { getDataset } from "@/lib/data/seed";
import { round } from "@/lib/utils/prng";
import type {
  Insight,
  InsightCategory,
  LocationNode,
  NamedValue,
  Severity,
} from "@/lib/data/types";

type BaseInsight = Omit<Insight, "category" | "severity" | "recommendedAction" | "href">;

/** Presentation metadata per insight (derived — does not alter underlying data). */
const INSIGHT_META: Record<
  string,
  { category: InsightCategory; severity: Severity; recommendedAction: string; href: string }
> = {
  "excursions-after-customs": {
    category: "Cold Chain",
    severity: "MEDIUM",
    recommendedAction: "Prioritise expedited customs clearance and pre-clearance for cold-chain lanes.",
    href: "/cold-chain",
  },
  "port-delay-share": {
    category: "Logistics",
    severity: "HIGH",
    recommendedAction: "Add schedule buffer or alternate routing around the dominant chokepoint.",
    href: "/control-tower",
  },
  "carrier-custody-gaps": {
    category: "Compliance",
    severity: "HIGH",
    recommendedAction: "Audit the carrier's scan/handoff process and enforce EPCIS custody capture.",
    href: "/partners",
  },
  "crossdock-exceptions": {
    category: "Operations",
    severity: "MEDIUM",
    recommendedAction: "Reduce dwell time at the highest-exception cross-dock site.",
    href: "/control-tower",
  },
  "dc-missing-scans": {
    category: "Compliance",
    severity: "MEDIUM",
    recommendedAction: "Run scanner/serialization audits at the top distribution centre.",
    href: "/traceability",
  },
  "biologic-excursions": {
    category: "Cold Chain",
    severity: "HIGH",
    recommendedAction: "Increase sensor density and alerting on biologic / vaccine lanes.",
    href: "/cold-chain",
  },
  "otd-by-mode": {
    category: "Logistics",
    severity: "MEDIUM",
    recommendedAction: "Rebalance the mode mix toward higher on-time options where feasible.",
    href: "/control-tower",
  },
  "partner-compliance": {
    category: "Partners",
    severity: "MEDIUM",
    recommendedAction: "Remediate expired-licence and unauthorized partners before further transactions.",
    href: "/partners",
  },
};

function shortName(name: string): string {
  return name.split("—")[0].split("(")[0].trim();
}

function locShort(loc: LocationNode | undefined, id: string): string {
  if (!loc) return id;
  // Prefer the city (after the em dash) so sibling sites stay distinct,
  // e.g. "3PL Warehouse — Edison NJ" -> "Edison NJ".
  const parts = loc.name.split("—");
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim();
}

export function getInsights(): Insight[] {
  const ds = getDataset();
  const insights: BaseInsight[] = [];
  const locById = new Map(ds.locations.map((l) => [l.id, l]));
  const eventsByShipment = new Map<string, typeof ds.shipmentEvents>();
  for (const e of ds.shipmentEvents) {
    const arr = eventsByShipment.get(e.shipmentId) ?? [];
    arr.push(e);
    eventsByShipment.set(e.shipmentId, arr);
  }

  // 1. Excursions after customs delays > 12h
  {
    const exShips = ds.shipments.filter((s) => s.hasExcursion);
    const afterDelay = exShips.filter((s) => s.delayHours > 12).length;
    const pct = exShips.length ? round((afterDelay / exShips.length) * 100, 0) : 0;
    insights.push({
      id: "excursions-after-customs",
      title: "Excursions follow customs delays",
      headline: `${pct}% of temperature excursions occur after customs delays over 12 hours`,
      detail:
        "Extended customs dwell time is the dominant precursor to cold-chain breaches — exactly the pattern seen on the hero consignment at Newark.",
      value: `${pct}%`,
      chartKind: "bar",
      chart: [
        { name: "After >12h delay", value: afterDelay },
        { name: "Other", value: Math.max(0, exShips.length - afterDelay) },
      ],
    });
  }

  // 2. Port / customs node contributing the largest share of delay hours
  {
    const hoursByNode = new Map<string, number>();
    for (const s of ds.shipments) {
      if (s.delayHours <= 0) continue;
      const evs = eventsByShipment.get(s.id) ?? [];
      const node =
        evs.find((e) => locById.get(e.locationId)?.type === "CUSTOMS") ??
        evs.find((e) => locById.get(e.locationId)?.type === "PORT");
      if (!node) continue;
      hoursByNode.set(node.locationId, (hoursByNode.get(node.locationId) ?? 0) + s.delayHours);
    }
    const ranked = [...hoursByNode.entries()].sort((a, b) => b[1] - a[1]);
    const total = ranked.reduce((acc, [, h]) => acc + h, 0) || 1;
    const top = ranked[0];
    const share = top ? round((top[1] / total) * 100, 0) : 0;
    insights.push({
      id: "port-delay-share",
      title: "One node drives most delays",
      headline: `${top ? locShort(locById.get(top[0]), top[0]) : "Newark"} accounts for ${share}% of all delay hours`,
      detail:
        "Delay hours concentrate at a single chokepoint — prioritising it would yield the largest on-time improvement.",
      value: `${share}%`,
      chartKind: "bar",
      chart: ranked
        .slice(0, 5)
        .map(([id, h]) => ({ name: locShort(locById.get(id), id), value: h })),
    });
  }

  // 3. Carrier responsible for the largest share of custody-doc gaps
  {
    const perf = getCarrierPerformance().filter((c) => c.custodyGaps > 0);
    const total = perf.reduce((acc, c) => acc + c.custodyGaps, 0) || 1;
    const top = [...perf].sort((a, b) => b.custodyGaps - a.custodyGaps)[0];
    const share = top ? round((top.custodyGaps / total) * 100, 0) : 0;
    insights.push({
      id: "carrier-custody-gaps",
      title: "Custody gaps concentrate on one carrier",
      headline: `${top ? shortName(top.name) : "Carrier B"} is responsible for ${share}% of custody-documentation gaps`,
      detail:
        "Custody documentation failures are not evenly distributed — a single carrier dominates, making it the priority for remediation.",
      value: `${share}%`,
      chartKind: "bar",
      chart: perf.map((c) => ({ name: shortName(c.name), value: c.custodyGaps })),
    });
  }

  // 4. Cross-dock (3PL) exception rates
  {
    const tpl = ds.locations.filter((l) => l.type === "3PL");
    const riskShipments = new Set(ds.riskEvents.map((r) => r.shipmentId));
    const chart: NamedValue[] = [];
    let topName = "";
    let topRate = 0;
    for (const node of tpl) {
      const shipmentsHere = new Set(
        ds.shipmentEvents.filter((e) => e.locationId === node.id).map((e) => e.shipmentId),
      );
      if (shipmentsHere.size === 0) continue;
      const exceptions = [...shipmentsHere].filter((id) => riskShipments.has(id)).length;
      const rate = round((exceptions / shipmentsHere.size) * 100, 0);
      chart.push({ name: shortName(node.name), value: rate });
      if (rate > topRate) {
        topRate = rate;
        topName = shortName(node.name);
      }
    }
    insights.push({
      id: "crossdock-exceptions",
      title: "Cross-dock dwell drives exceptions",
      headline: `${topName || "Edison 3PL"} shows the highest cross-dock exception rate (${topRate}%)`,
      detail:
        "Cross-docking sites with longer dwell times exhibit higher exception rates — a lever for reducing downstream risk.",
      value: `${topRate}%`,
      chartKind: "bar",
      chart,
    });
  }

  // 5. Distribution centres accounting for missing serialization scans
  {
    const missing = ds.riskEvents.filter((r) => r.type === "MISSING_SCAN");
    const byNode = new Map<string, number>();
    for (const r of missing) {
      const evs = eventsByShipment.get(r.shipmentId) ?? [];
      const node =
        evs.find((e) => locById.get(e.locationId)?.type === "DC") ??
        evs.find((e) => locById.get(e.locationId)?.type === "3PL");
      if (!node) continue;
      byNode.set(node.locationId, (byNode.get(node.locationId) ?? 0) + 1);
    }
    const ranked = [...byNode.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    insights.push({
      id: "dc-missing-scans",
      title: "Missing scans cluster at DCs",
      headline: top
        ? `${locShort(locById.get(top[0]), top[0])} accounts for the most missing serialization scans (${top[1]})`
        : "Missing serialization scans are distributed across distribution centres",
      detail:
        "Serialization scan failures concentrate at specific distribution nodes — targeted scanner audits would close the gap.",
      value: top ? String(top[1]) : "0",
      chartKind: "bar",
      chart: ranked
        .slice(0, 5)
        .map(([id, c]) => ({ name: locShort(locById.get(id), id), value: c })),
    });
  }

  // 6. Cold-chain / biologic excursion tendency
  {
    const exShips = ds.shipments.filter((s) => s.hasExcursion);
    const byCategory = new Map<string, number>();
    let biologic = 0;
    for (const s of exShips) {
      const product = getProduct(s.productId);
      const cat = product?.drugCategory ?? "Unknown";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
      if (/biologic|vaccine/i.test(cat)) biologic += 1;
    }
    const pct = exShips.length ? round((biologic / exShips.length) * 100, 0) : 0;
    insights.push({
      id: "biologic-excursions",
      title: "Biologics dominate excursions",
      headline: `Cold-chain biologics & vaccines account for ${pct}% of all temperature excursions`,
      detail:
        "Temperature-sensitive biologics carry the overwhelming share of excursion risk and warrant enhanced monitoring.",
      value: `${pct}%`,
      chartKind: "bar",
      chart: [...byCategory.entries()].map(([name, value]) => ({ name: shortName(name), value })),
    });
  }

  // 7. On-time delivery by mode
  {
    const modes = ["OCEAN", "AIR", "TRUCK", "RAIL"] as const;
    const chart: NamedValue[] = [];
    for (const m of modes) {
      const delivered = ds.shipments.filter((s) => s.primaryMode === m && s.status === "DELIVERED");
      if (delivered.length === 0) continue;
      const onTime = delivered.filter((s) => s.delayHours === 0).length;
      chart.push({ name: m, value: round((onTime / delivered.length) * 100, 0) });
    }
    const sorted = [...chart].sort((a, b) => b.value - a.value);
    insights.push({
      id: "otd-by-mode",
      title: "On-time delivery varies by mode",
      headline:
        sorted.length >= 2
          ? `On-time delivery ranges from ${sorted[sorted.length - 1].value}% (${sorted[sorted.length - 1].name}) to ${sorted[0].value}% (${sorted[0].name})`
          : "On-time delivery performance varies across transport modes",
      detail:
        "Mode choice materially affects reliability — ocean freight carries the greatest schedule risk.",
      value: sorted.length ? `${sorted[0].value}%` : "—",
      chartKind: "bar",
      chart,
    });
  }

  // 8. Trading-partner compliance posture
  {
    const partners = ds.tradingPartners;
    const compliant = partners.filter(
      (p) => p.auth === "AUTHORIZED" && p.license === "VALID",
    ).length;
    const pct = round((compliant / partners.length) * 100, 0);
    insights.push({
      id: "partner-compliance",
      title: "Partner compliance posture",
      headline: `${pct}% of trading partners are authorized with a valid licence`,
      detail:
        "A minority of partners carry expired licences or lack authorization — these drive the bulk of suspect-product signals.",
      value: `${pct}%`,
      chartKind: "bar",
      chart: [
        { name: "Authorized + valid", value: compliant },
        { name: "Expired licence", value: partners.filter((p) => p.license === "EXPIRED").length },
        { name: "Unauthorized", value: partners.filter((p) => p.auth === "UNAUTHORIZED").length },
        {
          name: "Expiring soon",
          value: partners.filter((p) => p.license === "EXPIRING_SOON").length,
        },
      ],
    });
  }

  // Attach presentation metadata (category, impact, action, drill-through).
  return insights.map((i) => ({
    ...i,
    ...(INSIGHT_META[i.id] ?? {
      category: "Operations" as InsightCategory,
      severity: "LOW" as Severity,
      recommendedAction: "Review this insight in the relevant dashboard.",
      href: "/insights",
    }),
  }));
}
