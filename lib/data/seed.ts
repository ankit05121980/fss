// =============================================================================
// Veritrace — Deterministic dataset generator
//
// The ENTIRE application is driven by the dataset produced here. It is generated
// exactly once (memoized) using a single seeded PRNG so every run — and every
// KPI, AskMe answer, insight and prediction derived from it — is identical.
//
// Nothing in the UI imports this module directly; data flows through
// `lib/data/access.ts` and the `/api` route handlers. This keeps the mock
// swappable for real connectors in one place.
// =============================================================================

import { DAY_MS, DEMO_NOW, HOUR_MS } from "@/lib/utils/date";
import {
  chance,
  gaussian,
  mulberry32,
  pick,
  randFloat,
  randInt,
  round,
  type Rng,
} from "@/lib/utils/prng";
import { HERO } from "@/lib/utils/constants";
import type {
  Batch,
  Carrier,
  CustodyEvent,
  Dataset,
  LocationNode,
  Mode,
  OwnershipEvent,
  Product,
  Recall,
  RiskEvent,
  SerializedUnit,
  Severity,
  Shipment,
  ShipmentEvent,
  ShipmentStatus,
  TemperatureReading,
  TradingPartner,
} from "@/lib/data/types";

const SEED = 0x4c554d45; // "LUME"

function iso(offsetHours: number): string {
  return new Date(DEMO_NOW.getTime() + offsetHours * HOUR_MS).toISOString();
}

function isoFromMs(ms: number): string {
  return new Date(ms).toISOString();
}

// -----------------------------------------------------------------------------
// Static reference data (deterministic by construction)
// -----------------------------------------------------------------------------

const PRODUCTS: Product[] = [
  {
    id: "prod-covid",
    name: HERO.productName,
    drugCategory: "Vaccine (Biologic)",
    storageRequirement: "Cold chain 2–8°C",
    tempMinC: 2,
    tempMaxC: 8,
    gtin: "03000000000017",
  },
  {
    id: "prod-insulin",
    name: "Insulin Glargine Injection",
    drugCategory: "Biologic (Antidiabetic)",
    storageRequirement: "Cold chain 2–8°C",
    tempMinC: 2,
    tempMaxC: 8,
    gtin: "03000000000024",
  },
  {
    id: "prod-mab",
    name: "Monoclonal Antibody Infusion",
    drugCategory: "Biologic (Oncology)",
    storageRequirement: "Cold chain 2–8°C",
    tempMinC: 2,
    tempMaxC: 8,
    gtin: "03000000000031",
  },
  {
    id: "prod-flu",
    name: "Influenza Vaccine",
    drugCategory: "Vaccine",
    storageRequirement: "Cold chain 2–8°C",
    tempMinC: 2,
    tempMaxC: 8,
    gtin: "03000000000048",
  },
  {
    id: "prod-amox",
    name: "Amoxicillin Capsules",
    drugCategory: "Antibiotic",
    storageRequirement: "Ambient 15–25°C",
    tempMinC: 15,
    tempMaxC: 25,
    gtin: "03000000000055",
  },
  {
    id: "prod-atorva",
    name: "Atorvastatin Tablets",
    drugCategory: "Cardiovascular",
    storageRequirement: "Ambient 15–30°C",
    tempMinC: 15,
    tempMaxC: 30,
    gtin: "03000000000062",
  },
  {
    id: "prod-metformin",
    name: "Metformin Tablets",
    drugCategory: "Antidiabetic",
    storageRequirement: "Ambient 15–30°C",
    tempMinC: 15,
    tempMaxC: 30,
    gtin: "03000000000079",
  },
  {
    id: "prod-ibuprofen",
    name: "Ibuprofen Tablets",
    drugCategory: "Analgesic",
    storageRequirement: "Ambient 15–25°C",
    tempMinC: 15,
    tempMaxC: 25,
    gtin: "03000000000086",
  },
  {
    id: "prod-omeprazole",
    name: "Omeprazole Capsules",
    drugCategory: "Gastrointestinal",
    storageRequirement: "Ambient 15–25°C",
    tempMinC: 15,
    tempMaxC: 25,
    gtin: "03000000000093",
  },
  {
    id: "prod-salbutamol",
    name: "Salbutamol Inhaler",
    drugCategory: "Respiratory",
    storageRequirement: "Controlled room 15–25°C",
    tempMinC: 15,
    tempMaxC: 25,
    gtin: "03000000000109",
  },
];

const COLD_CHAIN_PRODUCT_IDS = new Set(PRODUCTS.filter((p) => p.tempMaxC <= 8).map((p) => p.id));

