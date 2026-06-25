import { Lightbulb } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Do You Know" };

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        title="Do You Know"
        subtitle="Automatically generated, data-derived business insights."
      />
      <EmptyState
        icon={Lightbulb}
        title="Do You Know"
        description="Computed insight cards arrive in a later build phase."
      />
    </>
  );
}
