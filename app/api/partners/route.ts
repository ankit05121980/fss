import { NextResponse } from "next/server";

import { getPartners } from "@/lib/data/access";

export function GET() {
  return NextResponse.json(getPartners());
}
