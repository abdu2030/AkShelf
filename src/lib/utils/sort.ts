export type SortField = "RECENTLY_UPDATED" | "DATE_ADDED" | "TITLE" | "RATING" | "RELEASE_YEAR";
export type SortDirection = "asc" | "desc";

export interface SortOption {
  field: SortField;
  label: string;
  defaultDirection: SortDirection;
  ascLabel?: string;
  descLabel?: string;
}

export const sortOptions: SortOption[] = [
  {
    field: "RECENTLY_UPDATED",
    label: "Recently Updated",
    defaultDirection: "desc",
    ascLabel: "Least recently updated",
    descLabel: "Recently updated first",
  },
  {
    field: "DATE_ADDED",
    label: "Date Added",
    defaultDirection: "desc",
    ascLabel: "Oldest added first",
    descLabel: "Recently added first",
  },
  {
    field: "TITLE",
    label: "Title",
    defaultDirection: "asc",
    ascLabel: "A to Z",
    descLabel: "Z to A",
  },
  {
    field: "RATING",
    label: "Rating",
    defaultDirection: "desc",
    ascLabel: "Lowest rated first",
    descLabel: "Highest rated first",
  },
  {
    field: "RELEASE_YEAR",
    label: "Release Year",
    defaultDirection: "desc",
    ascLabel: "Oldest release first",
    descLabel: "Newest release first",
  },
];

export interface SortableMediaItem {
  title?: string | null;
  rating?: number | null;
  userRating?: number | null;
  voteAverage?: number | null;
  year?: number | string | null;
  releaseYear?: number | string | null;
  addedAt?: string | Date | null;
  watchedAt?: string | Date | null;
  startedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

/**
 * Returns human-readable description for a given sort field and direction.
 */
export function getSortDirectionDescription(field: SortField, direction: SortDirection): string {
  const opt = sortOptions.find((o) => o.field === field);
  if (!opt) return direction === "asc" ? "Ascending order" : "Descending order";
  return direction === "asc" ? (opt.ascLabel ?? "Ascending") : (opt.descLabel ?? "Descending");
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

      case "RECENTLY_UPDATED": {
        const dateA = a.updatedAt ?? a.watchedAt ?? a.startedAt ?? a.addedAt ?? a.createdAt;
        const dateB = b.updatedAt ?? b.watchedAt ?? b.startedAt ?? b.addedAt ?? b.createdAt;

        const timeA = dateA ? new Date(dateA).getTime() : 0;
        const timeB = dateB ? new Date(dateB).getTime() : 0;

        if (!timeA && !timeB) break;
        if (!timeA) return 1;
        if (!timeB) return -1;

        const diff = (timeA - timeB) * modifier;
        if (diff !== 0) return diff;
        break;
      }

      case "DATE_ADDED": {
        const dateA = a.addedAt ?? a.createdAt;
        const dateB = b.addedAt ?? b.createdAt;

        const timeA = dateA ? new Date(dateA).getTime() : 0;
        const timeB = dateB ? new Date(dateB).getTime() : 0;

        if (!timeA && !timeB) break;
        if (!timeA) return 1;
        if (!timeB) return -1;

        const diff = (timeA - timeB) * modifier;
        if (diff !== 0) return diff;
        break;
      }
    }

    // Secondary deterministic sort by title
    return (a.title ?? "").localeCompare(b.title ?? "", undefined, {
      sensitivity: "base",
      numeric: true,
    });
  });
}
