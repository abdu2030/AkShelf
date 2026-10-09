import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <AppShell>
      <PageHeader
        title="History"
        subtitle="Chronological activity log of what you watched and rated."
      />
      <EmptyState
        icon={<History />}
        headline="Nothing here yet"
        body="Your activity will appear as you track titles."
        actionLabel="Search titles"
        actionHref="/search"
      />
    </AppShell>
  );
}
