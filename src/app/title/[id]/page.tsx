import React from "react";
import Link from "next/link";
import { ArrowLeft, BookmarkPlus, CheckCircle2, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge, WatchStatusType } from "@/components/ui/status-badge";
import { MediaType } from "@/components/title/media-card";
import { formatRating } from "@/lib/utils/format";
import { demoTitles, DemoTitleDefinition } from "@/lib/data/demo-titles";
import { metadataService } from "@/lib/metadata";
import { CastMemberItem, CastPreview } from "@/components/title/cast-preview";
import { MetadataPanel } from "@/components/title/metadata-panel";
import { TitleHero } from "@/components/title/title-hero";

interface TitleDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ResolvedTitleData {
  id: string;
  externalSource: "tmdb" | "anilist";
  externalId: string;
  title: string;
  originalTitle?: string | null;
  type: MediaType;
  year?: number | null;
  releaseDate?: string | null;
  overview?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  genres: string[];
  runtime?: number | null;
  statusText?: string | null;
  voteAverage?: number | null;
  voteCount?: number | null;
  director?: string | null;
  studios?: string[] | null;
  trailerUrl?: string | null;
  cast?: CastMemberItem[];
  totalEpisodes?: number | null;
  userStatus?: WatchStatusType | null;
  userRating?: number | null;
  season?: number | null;
  episode?: number | null;
  currentEpisode?: number | null;
  seasons?: Array<{
    seasonNumber: number;
    name: string;
    episodeCount: number;
    episodes?: Array<{
      episodeNumber: number;
      name: string;
      runtime?: number | null;
    }>;
  }>;
}

// Helper to find a title in local demo titles
function findDemoTitleById(decodedId: string): DemoTitleDefinition | null {
  // 1. Direct match with demo-ID pattern: demo-{source}-{externalId}
  if (decodedId.startsWith("demo-")) {
    const parts = decodedId.replace("demo-", "").split("-");
    const source = parts[0];
    const externalId = parts.slice(1).join("-");
    const found = demoTitles.find(
      (t) => t.externalSource === source && t.externalId === externalId,
    );
    if (found) return found;
  }

  // 2. Match by externalId or title slug
  const directMatch = demoTitles.find(
    (t) =>
      t.externalId === decodedId ||
      t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === decodedId.toLowerCase(),
  );
  if (directMatch) return directMatch;

  // 3. Fallback to first title matching case-insensitive title name
  return demoTitles.find((t) => t.title.toLowerCase() === decodedId.toLowerCase()) || null;
}

// Unified resolver for demo titles, external IDs, and search navigation
async function resolveTitleDetails(id: string): Promise<ResolvedTitleData | null> {
  const decodedId = decodeURIComponent(id).trim();

  // 1. Check in demo titles first (fast local shelf data)
  const demo = findDemoTitleById(decodedId);
  if (demo) {
    return {
      id: `demo-${demo.externalSource}-${demo.externalId}`,
      externalSource: demo.externalSource,
      externalId: demo.externalId,
      title: demo.title,
      originalTitle: demo.originalTitle || null,
      type: demo.type,
      year: demo.year,
      releaseDate: demo.releaseDate || null,
      overview: demo.overview,
      posterUrl: demo.posterUrl,
      backdropUrl: demo.backdropUrl || null,
      genres: demo.genres,
      runtime: demo.runtime || null,
      statusText: demo.statusText || null,
      voteAverage: demo.voteAverage || null,
      voteCount: demo.voteCount || null,
      director: demo.director || null,
      studios: demo.studios || null,
      trailerUrl: demo.trailerUrl || null,
      cast: demo.cast || [],
      totalEpisodes: demo.totalEpisodes || (demo.seasons ? demo.seasons[0]?.episodeCount : 1),
      userStatus: demo.status,
      userRating: demo.rating,
      season: demo.season,
      episode: demo.episode,
      currentEpisode: demo.currentEpisode,
      seasons: demo.seasons,
    };
  }

  // 2. Parse external provider key (e.g. "tmdb:27205", "tmdb-27205", "anilist:16498")
  let source: "tmdb" | "anilist" | null = null;
  let externalId: string | null = null;

  if (decodedId.startsWith("tmdb:") || decodedId.startsWith("tmdb-")) {
    source = "tmdb";
    externalId = decodedId.replace(/^tmdb[:-]/, "");
  } else if (decodedId.startsWith("anilist:") || decodedId.startsWith("anilist-")) {
    source = "anilist";
    externalId = decodedId.replace(/^anilist[:-]/, "");
  }

  if (source && externalId) {
    try {
      const mediaResult = await metadataService.getTitleDetails(source, externalId);
      if (mediaResult) {
        const shelfMatch = demoTitles.find(
          (t) => t.externalSource === source && t.externalId === externalId,
        );

        return {
          id: mediaResult.id,
          externalSource: mediaResult.externalSource,
          externalId: mediaResult.externalId,
          title: mediaResult.title,
          originalTitle: mediaResult.originalTitle || null,
          type: mediaResult.type,
          year: mediaResult.year || null,
          releaseDate: mediaResult.releaseDate || null,
          overview: mediaResult.overview || null,
          posterUrl: mediaResult.posterUrl || null,
          backdropUrl: mediaResult.backdropUrl || null,
          genres: mediaResult.genres,
          runtime: mediaResult.runtime || null,
          statusText: mediaResult.status || null,
          voteAverage: mediaResult.voteAverage || null,
          voteCount: mediaResult.voteCount || null,
          director: mediaResult.director || null,
          studios: mediaResult.studios || null,
          trailerUrl: mediaResult.trailerUrl || null,
          cast: mediaResult.cast || [],
          totalEpisodes: mediaResult.totalEpisodes || null,
          userStatus: shelfMatch?.status || null,
          userRating: shelfMatch?.rating || null,
          season: shelfMatch?.season || null,
          episode: shelfMatch?.episode || null,
          currentEpisode: shelfMatch?.currentEpisode || null,
          seasons: mediaResult.seasons,
        };
      }
    } catch (err) {
      console.error("[TitleDetailPage] Failed to fetch external metadata:", err);
    }
  }

  return null;
}

