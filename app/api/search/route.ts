import { NextResponse } from "next/server";

import { globalSearch } from "@/lib/data/access";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json(globalSearch(q));
}
