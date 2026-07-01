import { NextResponse } from "next/server";

import { getShipmentJourney } from "@/lib/data/access";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const journey = getShipmentJourney(id.toUpperCase());
  if (!journey) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  return NextResponse.json(journey);
}
