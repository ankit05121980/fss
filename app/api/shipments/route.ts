import { NextResponse } from "next/server";

import { getShipments } from "@/lib/data/access";

export function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const shipments = getShipments({
    mode: sp.get("mode") ?? undefined,
    status: sp.get("status") ?? undefined,
    carrierId: sp.get("carrierId") ?? undefined,
  });
  return NextResponse.json(shipments);
}
