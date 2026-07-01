import { PageHeader } from "@/components/shared/PageHeader";
import { PredictiveView } from "@/components/predictive/PredictiveView";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Predictive Analytics" };

export default function PredictivePage() {
  return (
    <>
      <PageHeader
        title="Predictive Analytics"
        subtitle="Transparent heuristic risk models for delay, excursion, recall, traceability and partner risk."
      >
        <Badge variant="muted">POC heuristic models</Badge>
      </PageHeader>
      <PredictiveView />
    </>
  );
}
