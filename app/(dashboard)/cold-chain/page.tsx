import { PageHeader } from "@/components/shared/PageHeader";
import { ColdChainView } from "@/components/cold-chain/ColdChainView";

export const metadata = { title: "Cold Chain Intelligence" };

export default function ColdChainPage() {
  return (
    <>
      <PageHeader
        title="Cold Chain Intelligence"
        subtitle="Temperature monitoring, excursion detection and root-cause analysis."
      />
      <ColdChainView />
    </>
  );
}
