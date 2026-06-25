import { NextResponse } from "next/server";

import { getCarriers } from "@/lib/data/access";

export function GET() {
  return NextResponse.json(getCarriers());
}
