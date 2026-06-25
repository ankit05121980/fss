import { NextResponse } from "next/server";

import {
  getComplianceTrend,
  getCoverageTrend,
  getExecutiveKpis,
  getRiskHeatmap,
  getViolationsByCategory,
} from "@/lib/data/access";

export function GET() {
  return NextResponse.json({
    kpis: getExecutiveKpis(),
    complianceTrend: getComplianceTrend(),
    coverageTrend: getCoverageTrend(),
    riskHeatmap: getRiskHeatmap(),
    violationsByCategory: getViolationsByCategory(),
  });
}
