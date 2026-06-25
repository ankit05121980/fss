import { NextResponse } from "next/server";

import { getTemperatureReadings } from "@/lib/data/access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  const { shipmentId } = await params;
  return NextResponse.json(getTemperatureReadings(shipmentId.toUpperCase()));
}