// Hero journey nodes (real lat/lng) + extra nodes for other shipments.
const LOCATIONS: LocationNode[] = [
  {
    id: "loc-mfg-de",
    name: "BioNTech Manufacturing — Marburg",
    type: "MANUFACTURER",
    lat: 50.8093,
    lng: 8.7708,
    country: "Germany",
  },
  {
    id: "loc-whse-de",
    name: "Frankfurt Manufacturing Warehouse",
    type: "WAREHOUSE",
    lat: 50.1109,
    lng: 8.6821,
    country: "Germany",
  },
  {
    id: "loc-port-hamburg",
    name: "Port of Hamburg",
    type: "PORT",
    lat: 53.5413,
    lng: 9.9326,
    country: "Germany",
  },
  {
    id: "loc-port-newark",
    name: "Port of Newark",
    type: "PORT",
    lat: 40.6895,
    lng: -74.1745,
    country: "United States",
  },
  {
    id: "loc-customs-newark",
    name: "Customs Clearance — Newark",
    type: "CUSTOMS",
    lat: 40.709,
    lng: -74.1726,
    country: "United States",
  },
  {
    id: "loc-3pl-nj",
    name: "3PL Warehouse — Edison NJ",
    type: "3PL",
    lat: 40.5187,
    lng: -74.4121,
    country: "United States",
  },
  {
    id: "loc-dc-nj",
    name: "Regional Distribution Center — Secaucus NJ",
    type: "DC",
    lat: 40.7895,
    lng: -74.0565,
    country: "United States",
  },
  {
    id: "loc-hospital-ny",
    name: "Mount Sinai Hospital Network — New York",
    type: "HOSPITAL",
    lat: 40.7903,
    lng: -73.9527,
    country: "United States",
  },
  // Extra nodes
  {
    id: "loc-port-shanghai",
    name: "Port of Shanghai",
    type: "PORT",
    lat: 31.2304,
    lng: 121.4737,
    country: "China",
  },
  {
    id: "loc-port-rotterdam",
    name: "Port of Rotterdam",
    type: "PORT",
    lat: 51.9496,
    lng: 4.1453,
    country: "Netherlands",
  },
  {
    id: "loc-port-la",
    name: "Port of Los Angeles",
    type: "PORT",
    lat: 33.7395,
    lng: -118.2597,
    country: "United States",
  },
  {
    id: "loc-air-fra",
    name: "Frankfurt Air Cargo Hub",
    type: "PORT",
    lat: 50.0379,
    lng: 8.5622,
    country: "Germany",
  },
  {
    id: "loc-air-jfk",
    name: "JFK Air Cargo Hub",
    type: "PORT",
    lat: 40.6413,
    lng: -73.7781,
    country: "United States",
  },
  {
    id: "loc-air-lhr",
    name: "Heathrow Air Cargo Hub",
    type: "PORT",
    lat: 51.47,
    lng: -0.4543,
    country: "United Kingdom",
  },
  {
    id: "loc-dc-chicago",
    name: "Midwest Distribution Center — Chicago",
    type: "DC",
    lat: 41.8781,
    lng: -87.6298,
    country: "United States",
  },
  {
    id: "loc-3pl-dallas",
    name: "3PL Warehouse — Dallas TX",
    type: "3PL",
    lat: 32.7767,
    lng: -96.797,
    country: "United States",
  },
  {
    id: "loc-hospital-atl",
    name: "Emory Hospital Network — Atlanta",
    type: "HOSPITAL",
    lat: 33.749,
    lng: -84.388,
    country: "United States",
  },
  {
    id: "loc-mfg-in",
    name: "Generic Pharma Manufacturing — Mumbai",
    type: "MANUFACTURER",
    lat: 19.076,
    lng: 72.8777,
    country: "India",
  },
];

const HERO_ROUTE = [
  "loc-mfg-de",
  "loc-whse-de",
  "loc-port-hamburg",
  "loc-port-newark",
  "loc-customs-newark",
  "loc-3pl-nj",
  "loc-dc-nj",
  "loc-hospital-ny",
];

const CARRIERS: Carrier[] = [
  {
    id: "car-a",
    name: "Atlantic Ocean Lines",
    modes: ["OCEAN"],
    onTimePct: 0,
    performanceScore: 0,
  },
  {
    id: "car-b",
    name: "Carrier B Freight",
    modes: ["OCEAN", "TRUCK"],
    onTimePct: 0,
    performanceScore: 0,
  },
  { id: "car-c", name: "SkyCargo Air", modes: ["AIR"], onTimePct: 0, performanceScore: 0 },
  {
    id: "car-d",
    name: "TransContinental Trucking",
    modes: ["TRUCK"],
    onTimePct: 0,
    performanceScore: 0,
  },
  { id: "car-e", name: "Pacific Maritime", modes: ["OCEAN"], onTimePct: 0, performanceScore: 0 },
  {
    id: "car-f",
    name: "EuroRail Logistics",
    modes: ["RAIL", "TRUCK"],
    onTimePct: 0,
    performanceScore: 0,
  },
  {
    id: "car-g",
    name: "ABC Logistics",
    modes: ["TRUCK", "AIR"],
    onTimePct: 0,
    performanceScore: 0,
  },
  { id: "car-h", name: "Global Air Freight", modes: ["AIR"], onTimePct: 0, performanceScore: 0 },
];

