import { NextResponse } from "next/server";

import { getRecall } from "@/lib/data/access";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recall = getRecall(id.toUpperCase());
  if (!recall) return NextResponse.json({ error: "Recall not found" }, { status: 404 });
  return NextResponse.json(recall);
}
