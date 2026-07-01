import { PageHeader } from "@/components/shared/PageHeader";
import { AskMeView } from "@/components/askme/AskMeView";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "AskMe" };

export default function AskMePage() {
  return (
    <>
      <PageHeader
        title="AskMe"
        subtitle="Conversational compliance intelligence over the unified data model."
      >
        <Badge variant="muted">Deterministic engine · 9 intents</Badge>
      </PageHeader>
      <AskMeView />
    </>
  );
}