// Carrier -> trading-partner id (for custody chains).
const CARRIER_PARTNER: Record<string, string> = {
  "car-a": "tp-atlantic",
  "car-b": "tp-carrierb",
  "car-c": "tp-skycargo",
  "car-d": "tp-transcon",
  "car-e": "tp-pacific",
  "car-f": "tp-transcon",
  "car-g": "tp-abc",
  "car-h": "tp-globalair",
};

interface PartnerSeed {
  id: string;
  name: string;
  role: TradingPartner["role"];
  auth: TradingPartner["auth"];
  license: TradingPartner["license"];
  riskScore: number;
}

const PARTNER_SEEDS: PartnerSeed[] = [
  {
    id: "tp-biontech",
    name: "BioNTech Marburg GmbH",
    role: "MANUFACTURER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 12,
  },
  {
    id: "tp-atlantic",
    name: "Atlantic Ocean Lines",
    role: "CARRIER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 25,
  },
  {
    id: "tp-carrierb",
    name: "Carrier B Freight",
    role: "CARRIER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 58,
  },
  {
    id: "tp-skycargo",
    name: "SkyCargo Air",
    role: "CARRIER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 22,
  },
  {
    id: "tp-transcon",
    name: "TransContinental Trucking",
    role: "CARRIER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 30,
  },
  {
    id: "tp-pacific",
    name: "Pacific Maritime",
    role: "CARRIER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 28,
  },
  {
    id: "tp-abc",
    name: "ABC Logistics",
    role: "CARRIER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 70,
  },
  {
    id: "tp-globalair",
    name: "Global Air Freight",
    role: "CARRIER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 24,
  },
  {
    id: "tp-ff-hanseatic",
    name: "Hanseatic Freight Forwarding",
    role: "FREIGHT_FORWARDER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 18,
  },
  {
    id: "tp-cb-newark",
    name: "Newark Customs Brokers LLC",
    role: "CUSTOMS_BROKER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 21,
  },
  {
    id: "tp-3pl-edison",
    name: "Edison 3PL Solutions",
    role: "3PL",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 19,
  },
  {
    id: "tp-dist-northeast",
    name: "Northeast Pharma Distribution",
    role: "DISTRIBUTOR",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 23,
  },
  {
    id: "tp-disp-nyhealth",
    name: "Mount Sinai Health Pharmacy",
    role: "DISPENSER",
    auth: "AUTHORIZED",
    license: "VALID",
    riskScore: 15,
  },
  {
    id: "tp-3pl-quickship",
    name: "QuickShip 3PL",
    role: "3PL",
    auth: "AUTHORIZED",
    license: "EXPIRED",
    riskScore: 64,
  },
  {
    id: "tp-dist-valuemeds",
    name: "ValueMeds Distribution",
    role: "DISTRIBUTOR",
    auth: "AUTHORIZED",
    license: "EXPIRED",
    riskScore: 60,
  },
  {
    id: "tp-ff-globallink",
    name: "GlobalLink Forwarders",
    role: "FREIGHT_FORWARDER",
    auth: "AUTHORIZED",
    license: "EXPIRED",
    riskScore: 55,
  },
  {
    id: "tp-greymarket",
    name: "GreyMarket Distributors Inc",
    role: "DISTRIBUTOR",
    auth: "UNAUTHORIZED",
    license: "VALID",
    riskScore: 88,
  },
  {
    id: "tp-divertedco",
    name: "Diverted Goods Co",
    role: "3PL",
    auth: "UNAUTHORIZED",
    license: "EXPIRING_SOON",
    riskScore: 82,
  },
];

// -----------------------------------------------------------------------------
// Generation
// -----------------------------------------------------------------------------

function buildPartners(rng: Rng): TradingPartner[] {
  return PARTNER_SEEDS.map((s) => {
    let licenseExpiry: string;
    if (s.license === "EXPIRED") licenseExpiry = iso(-randInt(rng, 30, 220) * 24);
    else if (s.license === "EXPIRING_SOON") licenseExpiry = iso(randInt(rng, 8, 40) * 24);
    else licenseExpiry = iso(randInt(rng, 180, 640) * 24);
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      auth: s.auth,
      license: s.license,
      licenseExpiry,
      gln: `0860${String(PARTNER_SEEDS.indexOf(s) + 1).padStart(9, "0")}`,
      riskScore: s.riskScore,
    };
  });
}

function buildBatches(rng: Rng): Batch[] {
  const batches: Batch[] = [];
  // Hero batch
  batches.push({
    batchNumber: HERO.batchNumber,
    productId: "prod-covid",
    manufacturingDate: iso(-60 * 24),
    expirationDate: iso(305 * 24),
    manufacturerName: "BioNTech Marburg GmbH",
    manufacturerCountry: "Germany",
    unitCount: 24500,
  });

  const manufacturers = [
    { name: "BioNTech Marburg GmbH", country: "Germany" },
    { name: "Generic Pharma Mumbai Ltd", country: "India" },
    { name: "EuroPharma Manufacturing", country: "Netherlands" },
    { name: "Pacific Biologics Co", country: "China" },
    { name: "Atlantic Pharmaceuticals", country: "United States" },
  ];

  for (let i = 2; i <= 20; i += 1) {
    const product = PRODUCTS[randInt(rng, 1, PRODUCTS.length - 1)];
    const mfg = pick(rng, manufacturers);
    const ageDays = randInt(rng, 20, 160);
    const shelfDays = randInt(rng, 240, 730);
    batches.push({
      batchNumber: `BN-2026-${String(i).padStart(3, "0")}`,
      productId: product.id,
      manufacturingDate: iso(-ageDays * 24),
      expirationDate: iso((shelfDays - ageDays) * 24),
      manufacturerName: mfg.name,
      manufacturerCountry: mfg.country,
      unitCount: randInt(rng, 4, 40) * 1000,
    });
  }
  return batches;
}

