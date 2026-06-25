import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  ClipboardCheck,
  Compass,
  Gauge,
  Lightbulb,
  Network,
  PackageSearch,
  Radar,
  Snowflake,
  TowerControl,
} from "lucide-react";

import type {
  LicenseStatus,
  Mode,
  PartnerAuth,
  RiskType,
  Severity,
  ShipmentStatus,
} from "@/lib/data/types";
import type { BadgeProps } from "@/components/ui/badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

// -----------------------------------------------------------------------------
// Navigation
// -----------------------------------------------------------------------------

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Getting Started",
        href: "/getting-started",
        icon: Compass,
        description: "Guided end-to-end flow",
      },
      {
        title: "Executive",
        href: "/executive",
        icon: Gauge,
        description: "DSCSA readiness at a glance",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Control Tower",
        href: "/control-tower",
        icon: TowerControl,
        description: "End-to-end shipment visibility",
      },
      {
        title: "Traceability",
        href: "/traceability",
        icon: PackageSearch,
        description: "Trace any serial, batch or shipment",
      },
      {
        title: "Cold Chain",
        href: "/cold-chain",
        icon: Snowflake,
        description: "Temperature monitoring & excursions",
      },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        title: "Recall Readiness",
        href: "/recall",
        icon: ClipboardCheck,
        description: "Recall impact & response",
      },
      {
        title: "Trading Partners",
        href: "/partners",
        icon: Network,
        description: "Authorization & licence compliance",
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        title: "AskMe",
        href: "/askme",
        icon: Bot,
        description: "Conversational compliance assistant",
      },
      {
        title: "Do You Know",
        href: "/insights",
        icon: Lightbulb,
        description: "Automated business insights",
      },
      {
        title: "Predictive",
        href: "/predictive",
        icon: Radar,
        description: "AI-driven risk prediction",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const ACTIVITY_ICON = Activity;

// -----------------------------------------------------------------------------
// Status / badge mapping
// -----------------------------------------------------------------------------

export const SHIPMENT_STATUS_META: Record<
  ShipmentStatus,
  { label: string; variant: BadgeVariant }
> = {
  IN_TRANSIT: { label: "In Transit", variant: "info" },
  DELAYED: { label: "Delayed", variant: "warning" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CUSTOMS_HOLD: { label: "Customs Hold", variant: "danger" },
};

export const SEVERITY_META: Record<Severity, { label: string; variant: BadgeVariant }> = {
  LOW: { label: "Low", variant: "muted" },
  MEDIUM: { label: "Medium", variant: "warning" },
  HIGH: { label: "High", variant: "danger" },
};

export const AUTH_META: Record<PartnerAuth, { label: string; variant: BadgeVariant }> = {
  AUTHORIZED: { label: "Authorized", variant: "success" },
  UNAUTHORIZED: { label: "Unauthorized", variant: "danger" },
};

export const LICENSE_META: Record<LicenseStatus, { label: string; variant: BadgeVariant }> = {
  VALID: { label: "Valid", variant: "success" },
  EXPIRED: { label: "Expired", variant: "danger" },
  EXPIRING_SOON: { label: "Expiring Soon", variant: "warning" },
};

export const RISK_TYPE_META: Record<RiskType, { label: string; variant: BadgeVariant }> = {
  DELAY: { label: "Delay", variant: "warning" },
  TEMPERATURE_EXCURSION: { label: "Temperature Excursion", variant: "danger" },
  ROUTE_DEVIATION: { label: "Route Deviation", variant: "warning" },
  MISSING_SCAN: { label: "Missing Scan", variant: "info" },
  UNAUTHORIZED_TRANSFER: { label: "Unauthorized Transfer", variant: "danger" },
};

export const MODE_META: Record<Mode, { label: string }> = {
  OCEAN: { label: "Ocean" },
  AIR: { label: "Air" },
  TRUCK: { label: "Truck" },
  RAIL: { label: "Rail" },
};

// Friendly, human-readable names for location node types.
export const LOCATION_TYPE_META: Record<
  import("@/lib/data/types").LocationType,
  { label: string; color: string }
> = {
  MANUFACTURER: { label: "Manufacturing Site", color: "#1F3864" },
  WAREHOUSE: { label: "Warehouse", color: "#2E75B6" },
  PORT: { label: "Sea / Air Port", color: "#0277BD" },
  CUSTOMS: { label: "Customs Clearance", color: "#ED6C02" },
  "3PL": { label: "3PL Warehouse", color: "#2E7D32" },
  DC: { label: "Distribution Center", color: "#2E75B6" },
  HOSPITAL: { label: "Hospital / Dispenser", color: "#1F3864" },
};

// Concrete hex colors for map markers / leaflet polylines (cannot use CSS vars).
export const STATUS_HEX: Record<ShipmentStatus, string> = {
  IN_TRANSIT: "#0277BD",
  DELAYED: "#ED6C02",
  DELIVERED: "#2E7D32",
  CUSTOMS_HOLD: "#C62828",
};

export const MODE_HEX: Record<Mode, string> = {
  OCEAN: "#1F3864",
  AIR: "#0277BD",
  TRUCK: "#2E7D32",
  RAIL: "#595959",
};

// Recharts palette (concrete hexes, theme-neutral but brand-aligned).
export const CHART_COLORS = ["#2E75B6", "#1F3864", "#0277BD", "#2E7D32", "#ED6C02", "#C62828"];

// -----------------------------------------------------------------------------
// Hero / golden-thread identifiers (kept in one place for reuse)
// -----------------------------------------------------------------------------

export const HERO = {
  productName: "COVID-19 mRNA Vaccine",
  batchNumber: "VX-2026-001",
  shipmentId: "SHP-001",
  serial: "SN0008743",
  recallId: "RCL-2026-001",
  predictedExcursionShipmentId: "SHP-007",
  customsLocationName: "Customs Clearance — Newark",
} as const;
