"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SearchField } from "./search-field";
import { SearchFilterChips, SearchFilterType } from "./search-filter-chips";
import { SearchResultRow } from "./search-result-row";
import { RecentSearchesList } from "./recent-searches-list";
import {
  addRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
  subscribeToRecentSearches,
  getRecentSearchesSnapshot,
  getRecentSearchesServerSnapshot,
} from "@/lib/search/recent-searches";
import { SearchResultItem } from "@/app/api/search/route";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export interface SearchViewProps {
  initialQuery?: string;
  className?: string;
}

export function SearchView({ initialQuery = "", className }: SearchViewProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<SearchFilterType>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [onShelf, setOnShelf] = useState<SearchResultItem[]>([]);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [hasSearched, setHasSearched] = useState(false);

  // useSyncExternalStore guarantees 1:1 SSR hydration match while staying reactive to client localStorage updates
  const recentSearches = useSyncExternalStore(
    subscribeToRecentSearches,
    getRecentSearchesSnapshot,
    getRecentSearchesServerSnapshot,
  );

  // 300ms debounce on input typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue]);

  // Fetch results when debounced query or filter type changes
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      return;
    }

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoading(true);
        setHasSearched(true);
        setHighlightedIndex(-1);
      }
    });

    const typeParam = selectedType !== "ALL" ? `&type=${selectedType}` : "";
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}${typeParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setOnShelf(data.onShelf || []);
        setResults(data.results || []);
        setIsLoading(false);

        // Add to recent searches if search returned results
        if ((data.onShelf?.length > 0 || data.results?.length > 0) && debouncedQuery) {
          addRecentSearch(debouncedQuery);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Search fetch error:", err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedType]);

  const isQueryActive = debouncedQuery.trim().length >= 2;

  // Combined flat list of results for keyboard arrow navigation
  const flatResults = useMemo(() => {
    if (debouncedQuery.trim().length < 2) return [];
    return [...onShelf, ...results];
  }, [debouncedQuery, onShelf, results]);

  // Global keyboard shortcuts: `/` or `Ctrl+K` to focus, ArrowDown / ArrowUp to navigate, Enter to open, Esc to clear
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      // 1. Esc: clear query if present, otherwise blur
      if (e.key === "Escape") {
        if (inputValue) {
          e.preventDefault();
          setInputValue("");
          setDebouncedQuery("");
          setOnShelf([]);
          setResults([]);
          setHighlightedIndex(-1);
        } else {
          inputRef.current?.blur();
        }
        return;
      }

      // 2. ArrowDown: navigate results
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (flatResults.length === 0) return -1;
          const next = prev + 1;
          return next >= flatResults.length ? 0 : next;
        });
        return;
      }

      // 3. ArrowUp: navigate results backwards
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (flatResults.length === 0) return -1;
          const next = prev - 1;
          return next < 0 ? flatResults.length - 1 : next;
        });
        return;
      }

      // 4. Enter: open highlighted item
      if (e.key === "Enter" && highlightedIndex >= 0 && flatResults[highlightedIndex]) {
        e.preventDefault();
        const target = flatResults[highlightedIndex];
        router.push(`/title/${target.id}`);
        return;
      }
    },
    [inputValue, flatResults, highlightedIndex, router],
  );

  // Global shortcut listener for `/` and `Ctrl+K` from anywhere
  useEffect(() => {
    function onGlobalKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // / shortcut (when not already typing in another input)
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
    }

    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  const handleSelectRecent = (term: string) => {
    setInputValue(term);
    inputRef.current?.focus();
  };

  const handleRemoveRecent = (term: string) => {
    removeRecentSearch(term);
  };

  const handleClearAllRecent = () => {
    clearRecentSearches();
  };

  const handleClear = () => {
    setInputValue("");
    setDebouncedQuery("");
    setOnShelf([]);
    setResults([]);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleQuickTrack = (item: SearchResultItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // For Day 17, navigating to the title triggers the save/track flow
    router.push(`/title/${item.id}`);
  };

  return (
    <div className={cn("space-y-6 max-w-4xl mx-auto pb-16", className)} onKeyDown={handleKeyDown}>
      {/* Search Header Controls */}
      <div className="space-y-3">
        <SearchField
          ref={inputRef}
          value={inputValue}
          onValueChange={setInputValue}
          onClear={handleClear}
          isLoading={isLoading}
          autoFocus
        />

        <SearchFilterChips selected={selectedType} onSelect={setSelectedType} />
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* State 1: Initial / Before typing */}
        {!debouncedQuery && (
          <div className="space-y-8 pt-4">
            <RecentSearchesList
              searches={recentSearches}
              onSelectSearch={handleSelectRecent}
              onRemoveSearch={handleRemoveRecent}
              onClearAll={handleClearAllRecent}
            />

            <EmptyState
              icon={<Search className="w-8 h-8 text-accent" />}
              headline="Search for a movie, show or anime"
              body="Enter a title to see if it's already on your shelf, or discover new titles from TMDB and AniList."
            />
          </div>
        )}

        {/* State 2: Loading Skeletons */}
        {isLoading && flatResults.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-28 rounded-xl glass-2 p-3 flex items-center gap-4 animate-pulse"
              >
                <Skeleton className="w-16 h-24 rounded-md shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-64 rounded hidden md:block" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* State 3: Search Results */}
        {!isLoading && isQueryActive && hasSearched && flatResults.length > 0 && (
          <div className="space-y-6">
            {/* Section 1: ON YOUR SHELF */}
            {onShelf.length > 0 && (
              <section aria-labelledby="shelf-results-heading" className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2
                    id="shelf-results-heading"
                    className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    On Your Shelf
                  </h2>
                  <span className="text-xs text-ink-muted">
                    {onShelf.length} {onShelf.length === 1 ? "match" : "matches"}
                  </span>
                </div>

                <div className="glass-2 rounded-2xl p-1.5 border border-white/10 divide-y divide-white/5 shadow-sm">
                  {onShelf.map((item, idx) => (
                    <SearchResultRow
                      key={`shelf-${item.id}`}
                      item={item}
                      isHighlighted={highlightedIndex === idx}
                      onQuickTrack={handleQuickTrack}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: FROM TMDB AND ANILIST */}
            {results.length > 0 && (
              <section aria-labelledby="provider-results-heading" className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2
                    id="provider-results-heading"
                    className="text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    From TMDB and AniList
                  </h2>
                  <span className="text-xs text-ink-muted">
                    {results.length} {results.length === 1 ? "result" : "results"}
                  </span>
                </div>

                <div className="glass-2 rounded-2xl p-1.5 border border-white/10 divide-y divide-white/5 shadow-sm">
                  {results.map((item, idx) => {
                    const overallIndex = onShelf.length + idx;
                    return (
                      <SearchResultRow
                        key={`ext-${item.id}`}
                        item={item}
                        isHighlighted={highlightedIndex === overallIndex}
                        onQuickTrack={handleQuickTrack}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* State 4: No Matches Found */}
        {!isLoading && isQueryActive && hasSearched && flatResults.length === 0 && (
          <EmptyState
            icon={<Search className="w-8 h-8 text-ink-muted" />}
            headline="No matches found"
            body={`We couldn't find anything matching "${debouncedQuery}". Check the spelling, try different keywords, or switch the media filter.`}
            actionLabel="Clear search"
            onAction={handleClear}
          />
        )}
      </div>
    </div>
  );
}
