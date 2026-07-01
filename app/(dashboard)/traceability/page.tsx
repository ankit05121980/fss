import { PageHeader } from "@/components/shared/PageHeader";
import { TraceabilityView } from "@/components/traceability/TraceabilityView";

export const metadata = { title: "End-to-End Traceability" };

export default async function TraceabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;

  return (
    <>
      <PageHeader
        title="End-to-End Traceability"
        subtitle="Trace any serial, batch, shipment or product across its full DSCSA history."
      />
      <TraceabilityView initialQuery={q ?? ""} initialType={type} />
    </>
  );
}
