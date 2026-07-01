import { PageHeader } from "@/components/shared/PageHeader";
import { RecallView } from "@/components/recall/RecallView";

export const metadata = { title: "Recall Readiness" };

export default function RecallPage() {
  return (
    <>
      <PageHeader
        title="Recall Readiness"
        subtitle="Recall impact, located vs outstanding product and response metrics."
      />
      <RecallView />
    </>
  );
}