interface ShipmentBuild {
  shipments: Shipment[];
  events: ShipmentEvent[];
  custody: CustodyEvent[];
  ownership: OwnershipEvent[];
  temperatures: TemperatureReading[];
  riskEvents: RiskEvent[];
}

function routeForMode(rng: Rng, mode: Mode): string[] {
  switch (mode) {
    case "OCEAN": {
      const origin = pick(rng, ["loc-port-shanghai", "loc-port-rotterdam", "loc-port-hamburg"]);
      const usPort = pick(rng, ["loc-port-newark", "loc-port-la"]);
      const dc = pick(rng, ["loc-dc-nj", "loc-dc-chicago"]);
      const hospital = pick(rng, ["loc-hospital-ny", "loc-hospital-atl"]);
      return [
        origin,
        usPort,
        "loc-customs-newark",
        pick(rng, ["loc-3pl-nj", "loc-3pl-dallas"]),
        dc,
        hospital,
      ];
    }
    case "AIR": {
      const origin = pick(rng, ["loc-air-fra", "loc-air-lhr"]);
      const dc = pick(rng, ["loc-dc-nj", "loc-dc-chicago"]);
      const hospital = pick(rng, ["loc-hospital-ny", "loc-hospital-atl"]);
      return [origin, "loc-air-jfk", "loc-customs-newark", dc, hospital];
    }
    case "RAIL": {
      const origin = pick(rng, ["loc-port-la", "loc-port-newark"]);
      return [origin, "loc-dc-chicago", pick(rng, ["loc-hospital-atl", "loc-hospital-ny"])];
    }
    case "TRUCK":
    default: {
      const origin = pick(rng, ["loc-3pl-dallas", "loc-3pl-nj", "loc-dc-chicago"]);
      const dc = pick(rng, ["loc-dc-nj", "loc-dc-chicago"]);
      const hospital = pick(rng, ["loc-hospital-ny", "loc-hospital-atl"]);
      return [origin, dc, hospital];
    }
  }
}

function legMode(primary: Mode, legIndex: number, totalLegs: number): Mode {
  // First/last legs of ocean & air journeys are trucking; middle is the primary mode.
  if (primary === "OCEAN" || primary === "AIR") {
    if (legIndex === 0) return primary;
    if (legIndex >= totalLegs - 2) return "TRUCK";
    return primary;
  }
  return primary;
}

function severityFor(rng: Rng, bias: number): Severity {
  const r = rng() + bias;
  if (r > 1.05) return "HIGH";
  if (r > 0.6) return "MEDIUM";
  return "LOW";
}

