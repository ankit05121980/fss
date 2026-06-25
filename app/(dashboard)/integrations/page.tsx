import { PageHeader } from "@/components/shared/PageHeader";
import { IntegrationsView } from "@/components/integrations/IntegrationsView";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Data Integration" };

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Data Integration"
        subtitle="Upload data files or connect FSS source systems. Lumenore conforms everything into one unified supply chain model."
      >
        <Badge variant="muted">Read-only intelligence layer</Badge>
      </PageHeader>
      <IntegrationsView />
    </>
  );
}
