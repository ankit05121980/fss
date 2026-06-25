import { PackageSearch } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "End-to-End Traceability" };

export default function TraceabilityPage() {
  return (
    <>
      <PageHeader
        title="End-to-End Traceability"
        subtitle="Trace any serial, batch, shipment or product across its full DSCSA history."
      />
      <EmptyState
        icon={PackageSearch}
        title="Traceability"
        description="Search-driven provenance, custody, ownership and temperature history arrive in a later build phase."
      />
    </>
  );
}
