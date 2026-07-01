import { NextResponse } from "next/server";

import {
  getCarrierPerformance,
  getControlTowerKpis,
  getDelayByMode,
  getLocations,
  getPortCongestion,
  getShipmentRows,
} from "@/lib/data/access";

export function GET() {
  return NextResponse.json({
    kpis: getControlTowerKpis(),
    shipments: getShipmentRows(),
    carrierPerformance: getCarrierPerformance(),
    portCongestion: getPortCongestion(),
    delayByMode: getDelayByMode(),
    locations: getLocations(),
  });
}
