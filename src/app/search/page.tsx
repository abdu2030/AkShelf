import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "lucide-react";

export default function SearchPage() {
  return (
    <AppShell>
      <PageHeader
        title="Search"
        subtitle="Find movies, TV shows, and anime across TMDB and AniList."
      />
      <EmptyState
        icon={<Search />}
        headline="Search for a movie, show or anime"
        body="Enter a title to check if you watched it, or add it to your watchlist."
      />
    </AppShell>
  );
}
