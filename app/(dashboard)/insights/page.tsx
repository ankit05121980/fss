import { PageHeader } from "@/components/shared/PageHeader";
import { InsightsView } from "@/components/insights/InsightsView";

export const metadata = { title: "Do You Know" };

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        title="Do You Know"
        subtitle="Automatically generated, data-derived business insights."
      />
      <InsightsView />
    </>
  );
}
