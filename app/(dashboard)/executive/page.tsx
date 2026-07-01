import { PageHeader } from "@/components/shared/PageHeader";
import { ExecutiveView } from "@/components/executive/ExecutiveView";

export const metadata = { title: "Executive DSCSA Readiness" };

export default function ExecutivePage() {
  return (
    <>
      <PageHeader
        title="Executive DSCSA Readiness"
        subtitle="Compliance posture across traceability, serialization, partners and recalls."
      />
      <ExecutiveView />
    </>
  );
}
