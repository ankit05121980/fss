import { NextResponse } from "next/server";

import {
  getColdChainKpis,
  getExcursionTrend,
  getProduct,
  getShipmentDetail,
  getShipments,
  getTemperatureReadings,
} from "@/lib/data/access";
import { HERO } from "@/lib/utils/constants";

export function GET() {
  const coldShipments = getShipments()
    .map((s) => {
      const product = getProduct(s.productId);
      if (!product || product.tempMaxC > 8) return null;
      const readings = getTemperatureReadings(s.id);
      const excursionReadings = readings.filter((r) => r.excursion);
      const maxTemp = readings.length ? Math.max(...readings.map((r) => r.temperatureC)) : 0;
      return {
        id: s.id,
        productName: product.name,
        status: s.status,
        primaryMode: s.primaryMode,
        hasExcursion: s.hasExcursion,
        delayHours: s.delayHours,
        excursionCount: excursionReadings.length,
        maxTemp,
        readingCount: readings.length,
        tempMaxC: product.tempMaxC,
        tempMinC: product.tempMinC,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({
    kpis: getColdChainKpis(),
    excursionTrend: getExcursionTrend(),
    coldShipments,
    hero: getShipmentDetail(HERO.shipmentId),
  });
}
