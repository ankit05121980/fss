import { NextResponse } from "next/server";

import { getInsights } from "@/lib/engines/insights";

export function GET() {
  return NextResponse.json(getInsights());
}
