import { ClipboardCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Recall Readiness" };

export default function RecallPage() {
  return (
    <>
      <PageHeader
        title="Recall Readiness"
        subtitle="Recall impact, located vs outstanding product and response metrics."
      />
      <EmptyState
        icon={ClipboardCheck}
        title="Recall Readiness"
        description="Recall distribution map, progress tracker and impacted partners arrive in a later build phase."
      />
    </>
  );
}
