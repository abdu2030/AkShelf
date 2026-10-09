import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Library } from "lucide-react";

export default function LibraryPage() {
  return (
    <AppShell>
      <PageHeader
        title="My Library"
        subtitle="All tracked titles filtered by status and media type."
      />
      <EmptyState
        icon={<Library />}
        headline="Nothing on your shelf yet"
        body="Titles you track will show up here."
        actionLabel="Search titles"
        actionHref="/search"
      />
    </AppShell>
  );
}
