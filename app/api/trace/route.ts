import { NextResponse } from "next/server";

import { resolveTrace } from "@/lib/data/access";
import type { TraceQueryType } from "@/lib/data/types";

const VALID_TYPES: TraceQueryType[] = ["serial", "batch", "shipment", "product"];

export function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q") ?? "";
  const typeParam = sp.get("type");
  const type =
    typeParam && VALID_TYPES.includes(typeParam as TraceQueryType)
      ? (typeParam as TraceQueryType)
      : undefined;
  const result = resolveTrace(q, type);
  if (!result) return NextResponse.json({ error: "No match found", query: q }, { status: 404 });
  return NextResponse.json(result);
}
