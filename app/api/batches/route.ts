import { NextResponse } from "next/server";

import { getBatches } from "@/lib/data/access";

export function GET() {
  return NextResponse.json(getBatches());
}
