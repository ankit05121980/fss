import { NextResponse } from "next/server";

import { getSerial } from "@/lib/data/access";

export async function GET(_req: Request, { params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const unit = getSerial(serial);
  if (!unit) return NextResponse.json({ error: "Serial not found" }, { status: 404 });
  return NextResponse.json(unit);
}