export default async function TitleDetailPage({ params }: TitleDetailPageProps) {
  const { id } = await params;
  const titleData = await resolveTitleDetails(id);

  if (!titleData) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <div className="glass-2 rounded-2xl p-8 max-w-md mx-auto space-y-4">
            <h1 className="text-xl font-display font-bold text-ink">Title Not Found</h1>
            <p className="text-sm text-ink-muted">
              We couldn&apos;t locate the requested title (&quot;{decodeURIComponent(id)}&quot;) in
              your library or external catalogs.
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-medium text-sm hover:opacity-95 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Library
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Navigation back to library */}
        <div>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-elevated/40"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Library
          </Link>
        </div>

        {/* 1. Hero Title Section (Section 8.3 & Page 38) */}
        <TitleHero
          title={titleData.title}
          type={titleData.type}
          year={titleData.year}
          releaseDate={titleData.releaseDate}
          overview={titleData.overview}
          posterUrl={titleData.posterUrl}
          backdropUrl={titleData.backdropUrl}
          genres={titleData.genres}
          runtime={titleData.runtime}
          totalEpisodes={titleData.totalEpisodes}
          status={titleData.userStatus}
          rating={titleData.userRating}
          voteAverage={titleData.voteAverage}
        />

        {/* 2. Your Shelf Panel (Section 10.4 & Page 38) */}
        <section
          aria-labelledby="your-shelf-heading"
          className="glass-1 rounded-[24px] p-5 sm:p-6 border border-white/10 shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2
              id="your-shelf-heading"
              className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Your Shelf
            </h2>
            {titleData.userStatus ? (
              <span className="text-xs text-ink-muted font-medium">Currently tracked</span>
            ) : (
              <span className="text-xs text-ink-muted font-medium">Not on your shelf yet</span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              {titleData.userStatus ? (
                <>
                  <StatusBadge status={titleData.userStatus} />
                  {titleData.userRating != null && titleData.userRating > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-amber-500" aria-hidden="true" />
                      {formatRating(titleData.userRating)}
                    </span>
                  )}
                  {titleData.currentEpisode != null && titleData.currentEpisode > 0 && (
                    <span className="text-xs text-ink-muted font-mono font-medium">
                      Progress: S{titleData.season || 1} E{titleData.currentEpisode}
                    </span>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent-fill text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />+ Plan to Watch
                </button>
              )}
            </div>

            <div className="text-xs text-ink-muted">
              {titleData.userStatus
                ? "Quick status updates available below"
                : "Save this title to begin tracking"}
            </div>
          </div>
        </section>

        {/* 3. Cast Preview Section (Section 10.4) */}
        <CastPreview cast={titleData.cast} />

        {/* 4. Metadata Overview Panel (Section 10.4 & 8.6) */}
        <MetadataPanel
          originalTitle={titleData.originalTitle}
          director={titleData.director}
          studios={titleData.studios}
          releaseDate={titleData.releaseDate}
          runtime={titleData.runtime}
          status={titleData.statusText}
          voteAverage={titleData.voteAverage}
          voteCount={titleData.voteCount}
          externalSource={titleData.externalSource}
          externalId={titleData.externalId}
          trailerUrl={titleData.trailerUrl}
        />

        {/* 5. Seasons & Episodes Breakdown (if available) */}
        {titleData.seasons && titleData.seasons.length > 0 && (
          <section
            aria-labelledby="episodes-heading"
            className="glass-2 rounded-[24px] p-6 space-y-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <h2
                id="episodes-heading"
                className="text-base sm:text-lg font-display font-bold text-ink"
              >
                Seasons &amp; Episodes ({titleData.seasons[0].episodeCount} episodes)
              </h2>
              <span className="text-xs text-ink-muted font-medium">
                Season {titleData.seasons[0].seasonNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {titleData.seasons[0].episodes?.map((ep) => (
                <div
                  key={ep.episodeNumber}
                  className="glass-1 rounded-xl p-3 flex items-center justify-between border border-white/5 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/10">
                      EP {ep.episodeNumber}
                    </span>
                    <span className="truncate text-ink font-medium">{ep.name}</span>
                  </div>
                  {ep.runtime && (
                    <span className="text-xs text-ink-muted shrink-0 pl-2">{ep.runtime}m</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Roadmap Notice for Day 19/20 */}
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3 text-xs sm:text-sm text-ink-soft">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          <span>
            <strong>Week 3 Roadmap Notice:</strong> Interactive season selector, progress bars, and
            one-click episode tracking mutations are scheduled for <strong>Days 19–20</strong>.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
