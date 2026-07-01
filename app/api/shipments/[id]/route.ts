import { NextResponse } from "next/server";

import { getShipmentDetail } from "@/lib/data/access";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getShipmentDetail(id.toUpperCase());
  if (!detail) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  return NextResponse.json(detail);
}