function buildShipments(rng: Rng, batches: Batch[], partners: TradingPartner[]): ShipmentBuild {
  const shipments: Shipment[] = [];
  const events: ShipmentEvent[] = [];
  const custody: CustodyEvent[] = [];
  const ownership: OwnershipEvent[] = [];
  const temperatures: TemperatureReading[] = [];
  const riskEvents: RiskEvent[] = [];

  const partnerIds = partners.map((p) => p.id);
  const authorizedByRole = (role: TradingPartner["role"]) =>
    partners.filter((p) => p.role === role && p.auth === "AUTHORIZED");

  let eventSeq = 0;
  let custodySeq = 0;
  let ownerSeq = 0;
  let tempSeq = 0;
  let riskSeq = 0;
  let unauthorizedTransferPlaced = false;

  // SHP-007 (predicted excursion) must carry a cold-chain product so the
  // excursion-risk prediction is meaningful.
  const coldBatch =
    batches.find(
      (b) => b.batchNumber !== HERO.batchNumber && COLD_CHAIN_PRODUCT_IDS.has(b.productId),
    ) ?? batches[1];

  // Pre-assign modes: SHP-001 ocean (hero), SHP-007 ocean (predicted excursion).
  // 12 ocean total, 2 rail, remainder air/truck.
  const modes: Mode[] = [];
  const oceanCount = 12;
  const railCount = 2;
  for (let i = 0; i < 50; i += 1) {
    if (i === 0 || i === 6) modes.push("OCEAN"); // SHP-001, SHP-007
  }
  // fill remaining ocean
  let oceansAssigned = 2;
  let railAssigned = 0;
  const order: Mode[] = new Array(50).fill("TRUCK");
  order[0] = "OCEAN";
  order[6] = "OCEAN";
  for (let i = 1; i < 50; i += 1) {
    if (i === 6) continue;
    if (oceansAssigned < oceanCount && i % 4 === 1) {
      order[i] = "OCEAN";
      oceansAssigned += 1;
    } else if (railAssigned < railCount && i % 17 === 0) {
      order[i] = "RAIL";
      railAssigned += 1;
    } else {
      order[i] = i % 2 === 0 ? "AIR" : "TRUCK";
    }
  }
  // ensure ocean count met
  for (let i = 1; i < 50 && oceansAssigned < oceanCount; i += 1) {
    if (order[i] === "AIR" || order[i] === "TRUCK") {
      order[i] = "OCEAN";
      oceansAssigned += 1;
    }
  }
  for (let i = 1; i < 50 && railAssigned < railCount; i += 1) {
    if (order[i] === "TRUCK") {
      order[i] = "RAIL";
      railAssigned += 1;
    }
  }

  for (let i = 0; i < 50; i += 1) {
    const id = `SHP-${String(i + 1).padStart(3, "0")}`;
    const isHero = i === 0;
    const isPredExcursion = i === 6;
    const primaryMode: Mode = order[i];

    // Batch / product
    const batch = isHero ? batches[0] : isPredExcursion ? coldBatch : pick(rng, batches.slice(1));
    const productId = batch.productId;
    const isCold = COLD_CHAIN_PRODUCT_IDS.has(productId);

    // Carrier compatible with mode
    const carrier = isHero
      ? CARRIERS[0]
      : pick(
          rng,
          CARRIERS.filter((c) => c.modes.includes(primaryMode)),
        );

    // Route
    const route = isHero ? [...HERO_ROUTE] : routeForMode(rng, primaryMode);
    const originId = route[0];
    const destinationId = route[route.length - 1];

    // Timing
    const transitDays = isHero
      ? 13
      : primaryMode === "OCEAN"
        ? randInt(rng, 16, 30)
        : primaryMode === "AIR"
          ? randInt(rng, 2, 5)
          : primaryMode === "RAIL"
            ? randInt(rng, 4, 8)
            : randInt(rng, 1, 4);

    // Decide status + delay
    let status: ShipmentStatus;
    let delayHours = 0;
    let departedAt: string;
    let etaAt: string;
    let deliveredAt: string | undefined;

    if (isHero) {
      status = "IN_TRANSIT";
      delayHours = 18;
      departedAt = iso(-12 * 24);
      etaAt = iso(1 * 24);
    } else if (isPredExcursion) {
      status = "CUSTOMS_HOLD";
      delayHours = randInt(rng, 6, 14);
      departedAt = iso(-randInt(rng, 14, 22) * 24);
      etaAt = iso(randInt(rng, 2, 6) * 24);
    } else {
      const roll = rng();
      const departedHoursAgo = randInt(rng, 2, transitDays + 6) * 24;
      departedAt = iso(-departedHoursAgo);
      if (roll < 0.34) {
        status = "DELIVERED";
        delayHours = chance(rng, 0.4) ? randInt(rng, 2, 30) : 0;
        deliveredAt = iso(-randInt(rng, 1, 20) * 24);
        etaAt = isoFromMs(new Date(deliveredAt).getTime() - delayHours * HOUR_MS);
      } else if (roll < 0.6) {
        status = "IN_TRANSIT";
        etaAt = iso(randInt(rng, 1, 12) * 24);
      } else if (roll < 0.82) {
        status = "DELAYED";
        delayHours = randInt(rng, 8, 60);
        etaAt = iso(randInt(rng, 1, 10) * 24);
      } else {
        status = "CUSTOMS_HOLD";
        delayHours = randInt(rng, 10, 40);
        etaAt = iso(randInt(rng, 1, 8) * 24);
      }
    }

    const departMs = new Date(departedAt).getTime();
    const endMs = deliveredAt
      ? new Date(deliveredAt).getTime()
      : Math.min(DEMO_NOW.getTime(), new Date(etaAt).getTime());
    const span = Math.max(endMs - departMs, HOUR_MS * 6);

    // Per-node timestamps along the route. The hero uses an explicit, monotonic
    // timeline encoding realistic leg durations + the ~18h customs hold so the
    // end-to-end journey reads naturally; other shipments spread evenly across
    // their transit window.
    const totalLegs = route.length;
    const nodeTimes: number[] = [];
    if (isHero) {
      // mfg, warehouse, Hamburg, (ocean) Newark port, customs hold, 3PL, DC, hospital(ETA)
      const heroOffsetDays = [-12, -11, -10, -3.5, -3, -1.8, -0.8, 1];
      for (let r = 0; r < route.length; r += 1) {
        nodeTimes.push(DEMO_NOW.getTime() + (heroOffsetDays[r] ?? r - 12) * DAY_MS);
      }
    } else {
      for (let r = 0; r < route.length; r += 1) {
        const frac = route.length === 1 ? 0 : r / (route.length - 1);
        nodeTimes.push(departMs + frac * span);
      }
    }

    const eventIds: string[] = [];
    const legTimes: { locationId: string; ms: number }[] = [];
    for (let r = 0; r < route.length; r += 1) {
      const ts = nodeTimes[r];
      const node = LOCATIONS.find((l) => l.id === route[r])!;
      const mode = legMode(primaryMode, r, totalLegs);
      legTimes.push({ locationId: node.id, ms: ts });

      let eventType = "ARRIVAL";
      let note: string | undefined;
      if (r === 0) eventType = "DEPARTURE";
      else if (node.type === "PORT") eventType = "PORT_ARRIVAL";
      else if (node.type === "CUSTOMS") eventType = "CUSTOMS_ENTRY";
      else if (node.type === "3PL") eventType = "CROSS_DOCK";
      else if (node.type === "DC") eventType = "DC_RECEIPT";
      else if (node.type === "HOSPITAL")
        eventType = status === "DELIVERED" ? "DELIVERED" : "SCHEDULED_DELIVERY";

      // Hero customs delay annotation
      if (isHero && node.type === "CUSTOMS") {
        note = `Held ${delayHours}h in customs clearance — documentation & inspection delay`;
      }

      const evId = `evt-${String(++eventSeq).padStart(4, "0")}`;
      events.push({
        id: evId,
        shipmentId: id,
        locationId: node.id,
        eventType,
        mode,
        timestamp: isoFromMs(ts),
        note,
      });
      eventIds.push(evId);
    }

    // Custody chain (ordered). Manufacturer -> FF -> carrier -> customs broker -> 3PL -> distributor -> dispenser
    const chainRoles: TradingPartner["role"][] = [
      "MANUFACTURER",
      "FREIGHT_FORWARDER",
      "CARRIER",
      "CUSTOMS_BROKER",
      "3PL",
      "DISTRIBUTOR",
      "DISPENSER",
    ];
    const chainPartyIds: string[] = [];
    for (const role of chainRoles) {
      if (role === "CARRIER") {
        chainPartyIds.push(CARRIER_PARTNER[carrier.id]);
      } else {
        const opts = authorizedByRole(role);
        chainPartyIds.push(opts.length > 0 ? pick(rng, opts).id : partnerIds[0]);
      }
    }

    let traceabilityComplete = true;
    const custodyGapProne = carrier.id === "car-b"; // Carrier B concentration
    for (let c = 0; c < chainPartyIds.length - 1; c += 1) {
      const tsFrac = (c + 1) / chainPartyIds.length;
      const ts = departMs + tsFrac * span;
      // Seed a custody gap (invalid handoff) primarily on Carrier B shipments.
      const gap = custodyGapProne ? chance(rng, 0.18) : chance(rng, 0.015);
      if (gap) traceabilityComplete = false;
      custody.push({
        id: `cus-${String(++custodySeq).padStart(4, "0")}`,
        shipmentId: id,
        fromPartyId: chainPartyIds[c],
        toPartyId: chainPartyIds[c + 1],
        timestamp: isoFromMs(ts),
        valid: !gap,
      });
    }

    // Seed exactly one UNAUTHORIZED transfer across the whole dataset.
    if (!unauthorizedTransferPlaced && !isHero && i === 11) {
      const ts = departMs + 0.5 * span;
      custody.push({
        id: `cus-${String(++custodySeq).padStart(4, "0")}`,
        shipmentId: id,
        fromPartyId: chainPartyIds[2],
        toPartyId: "tp-greymarket",
        timestamp: isoFromMs(ts),
        valid: false,
      });
      traceabilityComplete = false;
      riskEvents.push({
        id: `rsk-${String(++riskSeq).padStart(4, "0")}`,
        shipmentId: id,
        type: "UNAUTHORIZED_TRANSFER",
        severity: "HIGH",
        timestamp: isoFromMs(ts),
        description: `Custody transferred to unauthorized trading partner (GreyMarket Distributors Inc) on ${id}`,
        resolved: false,
      });
      unauthorizedTransferPlaced = true;
    }

    // Ownership chain: manufacturer -> distributor -> dispenser
    const owners = [
      "tp-biontech",
      pick(rng, authorizedByRole("DISTRIBUTOR")).id,
      pick(rng, authorizedByRole("DISPENSER")).id,
    ];
    for (let o = 0; o < owners.length - 1; o += 1) {
      ownership.push({
        id: `own-${String(++ownerSeq).padStart(4, "0")}`,
        shipmentId: id,
        previousOwnerId: owners[o],
        newOwnerId: owners[o + 1],
        timestamp: isoFromMs(departMs + ((o + 1) / owners.length) * span),
      });
    }

    // Excursion decision
    let hasExcursion = false;
    if (isCold) {
      hasExcursion = isHero ? true : chance(rng, 0.22);
    }

    // Temperature readings for cold-chain shipments
    if (isCold) {
      const product = PRODUCTS.find((p) => p.id === productId)!;
      const stepHours = 3;
      const customsEvent = events.find(
        (e) => e.shipmentId === id && e.eventType === "CUSTOMS_ENTRY",
      );
      const customsMs = customsEvent ? new Date(customsEvent.timestamp).getTime() : null;
      for (let t = departMs; t <= endMs; t += stepHours * HOUR_MS) {
        let temp = gaussian(rng, 5, 0.8, 2.2, 7.6);
        let excursion = false;
        const sensorOk = chance(rng, 0.985);
        // Location: the node that is active at time t (last leg reached).
        let locationId = legTimes[0]?.locationId ?? route[0];
        for (const lt of legTimes) {
          if (lt.ms <= t) locationId = lt.locationId;
          else break;
        }
        // Hero excursion: spike toward 10C in the ~18h window following the
        // customs delay, anchored at the Newark customs node (root cause).
        if (isHero && customsMs && t >= customsMs && t <= customsMs + 18 * HOUR_MS) {
          temp = round(randFloat(rng, 9.4, 10.3), 1);
          excursion = true;
          locationId = "loc-customs-newark";
        } else if (
          hasExcursion &&
          !isHero &&
          customsMs &&
          t >= customsMs &&
          t <= customsMs + 10 * HOUR_MS &&
          chance(rng, 0.7)
        ) {
          temp = round(randFloat(rng, 8.4, 11), 1);
          excursion = true;
          locationId = "loc-customs-newark";
        }
        if (sensorOk && (temp > product.tempMaxC || temp < product.tempMinC)) excursion = true;
        if (!sensorOk) excursion = false;
        temperatures.push({
          id: `tmp-${String(++tempSeq).padStart(5, "0")}`,
          shipmentId: id,
          timestamp: isoFromMs(t),
          temperatureC: round(temp, 1),
          humidityPct: round(gaussian(rng, 45, 6, 25, 70), 0),
          sensorOk,
          locationId,
          excursion,
        });
      }
    }

    // Risk events derived from conditions
    if (isHero) {
      const customsMs2 = DEMO_NOW.getTime() - 3 * DAY_MS;
      riskEvents.push({
        id: `rsk-${String(++riskSeq).padStart(4, "0")}`,
        shipmentId: id,
        type: "DELAY",
        severity: "HIGH",
        timestamp: isoFromMs(customsMs2),
        description: `18h customs clearance delay at Port of Newark on ${id}`,
        resolved: false,
      });
      riskEvents.push({
        id: `rsk-${String(++riskSeq).padStart(4, "0")}`,
        shipmentId: id,
        type: "TEMPERATURE_EXCURSION",
        severity: "HIGH",
        timestamp: isoFromMs(customsMs2 + 4 * HOUR_MS),
        description: `Temperature reached 10°C (limit 8°C) following the customs delay on ${id}`,
        resolved: false,
      });
    } else {
      if (status === "DELAYED" || status === "CUSTOMS_HOLD") {
        riskEvents.push({
          id: `rsk-${String(++riskSeq).padStart(4, "0")}`,
          shipmentId: id,
          type: "DELAY",
          severity: severityFor(rng, delayHours > 30 ? 0.4 : 0),
          timestamp: iso(-randInt(rng, 6, 72)),
          description: `${status === "CUSTOMS_HOLD" ? "Customs hold" : "Transit delay"} of ${delayHours}h on ${id}`,
          resolved: chance(rng, 0.2),
        });
      }
      if (hasExcursion) {
        riskEvents.push({
          id: `rsk-${String(++riskSeq).padStart(4, "0")}`,
          shipmentId: id,
          type: "TEMPERATURE_EXCURSION",
          severity: severityFor(rng, 0.3),
          timestamp: iso(-randInt(rng, 12, 120)),
          description: `Cold-chain temperature excursion detected on ${id}`,
          resolved: chance(rng, 0.3),
        });
      }
      if (!traceabilityComplete && chance(rng, 0.7)) {
        riskEvents.push({
          id: `rsk-${String(++riskSeq).padStart(4, "0")}`,
          shipmentId: id,
          type: "MISSING_SCAN",
          severity: severityFor(rng, 0),
          timestamp: iso(-randInt(rng, 6, 96)),
          description: `Custody documentation gap / missing scan on ${id} (carrier ${carrier.name})`,
          resolved: chance(rng, 0.25),
        });
      }
      if (chance(rng, 0.12)) {
        riskEvents.push({
          id: `rsk-${String(++riskSeq).padStart(4, "0")}`,
          shipmentId: id,
          type: "ROUTE_DEVIATION",
          severity: severityFor(rng, 0),
          timestamp: iso(-randInt(rng, 6, 96)),
          description: `Unexpected route deviation detected on ${id}`,
          resolved: chance(rng, 0.4),
        });
      }
    }

    shipments.push({
      id,
      batchNumber: batch.batchNumber,
      productId,
      primaryMode,
      status,
      originId,
      destinationId,
      carrierId: carrier.id,
      departedAt,
      etaAt,
      deliveredAt,
      delayHours,
      packageCount: isHero ? 1960 : randInt(rng, 40, 2400),
      events: eventIds,
      hasExcursion,
      traceabilityComplete,
    });
  }

  return { shipments, events, custody, ownership, temperatures, riskEvents };
}

