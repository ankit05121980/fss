import { NextResponse } from "next/server";

import { getProducts } from "@/lib/data/access";

export function GET() {
  return NextResponse.json(getProducts());
}
