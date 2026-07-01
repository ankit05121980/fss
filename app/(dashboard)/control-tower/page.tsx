import { PageHeader } from "@/components/shared/PageHeader";
import { ControlTowerView } from "@/components/control-tower/ControlTowerView";

export const metadata = { title: "Supply Chain Control Tower" };

export default function ControlTowerPage() {
  return (
    <>
      <PageHeader
        title="Supply Chain Control Tower"
        subtitle="End-to-end shipment visibility with ocean-freight emphasis."
      />
      <ControlTowerView />
    </>
  );
}
