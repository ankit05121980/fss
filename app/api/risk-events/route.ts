import { NextResponse } from "next/server";

import { getRiskEvents } from "@/lib/data/access";

export function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const resolvedParam = sp.get("resolved");
  const events = getRiskEvents({
    resolved: resolvedParam === null ? undefined : resolvedParam === "true",
    type: sp.get("type") ?? undefined,
    shipmentId: sp.get("shipmentId") ?? undefined,
  });
  return NextResponse.json(events);
}
