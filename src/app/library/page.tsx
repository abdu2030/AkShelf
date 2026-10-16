import { auth } from "@/lib/auth";
import { getLibraryItems } from "@/lib/library";
import { LibraryView } from "@/components/library";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const userId = session?.user?.id;
  const initialItems = await getLibraryItems({ userId });

  return <LibraryView initialItems={initialItems} />;
}
