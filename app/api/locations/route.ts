import { NextResponse } from "next/server";

import { getLocations } from "@/lib/data/access";

export function GET() {
  return NextResponse.json(getLocations());
}