function buildSerializedUnits(rng: Rng, shipments: Shipment[]): SerializedUnit[] {
  const units: SerializedUnit[] = [];
  const hero = PRODUCTS[0];

  // ~300 hero-batch serials. SN0008743 MUST exist and be fully traceable.
  const base = 8700;
  for (let i = 0; i < 300; i += 1) {
    const serial = `SN${String(base + i).padStart(7, "0")}`;
    const isTarget = serial === HERO.serial;
    units.push({
      serialNumber: serial,
      gtin: hero.gtin,
      lotNumber: `LOT-${HERO.batchNumber}`,
      batchNumber: HERO.batchNumber,
      expiry: iso(305 * 24),
      currentLocationId: isTarget
        ? "loc-3pl-nj"
        : pick(rng, ["loc-customs-newark", "loc-3pl-nj", "loc-dc-nj", "loc-port-newark"]),
      verified: isTarget ? true : chance(rng, 0.92),
    });
  }

  // Samples for a handful of other batches (tie to their shipments' current node).
  const otherShipments = shipments.filter((s) => s.batchNumber !== HERO.batchNumber).slice(0, 6);
  let counter = 9100;
  for (const ship of otherShipments) {
    const product = PRODUCTS.find((p) => p.id === ship.productId)!;
    for (let k = 0; k < 20; k += 1) {
      const serial = `SN${String(counter++).padStart(7, "0")}`;
      units.push({
        serialNumber: serial,
        gtin: product.gtin,
        lotNumber: `LOT-${ship.batchNumber}`,
        batchNumber: ship.batchNumber,
        expiry: iso(randInt(rng, 200, 500) * 24),
        currentLocationId: ship.destinationId,
        verified: chance(rng, 0.9),
      });
    }
  }
  return units;
}

