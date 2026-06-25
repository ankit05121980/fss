import {
  Building2,
  Database,
  Network,
  Thermometer,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ConnectorStatus = "CONNECTED" | "AVAILABLE" | "OPTIONAL";
export type ConnectorMethod = "API" | "FILE" | "DB";

export interface Connector {
  id: string;
  name: string;
  category: string;
  description: string;
  dataProvided: string;
  method: ConnectorMethod;
  status: ConnectorStatus;
  cadence: string;
  /** Hours since last successful sync (relative to DEMO_NOW); null when not connected. */
  lastSyncHours: number | null;
  productionPath: string;
  icon: LucideIcon;
}

/**
 * Source systems from the FSS delivery plan. NetSuite is the live read-only
 * "proof connector"; others are representative connectors. HubSpot is optional.
 */
export const CONNECTORS: Connector[] = [
  {
    id: "netsuite",
    name: "NetSuite",
    category: "ERP",
    description: "Orders, inventory, procurement, vendors and financial transactions.",
    dataProvided: "Products, batches, ownership",
    method: "API",
    status: "CONNECTED",
    cadence: "Every 15 min",
    lastSyncHours: 0,
    productionPath: "Scheduled API / SuiteAnalytics integration",
    icon: Database,
  },
  {
    id: "datex",
    name: "Datex Footprint",
    category: "WMS",
    description: "Inventory movements, receiving, picking, packing and warehouse transactions.",
    dataProvided: "Serialized units, custody",
    method: "API",
    status: "AVAILABLE",
    cadence: "Hourly",
    lastSyncHours: null,
    productionPath: "API / DB / file-based feed",
    icon: Warehouse,
  },
  {
    id: "eupry",
    name: "EUPRY",
    category: "Cold Chain",
    description: "Temperature, humidity, sensor status, excursions and compliance records.",
    dataProvided: "Temperature readings",
    method: "API",
    status: "CONNECTED",
    cadence: "Every 10 min",
    lastSyncHours: 0,
    productionPath: "API / export feed, scheduled",
    icon: Thermometer,
  },
  {
    id: "transport",
    name: "Transportation Providers",
    category: "Logistics",
    description: "Ocean, air and truck events; customs and delivery status (ocean emphasis).",
    dataProvided: "Shipment & custody events",
    method: "API",
    status: "AVAILABLE",
    cadence: "Near real-time",
    lastSyncHours: null,
    productionPath: "Carrier APIs / EDI / visibility-platform feeds",
    icon: Truck,
  },
  {
    id: "partner-registry",
    name: "Trading-Partner Registry",
    category: "Master Data",
    description: "Authorization, licensing and compliance status for trading partners.",
    dataProvided: "Trading partners, GLNs",
    method: "DB",
    status: "CONNECTED",
    cadence: "Daily",
    lastSyncHours: 6,
    productionPath: "Master-data / GLN registry integration",
    icon: Network,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM (optional)",
    description: "Account, partner relationship and communications context.",
    dataProvided: "Partner & account enrichment",
    method: "API",
    status: "OPTIONAL",
    cadence: "—",
    lastSyncHours: null,
    productionPath: "API connector (production option)",
    icon: Users,
  },
];

export interface ArchLayer {
  label: string;
  detail: string;
}

/** Logical layers from the delivery plan (source → presentation). */
export const ARCH_LAYERS: ArchLayer[] = [
  { label: "Source systems", detail: "NetSuite, Datex, EUPRY, carriers, registry" },
  { label: "Ingestion & connectors", detail: "API · file · DB extract, scheduled" },
  { label: "Unified data model", detail: "9 conformed entities, shared keys" },
  { label: "Analytics & rules", detail: "KPIs, exception & correlation logic" },
  { label: "Intelligence", detail: "AskMe · Do You Know · Predictive" },
  { label: "Presentation", detail: "Dashboards, alerts, guided flow" },
];

export const ARCH_ICON = Building2;
