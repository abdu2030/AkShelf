import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Bookmark } from "lucide-react";

export default function WatchlistPage() {
  return (
    <AppShell>
      <PageHeader title="Watchlist" subtitle="Titles you plan to watch next." />
      <EmptyState
        icon={<Bookmark />}
        headline="Your watchlist is empty"
        body="When you find something for later, add it from search."
        actionLabel="Search titles"
        actionHref="/search"
      />
    </AppShell>
  );
}
