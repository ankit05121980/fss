import { NextResponse } from "next/server";

import {
  getCarrierPerformance,
  getControlTowerKpis,
  getDelayByMode,
  getLocations,
  getPortCongestion,
  getShipments,
} from "@/lib/data/access";

export function GET() {
  return NextResponse.json({
    kpis: getControlTowerKpis(),
    shipments: getShipments(),
    carrierPerformance: getCarrierPerformance(),
    portCongestion: getPortCongestion(),
    delayByMode: getDelayByMode(),
    locations: getLocations(),
  });
}
