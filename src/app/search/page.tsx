import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SearchView } from "@/components/search/search-view";

export default function SearchPage() {
  return (
    <AppShell>
      <PageHeader
        title="Search"
        subtitle="Find movies, TV shows, and anime across TMDB and AniList."
      />
      <div className="mt-4">
        <SearchView />
      </div>
    </AppShell>
  );
}
