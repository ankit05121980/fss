import { NextResponse } from "next/server";

import {
  getCustodyGaps,
  getPartnerKpis,
  getPartnerRiskMatrix,
  getPartners,
  getUnauthorizedInteractions,
} from "@/lib/data/access";

export function GET() {
  return NextResponse.json({
    kpis: getPartnerKpis(),
    partners: getPartners(),
    riskMatrix: getPartnerRiskMatrix(),
    custodyGaps: getCustodyGaps(),
    unauthorizedInteractions: getUnauthorizedInteractions(),
  });
}
