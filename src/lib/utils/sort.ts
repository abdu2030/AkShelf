export type SortField = "DATE_ADDED" | "TITLE" | "RATING" | "RELEASE_YEAR";
export type SortDirection = "asc" | "desc";

export interface SortOption {
  field: SortField;
  label: string;
  defaultDirection: SortDirection;
}

export const sortOptions: SortOption[] = [
  { field: "DATE_ADDED", label: "Date Added", defaultDirection: "desc" },
  { field: "TITLE", label: "Title", defaultDirection: "asc" },
  { field: "RATING", label: "Rating", defaultDirection: "desc" },
  { field: "RELEASE_YEAR", label: "Release Year", defaultDirection: "desc" },
];

export interface SortableMediaItem {
  title?: string | null;
  rating?: number | null;
  userRating?: number | null;
  year?: number | string | null;
  releaseYear?: number | string | null;
  addedAt?: string | Date | null;
  watchedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

/**
 * Sorts an array of media items by a specified field and direction.
 * Ties are deterministically resolved by title.
 */
export function sortMediaItems<T extends SortableMediaItem>(
  items: T[],
  field: SortField,
  direction: SortDirection = "desc",
): T[] {
  const isAsc = direction === "asc";
  const modifier = isAsc ? 1 : -1;

  return [...items].sort((a, b) => {
    switch (field) {
      case "TITLE": {
        const titleA = a.title ?? "";
        const titleB = b.title ?? "";
        return (
          titleA.localeCompare(titleB, undefined, { sensitivity: "base", numeric: true }) * modifier
        );
      }

      case "RATING": {
        const ratingA = a.rating ?? a.userRating;
        const ratingB = b.rating ?? b.userRating;

        if (ratingA === null || ratingA === undefined) {
          if (ratingB === null || ratingB === undefined) break;
          return 1; // Unrated items always push to the end regardless of direction
        }
        if (ratingB === null || ratingB === undefined) {
          return -1;
        }

        const diff = (ratingA - ratingB) * modifier;
        if (diff !== 0) return diff;
        break;
      }

      case "RELEASE_YEAR": {
        const yearA = a.year ?? a.releaseYear;
        const yearB = b.year ?? b.releaseYear;

        const numA = yearA !== null && yearA !== undefined ? Number(yearA) : null;
        const numB = yearB !== null && yearB !== undefined ? Number(yearB) : null;

        if (numA === null || isNaN(numA)) {
          if (numB === null || isNaN(numB)) break;
          return 1; // Unknown year items push to the end
        }
        if (numB === null || isNaN(numB)) {
          return -1;
        }

        const diff = (numA - numB) * modifier;
        if (diff !== 0) return diff;
        break;
      }

      case "DATE_ADDED": {
        const dateA = a.addedAt ?? a.watchedAt ?? a.createdAt ?? a.updatedAt;
        const dateB = b.addedAt ?? b.watchedAt ?? b.createdAt ?? b.updatedAt;

        const timeA = dateA ? new Date(dateA).getTime() : 0;
        const timeB = dateB ? new Date(dateB).getTime() : 0;

        const diff = (timeA - timeB) * modifier;
        if (diff !== 0) return diff;
        break;
      }
    }

    // Secondary deterministic sort by title
    return (a.title ?? "").localeCompare(b.title ?? "", undefined, { sensitivity: "base" });
  });
}
