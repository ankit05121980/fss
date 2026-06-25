import { TowerControl } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Supply Chain Control Tower" };

export default function ControlTowerPage() {
  return (
    <>
      <PageHeader
        title="Supply Chain Control Tower"
        subtitle="End-to-end shipment visibility with ocean-freight emphasis."
      />
      <EmptyState
        icon={TowerControl}
        title="Control Tower"
        description="Global shipment map, journey timeline and carrier performance arrive in a later build phase."
      />
    </>
  );
}
