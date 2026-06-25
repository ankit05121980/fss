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

export interface ConfigField {
  label: string;
  placeholder: string;
  type?: "text" | "password";
  required?: boolean;
  hint?: string;
}

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
  /** Auth/integration pattern shown in the configure dialog. */
  authType: string;
  /** Standard credentials/details required before the first sync. */
  configFields: ConfigField[];
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
    status: "AVAILABLE",
    cadence: "Every 15 min",
    lastSyncHours: null,
    productionPath: "Scheduled API / SuiteAnalytics integration",
    authType: "Token-Based Authentication (TBA / OAuth 1.0)",
    configFields: [
      { label: "Account ID", placeholder: "e.g. 1234567", required: true },
      { label: "Environment", placeholder: "Production / Sandbox", required: true },
      { label: "Consumer Key", placeholder: "Integration consumer key", required: true },
      { label: "Consumer Secret", placeholder: "••••••••", type: "password", required: true },
      { label: "Token ID", placeholder: "Access token id", required: true },
      { label: "Token Secret", placeholder: "••••••••", type: "password", required: true },
    ],
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
    authType: "API key + warehouse scope",
    configFields: [
      { label: "Base URL", placeholder: "https://wms.fss.example/api", required: true },
      { label: "API Key", placeholder: "••••••••", type: "password", required: true },
      { label: "Warehouse / Site ID", placeholder: "e.g. NJ-EDISON-01", required: true },
      { label: "Sync interval (min)", placeholder: "60", hint: "How often to pull movements" },
    ],
    icon: Warehouse,
  },
  {
    id: "eupry",
    name: "EUPRY",
    category: "Cold Chain",
    description: "Temperature, humidity, sensor status, excursions and compliance records.",
    dataProvided: "Temperature readings",
    method: "API",
    status: "AVAILABLE",
    cadence: "Every 10 min",
    lastSyncHours: null,
    productionPath: "API / export feed, scheduled",
    authType: "API token (Bearer)",
    configFields: [
      { label: "API Token", placeholder: "••••••••", type: "password", required: true },
      { label: "Organization ID", placeholder: "eupry-org-id", required: true },
      { label: "Sensor group IDs", placeholder: "Comma-separated, e.g. reefer-01, reefer-02" },
      { label: "Poll interval (min)", placeholder: "10", hint: "Excursion detection cadence" },
    ],
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
    authType: "Carrier API key / EDI (AS2)",
    configFields: [
      { label: "Provider", placeholder: "e.g. Maersk, DHL, project44", required: true },
      { label: "API Endpoint", placeholder: "https://api.carrier.example/v1", required: true },
      { label: "API Key", placeholder: "••••••••", type: "password", required: true },
      { label: "EDI / AS2 Station ID", placeholder: "Optional — for EDI feeds" },
    ],
    icon: Truck,
  },
  {
    id: "partner-registry",
    name: "Trading-Partner Registry",
    category: "Master Data",
    description: "Authorization, licensing and compliance status for trading partners.",
    dataProvided: "Trading partners, GLNs",
    method: "DB",
    status: "AVAILABLE",
    cadence: "Daily",
    lastSyncHours: null,
    productionPath: "Master-data / GLN registry integration",
    authType: "Database connection",
    configFields: [
      { label: "Host", placeholder: "registry-db.fss.internal", required: true },
      { label: "Port", placeholder: "5432", required: true },
      { label: "Database", placeholder: "partner_registry", required: true },
      { label: "Username", placeholder: "lumenore_ro", required: true },
      { label: "Password", placeholder: "••••••••", type: "password", required: true },
      { label: "Schema", placeholder: "public" },
    ],
    icon: Network,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM (optional)",
    description: "Account, partner relationship and communications context.",
    dataProvided: "Partner & account enrichment",
    method: "API",
    status: "AVAILABLE",
    cadence: "—",
    lastSyncHours: null,
    productionPath: "API connector (production option)",
    authType: "Private App token / OAuth 2.0",
    configFields: [
      { label: "Portal ID", placeholder: "e.g. 21345678", required: true },
      { label: "Private App Token", placeholder: "••••••••", type: "password", required: true },
      { label: "Object scopes", placeholder: "companies, contacts, deals" },
    ],
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
