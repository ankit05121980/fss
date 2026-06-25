import { NextResponse } from "next/server";

import { getRecalls } from "@/lib/data/access";

export function GET() {
  return NextResponse.json(getRecalls());
}
