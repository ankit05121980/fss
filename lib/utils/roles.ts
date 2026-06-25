import { ClipboardCheck, Gauge, ShieldCheck, TowerControl } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RoleId = "ADMIN" | "EXECUTIVE" | "COMPLIANCE" | "OPERATIONS";

export interface RoleDef {
  id: RoleId;
  label: string;
  /** Person & job title for the persona. */
  person: string;
  title: string;
  blurb: string;
  landing: string;
  /** Module hrefs most relevant to this role (shown under "Your workspace"). */
  primary: string[];
  icon: LucideIcon;
  initials: string;
}

export const ROLES: Record<RoleId, RoleDef> = {
  ADMIN: {
    id: "ADMIN",
    label: "Administrator",
    person: "Avery Stone",
    title: "Platform Administrator",
    blurb: "Full access to every module, configuration and intelligence feature.",
    landing: "/executive",
    primary: [
      "/executive",
      "/control-tower",
      "/traceability",
      "/cold-chain",
      "/recall",
      "/partners",
      "/askme",
      "/insights",
      "/predictive",
    ],
    icon: ShieldCheck,
    initials: "AS",
  },
  EXECUTIVE: {
    id: "EXECUTIVE",
    label: "Executive",
    person: "Dana Whitfield",
    title: "Chief Supply Chain Officer",
    blurb: "Board-level readiness, automated insights and predictive risk.",
    landing: "/executive",
    primary: ["/executive", "/insights", "/predictive", "/askme"],
    icon: Gauge,
    initials: "DW",
  },
  COMPLIANCE: {
    id: "COMPLIANCE",
    label: "Compliance Officer",
    person: "Priya Nair",
    title: "DSCSA Compliance Officer",
    blurb: "Recall readiness, trading-partner compliance and full traceability.",
    landing: "/recall",
    primary: ["/recall", "/partners", "/traceability", "/executive", "/askme"],
    icon: ClipboardCheck,
    initials: "PN",
  },
  OPERATIONS: {
    id: "OPERATIONS",
    label: "Operations Manager",
    person: "Marcus Lee",
    title: "Control Tower Manager",
    blurb: "Live shipment visibility, cold-chain monitoring and traceability.",
    landing: "/control-tower",
    primary: ["/control-tower", "/cold-chain", "/traceability", "/predictive"],
    icon: TowerControl,
    initials: "ML",
  },
};

export const ROLE_LIST: RoleDef[] = Object.values(ROLES);
export const DEFAULT_ROLE: RoleId = "ADMIN";
export const ROLE_STORAGE_KEY = "lumenore-role";
