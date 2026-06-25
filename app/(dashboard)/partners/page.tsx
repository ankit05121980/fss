import { Network } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Trading Partner Compliance" };

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        title="Trading Partner Compliance"
        subtitle="Authorization, licence status, risk matrix and suspect-product signals."
      />
      <EmptyState
        icon={Network}
        title="Trading Partners"
        description="Partner risk matrix, authorization board and suspect-product investigation arrive in a later build phase."
      />
    </>
  );
}
