const STORAGE_KEY = "akshelf_recent_searches";
const MAX_RECENT_SEARCHES = 5;

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

let cachedRaw: string | null = null;
let cachedSnapshot: string[] = [];
const SERVER_SNAPSHOT: string[] = [];

/**
 * Subscribes to changes in recent searches (both within tab and across windows).
 */
export function subscribeToRecentSearches(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

/**
 * Snapshot getter for useSyncExternalStore on client.
 */
export function getRecentSearchesSnapshot(): string[] {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || "[]";
    if (raw === cachedRaw) {
      return cachedSnapshot;
    }
    cachedRaw = raw;
    const parsed = JSON.parse(raw);
    cachedSnapshot = Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    cachedSnapshot = [];
  }
  return cachedSnapshot;
}

/**
 * Snapshot getter for useSyncExternalStore on server (always empty to guarantee consistent SSR).
 */
export function getRecentSearchesServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}

/**
 * Retrieves the stored recent searches from localStorage.
 */
export function getRecentSearches(): string[] {
  return getRecentSearchesSnapshot();
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
    const serialized = JSON.stringify(updated);
    cachedRaw = serialized;
    cachedSnapshot = updated;
    localStorage.setItem(STORAGE_KEY, serialized);
    notifyListeners();
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
    const serialized = JSON.stringify(updated);
    cachedRaw = serialized;
    cachedSnapshot = updated;
    localStorage.setItem(STORAGE_KEY, serialized);
    notifyListeners();
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
    cachedRaw = "[]";
    cachedSnapshot = [];
    localStorage.removeItem(STORAGE_KEY);
    notifyListeners();
  } catch {
    // Ignore storage errors
  }
}
