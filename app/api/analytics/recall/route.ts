import { NextResponse } from "next/server";

import { getLocations, getPartner, getRecallKpis, getRecalls } from "@/lib/data/access";

export function GET() {
  const recalls = getRecalls();
  const enriched = recalls.map((r) => ({
    ...r,
    impactedPartners: r.impactedPartnerIds
      .map((id) => getPartner(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined),
  }));
  return NextResponse.json({
    kpis: getRecallKpis(),
    recalls: enriched,
    locations: getLocations(),
  });
}
