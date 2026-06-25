import { NextResponse } from "next/server";

import { getPredictiveBundle } from "@/lib/engines/predictive";

export function GET() {
  return NextResponse.json(getPredictiveBundle());
}
