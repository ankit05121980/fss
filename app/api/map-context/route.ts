import { NextResponse } from "next/server";

import { getMapContext } from "@/lib/data/access";

export function GET() {
  return NextResponse.json(getMapContext());
}
