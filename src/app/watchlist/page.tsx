import { auth } from "@/lib/auth";
import { getLibraryItems } from "@/lib/library";
import { WatchlistView } from "@/components/watchlist";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const userId = session?.user?.id;
  const allItems = await getLibraryItems({ userId });
  const watchlistItems = allItems.filter((item) => item.status === "PLAN_TO_WATCH");

  return <WatchlistView initialItems={watchlistItems} />;
}
