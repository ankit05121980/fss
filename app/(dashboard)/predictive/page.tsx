import { Radar } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Predictive Analytics" };

export default function PredictivePage() {
  return (
    <>
      <PageHeader
        title="Predictive Analytics"
        subtitle="POC heuristic models for delay, excursion, recall and partner risk."
      />
      <EmptyState
        icon={Radar}
        title="Predictive Analytics"
        description="Risk leaderboard, predictive alerts and explainable drivers arrive in a later build phase."
      />
    </>
  );
}
