import { Badge } from "@/components/ui/badge";
import {
  AUTH_META,
  LICENSE_META,
  RISK_TYPE_META,
  SEVERITY_META,
  SHIPMENT_STATUS_META,
} from "@/lib/utils/constants";
import type {
  LicenseStatus,
  PartnerAuth,
  RiskType,
  Severity,
  ShipmentStatus,
} from "@/lib/data/types";

type StatusBadgeProps =
  | { kind: "shipment"; value: ShipmentStatus }
  | { kind: "severity"; value: Severity }
  | { kind: "auth"; value: PartnerAuth }
  | { kind: "license"; value: LicenseStatus }
  | { kind: "risk"; value: RiskType };

/**
 * Renders a consistently-styled status badge for any domain enum
 * (shipment status, severity, partner auth, licence, risk type).
 */
export function StatusBadge(props: StatusBadgeProps) {
  switch (props.kind) {
    case "shipment": {
      const meta = SHIPMENT_STATUS_META[props.value];
      return <Badge variant={meta.variant}>{meta.label}</Badge>;
    }
    case "severity": {
      const meta = SEVERITY_META[props.value];
      return <Badge variant={meta.variant}>{meta.label}</Badge>;
    }
    case "auth": {
      const meta = AUTH_META[props.value];
      return <Badge variant={meta.variant}>{meta.label}</Badge>;
    }
    case "license": {
      const meta = LICENSE_META[props.value];
      return <Badge variant={meta.variant}>{meta.label}</Badge>;
    }
    case "risk": {
      const meta = RISK_TYPE_META[props.value];
      return <Badge variant={meta.variant}>{meta.label}</Badge>;
    }
    default:
      return null;
  }
}
