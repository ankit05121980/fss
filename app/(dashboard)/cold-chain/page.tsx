import { Snowflake } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Cold Chain Intelligence" };

export default function ColdChainPage() {
  return (
    <>
      <PageHeader
        title="Cold Chain Intelligence"
        subtitle="Temperature monitoring, excursion detection and root-cause analysis."
      />
      <EmptyState
        icon={Snowflake}
        title="Cold Chain"
        description="Temperature timelines, route overlays and root-cause analysis arrive in a later build phase."
      />
    </>
  );
}
