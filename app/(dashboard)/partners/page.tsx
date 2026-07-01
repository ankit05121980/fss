import { PageHeader } from "@/components/shared/PageHeader";
import { PartnersView } from "@/components/partners/PartnersView";

export const metadata = { title: "Trading Partner Compliance" };

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        title="Trading Partner Compliance"
        subtitle="Authorization, licence status, risk matrix and suspect-product signals."
      />
      <PartnersView />
    </>
  );
}
