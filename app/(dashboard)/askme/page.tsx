import { Bot } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "AskMe" };

export default function AskMePage() {
  return (
    <>
      <PageHeader
        title="AskMe"
        subtitle="Conversational compliance intelligence over the unified data model."
      />
      <EmptyState
        icon={Bot}
        title="AskMe"
        description="The conversational assistant and its nine reference intents arrive in a later build phase."
      />
    </>
  );
}
