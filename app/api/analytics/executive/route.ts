import { NextResponse } from "next/server";

import {
  getComplianceTrend,
  getCoverageTrend,
  getExecutiveKpiTrends,
  getExecutiveKpis,
  getRiskHeatmap,
  getViolationsByCategory,
} from "@/lib/data/access";

export function GET() {
  return NextResponse.json({
    kpis: getExecutiveKpis(),
    kpiTrends: getExecutiveKpiTrends(),
    complianceTrend: getComplianceTrend(),
    coverageTrend: getCoverageTrend(),
    riskHeatmap: getRiskHeatmap(),
    violationsByCategory: getViolationsByCategory(),
  });
}