function reconcileCarriers(carriers: Carrier[], shipments: Shipment[]): void {
  for (const carrier of carriers) {
    const own = shipments.filter((s) => s.carrierId === carrier.id);
    const delivered = own.filter((s) => s.status === "DELIVERED");
    const delayed = own.filter(
      (s) => s.status === "DELAYED" || s.status === "CUSTOMS_HOLD" || s.delayHours > 0,
    );
    const onTimeDelivered = delivered.filter((s) => s.delayHours === 0).length;
    const denom = delivered.length || own.length || 1;
    const onTimePct = round((onTimeDelivered / denom) * 100, 0);
    const delayShare = own.length ? delayed.length / own.length : 0;
    const avgDelay = own.length ? own.reduce((a, s) => a + s.delayHours, 0) / own.length : 0;
    const performanceScore = round(
      Math.max(35, Math.min(99, 92 - delayShare * 45 - Math.min(avgDelay, 40) * 0.4)),
      0,
    );
    carrier.onTimePct = own.length ? onTimePct : 90;
    carrier.performanceScore = own.length ? performanceScore : 88;
  }
}

function buildRecalls(): Recall[] {
  return [
    {
      id: HERO.recallId,
      batchNumber: HERO.batchNumber,
      reason:
        "Potential potency loss following a confirmed cold-chain temperature excursion (10°C vs 2–8°C limit) during US customs clearance.",
      openedAt: iso(-2 * 24),
      impactedPackages: 24500,
      locatedPackages: 24120,
      outstandingPackages: 380,
      status: "OPEN",
      impactedPartnerIds: ["tp-3pl-edison", "tp-dist-northeast", "tp-disp-nyhealth", "tp-carrierb"],
    },
    {
      id: "RCL-2025-014",
      batchNumber: "BN-2026-005",
      reason: "Mislabeled secondary packaging — minor; all units recovered.",
      openedAt: iso(-95 * 24),
      impactedPackages: 5200,
      locatedPackages: 5200,
      outstandingPackages: 0,
      status: "CLOSED",
      impactedPartnerIds: ["tp-dist-valuemeds"],
    },
  ];
}

function generate(): Dataset {
  const rng = mulberry32(SEED);

  const products = PRODUCTS;
  const locations = LOCATIONS;
  const tradingPartners = buildPartners(rng);
  const batches = buildBatches(rng);
  const carriers = CARRIERS.map((c) => ({ ...c, modes: [...c.modes] }));

  const built = buildShipments(rng, batches, tradingPartners);
  reconcileCarriers(carriers, built.shipments);
  const serializedUnits = buildSerializedUnits(rng, built.shipments);
  const recalls = buildRecalls();

  return {
    products,
    batches,
    serializedUnits,
    locations,
    carriers,
    shipments: built.shipments,
    shipmentEvents: built.events,
    custodyEvents: built.custody,
    ownershipEvents: built.ownership,
    temperatureReadings: built.temperatures,
    tradingPartners,
    riskEvents: built.riskEvents,
    recalls,
  };
}

// Memoized singleton — generated exactly once per process.
let _dataset: Dataset | null = null;

export function getDataset(): Dataset {
  if (!_dataset) _dataset = generate();
  return _dataset;
}

/** Force regeneration (used only by the deterministic-reconciliation test). */
export function regenerateDataset(): Dataset {
  return generate();
}
