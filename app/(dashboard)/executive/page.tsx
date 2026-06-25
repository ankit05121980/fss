import { Gauge } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Executive DSCSA Readiness" };

export default function ExecutivePage() {
  return (
    <>
      <PageHeader
        title="Executive DSCSA Readiness"
        subtitle="Compliance posture across traceability, serialization, partners and recalls."
      />
      <EmptyState
        icon={Gauge}
        title="Executive dashboard"
        description="KPIs, compliance gauge, trends and risk heatmap arrive in a later build phase."
      />
    </>
  );
}
