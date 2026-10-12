const STORAGE_KEY = "akshelf_recent_searches";
const MAX_RECENT_SEARCHES = 5;

/**
 * Retrieves the stored recent searches from localStorage.
 */
export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_RECENT_SEARCHES);
    }
  } catch {
    // Ignore JSON parse errors or localStorage restrictions
  }
  return [];
}

/**
 * Saves a new search term to the top of recent searches, keeping up to 5 unique terms.
 */
export function addRecentSearch(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed || typeof window === "undefined") return getRecentSearches();

  try {
    const current = getRecentSearches();
    // Remove if already exists (case-insensitive deduplication)
    const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Removes a single search term from recent searches.
 */
export function removeRecentSearch(term: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getRecentSearches();
    const updated = current.filter((item) => item.toLowerCase() !== term.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Clears all recent searches from localStorage.
 */
export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
