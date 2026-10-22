import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WatchStatusType } from "@/components/ui/status-badge";
import { MediaType } from "@/components/title/media-card";
import { formatRating } from "@/lib/utils/format";
import { demoTitles, DemoTitleDefinition } from "@/lib/data/demo-titles";
import { metadataService } from "@/lib/metadata";
import { CastMemberItem, CastPreview } from "@/components/title/cast-preview";
import { MetadataPanel } from "@/components/title/metadata-panel";
import { TitleHero } from "@/components/title/title-hero";
import { SeasonEpisodesSection } from "@/components/title/season-episodes-section";
import { StatusSelector } from "@/components/title/status-selector";
import { RatingControl } from "@/components/title/rating-control";
import { DateTracker } from "@/components/title/date-tracker";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db/retry";
import type { Prisma } from "@prisma/client";
import { getTitleProgressFromDb } from "@/lib/progress";
import { MovieWatchSection, MovieQuickCheckButton } from "@/components/title/movie-watch-section";

type DbTitleRecord = Prisma.TitleGetPayload<{
  include: {
    seasons: {
      include: {
        episodes: true;
      };
    };
    userTitles: true;
  };
}>;

interface TitleDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ type?: string; season?: string }>;
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
  startedAt?: string | null;
  watchedAt?: string | null;
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
      airDate?: string | null;
      overview?: string | null;
      stillUrl?: string | null;
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

  // 2. Composite provider:id or provider-id (e.g. tmdb:27205, tmdb-27205, anilist:16498)
  const compositeMatch = decodedId.match(/^(tmdb|anilist)[:\-](.+)$/i);
  if (compositeMatch) {
    const source = compositeMatch[1].toLowerCase();
    const extId = compositeMatch[2];
    const found = demoTitles.find((t) => t.externalSource === source && t.externalId === extId);
    if (found) return found;
  }

  // 3. Match by externalId or title slug
  const directMatch = demoTitles.find(
    (t) =>
      t.externalId === decodedId ||
      t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === decodedId.toLowerCase(),
  );
  if (directMatch) return directMatch;

  // 4. Fallback to first title matching case-insensitive title name
  return demoTitles.find((t) => t.title.toLowerCase() === decodedId.toLowerCase()) || null;
}

// Unified resolver for demo titles, database titles, external IDs, and search navigation
async function resolveTitleDetails(
  id: string,
  userId?: string | null,
  hintType?: MediaType,
  hintSeason?: number,
): Promise<ResolvedTitleData | null> {
  const decodedId = decodeURIComponent(id).trim();

  // 1. Direct match for demo-prefixed IDs (e.g. "demo-anilist-16498", "demo-tmdb-27205")
  if (decodedId.startsWith("demo-")) {
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
        startedAt: demo.startedAt || null,
        watchedAt: demo.watchedAt || null,
        season: demo.season,
        episode: demo.episode,
        currentEpisode: demo.currentEpisode,
        seasons: demo.seasons,
      };
    }
  }

  // Helper to extract composite source, type, and external ID
  // e.g. "tmdb-tv:5920", "tmdb:tv:5920", "tmdb-movie:5920", "tmdb:5920", "anilist:16498"
  let parsedSource: "tmdb" | "anilist" | null = null;
  let parsedExternalId: string | null = null;
  let inferredType: MediaType | undefined = hintType;

  const typedMatch = decodedId.match(/^(?:demo-)?(tmdb|anilist)[:\-](tv|movie)[:\-](.+)$/i);
  if (typedMatch) {
    parsedSource = typedMatch[1].toLowerCase() as "tmdb" | "anilist";
    inferredType = typedMatch[2].toUpperCase() as MediaType;
    parsedExternalId = typedMatch[3];
  } else {
    const simpleMatch = decodedId.match(/^(?:demo-)?(tmdb|anilist)[:\-](.+)$/i);
    if (simpleMatch) {
      parsedSource = simpleMatch[1].toLowerCase() as "tmdb" | "anilist";
      parsedExternalId = simpleMatch[2];
    }
  }

  // Check demo titles
  const demo = findDemoTitleById(decodedId);
  if (demo && !parsedSource) {
    parsedSource = demo.externalSource;
    parsedExternalId = demo.externalId;
    if (!inferredType) {
      inferredType = demo.type;
    }
  }

  // Check if ID refers to a database record (e.g. "db-cmvc5p3zc0000lqyos10oe8ov" or a cuid)
  let dbTitle: DbTitleRecord | null = null;
  const isDbPrefixed = decodedId.startsWith("db-");
  const rawDbId = decodedId.replace(/^db-/, "");

  if (isDbPrefixed || /^[a-z0-9]{20,32}$/i.test(decodedId)) {
    try {
      dbTitle = await withDbRetry(
        () =>
          prisma.title.findUnique({
            where: { id: rawDbId },
            include: {
              seasons: {
                orderBy: { seasonNumber: "asc" },
                include: {
                  episodes: {
                    orderBy: { episodeNumber: "asc" },
                  },
                },
              },
              userTitles: userId ? { where: { userId } } : true,
            },
          }),
        { label: "resolveTitleDetails:byId" },
      );
    } catch (err) {
      console.warn("[TitleDetailPage] Failed to query database title by id:", err);
    }
  }

  const source = (dbTitle?.externalSource as "tmdb" | "anilist") || parsedSource;
  const externalId = dbTitle?.externalId || parsedExternalId;

  // If we have source & externalId, query DB by externalSource_externalId if not already fetched
  if (source && externalId && !dbTitle) {
    try {
      dbTitle = await withDbRetry(
        () =>
          prisma.title.findUnique({
            where: {
              externalSource_externalId: {
                externalSource: source,
                externalId,
              },
            },
            include: {
              seasons: {
                orderBy: { seasonNumber: "asc" },
                include: {
                  episodes: {
                    orderBy: { episodeNumber: "asc" },
                  },
                },
              },
              userTitles: userId ? { where: { userId } } : true,
            },
          }),
        { label: "resolveTitleDetails:byExternal" },
      );
    } catch {
      // Graceful fallback
    }
  }

  // Calculate effectiveType AFTER dbTitle has been resolved to guarantee TV vs Movie disambiguation
  const effectiveType: MediaType | undefined =
    hintType || (dbTitle?.type as MediaType) || inferredType || (demo?.type as MediaType);

  // Extract real user title data from DB if available
  const userTitle = dbTitle?.userTitles?.[0];
  const userStatus = (userTitle?.status as WatchStatusType) || null;
  const userRating = userTitle?.rating ?? null;
  const startedAt = userTitle?.startedAt ? userTitle.startedAt.toISOString() : null;
  const watchedAt = userTitle?.watchedAt ? userTitle.watchedAt.toISOString() : null;

  if (source && externalId) {
    try {
      const mediaResult = await metadataService.getTitleDetails(source, externalId, effectiveType);
      if (mediaResult) {
        // Auto-heal missing DB poster/metadata if DB title exists and types match
        if (
          dbTitle &&
          mediaResult.type === dbTitle.type &&
          (!dbTitle.posterUrl || !dbTitle.backdropUrl || !dbTitle.overview || !dbTitle.year)
        ) {
          try {
            await prisma.title.update({
              where: { id: dbTitle.id },
              data: {
                posterUrl: mediaResult.posterUrl || dbTitle.posterUrl,
                backdropUrl: mediaResult.backdropUrl || dbTitle.backdropUrl,
                year: mediaResult.year || dbTitle.year,
                overview: mediaResult.overview || dbTitle.overview,
                genres: mediaResult.genres?.length ? mediaResult.genres : dbTitle.genres,
              },
            });
          } catch {
            // Ignore DB update error
          }
        }

        const shelfMatch = demoTitles.find(
          (t) => t.externalSource === source && t.externalId === externalId,
        );

        return {
          id: dbTitle ? `db-${dbTitle.id}` : mediaResult.id,
          externalSource: mediaResult.externalSource,
          externalId: mediaResult.externalId,
          title:
            dbTitle && dbTitle.type === mediaResult.type
              ? mediaResult.title
              : dbTitle?.title || mediaResult.title,
          originalTitle: mediaResult.originalTitle || null,
          type: (dbTitle?.type as MediaType) || mediaResult.type,
          year: mediaResult.year || dbTitle?.year || null,
          releaseDate: mediaResult.releaseDate || null,
          overview: mediaResult.overview || dbTitle?.overview || null,
          posterUrl: mediaResult.posterUrl || dbTitle?.posterUrl || null,
          backdropUrl: mediaResult.backdropUrl || dbTitle?.backdropUrl || null,
          genres: mediaResult.genres.length > 0 ? mediaResult.genres : dbTitle?.genres || [],
          runtime: mediaResult.runtime || null,
          statusText: mediaResult.status || null,
          voteAverage: mediaResult.voteAverage || null,
          voteCount: mediaResult.voteCount || null,
          director: mediaResult.director || null,
          studios: mediaResult.studios || null,
          trailerUrl: mediaResult.trailerUrl || null,
          cast: mediaResult.cast || [],
          totalEpisodes: mediaResult.totalEpisodes || null,
          userStatus: userStatus || shelfMatch?.status || null,
          userRating: userRating != null ? userRating : shelfMatch?.rating || null,
          startedAt: startedAt || shelfMatch?.startedAt || null,
          watchedAt: watchedAt || shelfMatch?.watchedAt || null,
          season: shelfMatch?.season || null,
          episode: shelfMatch?.episode || null,
          currentEpisode: shelfMatch?.currentEpisode || null,
          seasons: await (async () => {
            let seasons = mediaResult.seasons;
            if (
              source === "tmdb" &&
              (effectiveType === "TV" || mediaResult.type === "TV") &&
              seasons &&
              seasons.length > 0
            ) {
              const targetSeasonNum =
                hintSeason && seasons.some((s) => s.seasonNumber === hintSeason)
                  ? hintSeason
                  : shelfMatch?.season || seasons[0].seasonNumber;
              try {
                const seasonDetails = await metadataService.getTvSeason(
                  externalId,
                  targetSeasonNum,
                );
                seasons = seasons.map((s) =>
                  s.seasonNumber === targetSeasonNum ? seasonDetails : s,
                );
              } catch {
                // Keep season summaries if season details unavailable
              }
            }

            // If dbTitle already has persisted episodes for any season, merge them in so user doesn't have to re-fetch
            if (dbTitle?.seasons && dbTitle.seasons.length > 0 && seasons) {
              seasons = seasons.map((s) => {
                const dbSeason = dbTitle!.seasons.find(
                  (dbs) => dbs.seasonNumber === s.seasonNumber,
                );
                if (
                  dbSeason &&
                  dbSeason.episodes &&
                  dbSeason.episodes.length > 0 &&
                  (!s.episodes || s.episodes.length === 0)
                ) {
                  return {
                    ...s,
                    name: s.name || dbSeason.name || `Season ${s.seasonNumber}`,
                    episodes: dbSeason.episodes.map((ep) => ({
                      episodeNumber: ep.episodeNumber,
                      name: ep.name ?? `Episode ${ep.episodeNumber}`,
                      airDate: ep.airDate,
                      runtime: ep.runtime,
                    })),
                  };
                }
                return s;
              });
            }

            return seasons;
          })(),
        };
      }
    } catch (err) {
      console.warn(
        "[TitleDetailPage] External metadata fetch unavailable:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 4. Fallback if external metadata fetch failed or rate-limited: hydrate purely from dbTitle!
  // Fallback to demo title if external metadata failed or offline
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
      userStatus: userStatus || demo.status,
      userRating: userRating != null ? userRating : demo.rating,
      startedAt: startedAt || demo.startedAt || null,
      watchedAt: watchedAt || demo.watchedAt || null,
      season: demo.season,
      episode: demo.episode,
      currentEpisode: demo.currentEpisode,
      seasons: demo.seasons,
    };
  }

  // 4. Fallback if external metadata fetch failed or rate-limited: hydrate purely from dbTitle!
  if (dbTitle) {
    return {
      id: `db-${dbTitle.id}`,
      externalSource: dbTitle.externalSource as "tmdb" | "anilist",
      externalId: dbTitle.externalId,
      title: dbTitle.title,
      type: dbTitle.type as MediaType,
      year: dbTitle.year,
      overview: dbTitle.overview,
      posterUrl: dbTitle.posterUrl,
      backdropUrl: dbTitle.backdropUrl,
      genres: dbTitle.genres,
      userStatus,
      userRating,
      startedAt,
      watchedAt,
      seasons: dbTitle.seasons.map((s) => ({
        seasonNumber: s.seasonNumber,
        name: s.name ?? `Season ${s.seasonNumber}`,
        episodeCount: s.episodeCount,
        episodes: s.episodes.map((ep) => ({
          episodeNumber: ep.episodeNumber,
          name: ep.name ?? `Episode ${ep.episodeNumber}`,
          airDate: ep.airDate,
          runtime: ep.runtime,
        })),
      })),
    };
  }

  return null;
}

export default async function TitleDetailPage({ params, searchParams }: TitleDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const hintType = (resolvedSearchParams?.type?.toUpperCase() as MediaType) || undefined;
  const parsedSeason = resolvedSearchParams?.season
    ? parseInt(resolvedSearchParams.season, 10)
    : undefined;
  const hintSeason = !isNaN(Number(parsedSeason)) ? Number(parsedSeason) : undefined;
  const session = await auth();
  const userId = session?.user?.id;
  const titleData = await resolveTitleDetails(id, userId, hintType, hintSeason);

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

  const isMovie =
    titleData.type === "MOVIE" ||
    (titleData.type === "ANIME" &&
      (!titleData.seasons ||
        titleData.seasons.length === 0 ||
        (titleData.seasons.length === 1 && titleData.seasons[0].episodeCount <= 1)));

  const dbProgress = userId
    ? await getTitleProgressFromDb({
        userId,
        externalSource: titleData.externalSource,
        externalId: titleData.externalId,
      })
    : null;

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
              <StatusSelector
                currentStatus={titleData.userStatus}
                titleExternalSource={titleData.externalSource}
                titleExternalId={titleData.externalId}
                titleName={titleData.title}
                mediaType={titleData.type}
                posterUrl={titleData.posterUrl}
                backdropUrl={titleData.backdropUrl}
                year={titleData.year}
                overview={titleData.overview}
              />

              {isMovie && (
                <MovieQuickCheckButton
                  titleExternalSource={titleData.externalSource}
                  titleExternalId={titleData.externalId}
                  titleName={titleData.title}
                  mediaType={titleData.type}
                  year={titleData.year}
                  posterUrl={titleData.posterUrl}
                  backdropUrl={titleData.backdropUrl}
                  overview={titleData.overview}
                  currentStatus={titleData.userStatus}
                />
              )}

              {titleData.userRating != null && titleData.userRating > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-500" aria-hidden="true" />
                  {formatRating(titleData.userRating)}
                </span>
              )}

              {!isMovie &&
                (dbProgress ? (
                  <span className="text-xs text-ink-muted font-mono font-medium">
                    Progress: {dbProgress.watchedEpisodes} / {dbProgress.totalEpisodes} eps (
                    {dbProgress.percentage}%)
                  </span>
                ) : titleData.currentEpisode != null && titleData.currentEpisode > 0 ? (
                  <span className="text-xs text-ink-muted font-mono font-medium">
                    Progress: S{titleData.season || 1} E{titleData.currentEpisode}
                  </span>
                ) : null)}
            </div>

            <div className="text-xs text-ink-muted">
              {titleData.userStatus
                ? "Click status to change or untrack"
                : "Save this title to begin tracking"}
            </div>
          </div>

          {/* Interactive Rating Control (Day 24, Spec Section 9.8) */}
          <div className="pt-3 border-t border-white/5">
            <RatingControl
              currentRating={titleData.userRating}
              titleExternalSource={titleData.externalSource}
              titleExternalId={titleData.externalId}
              titleName={titleData.title}
              mediaType={titleData.type}
            />
          </div>

          {/* Interactive Date Tracker (Day 25, Spec P14 & Roadmap) */}
          <div className="pt-3 border-t border-white/5">
            <DateTracker
              startedAt={titleData.startedAt}
              watchedAt={titleData.watchedAt}
              titleExternalSource={titleData.externalSource}
              titleExternalId={titleData.externalId}
              titleName={titleData.title}
              mediaType={titleData.type}
              status={titleData.userStatus}
            />
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

        {/* 5. Watch Tracking Section: Seasons & Episodes (for TV/Series) or Dedicated Movie Watch Section (for Movies/Anime Movies) */}
        {isMovie ? (
          <MovieWatchSection
            titleExternalSource={titleData.externalSource}
            titleExternalId={titleData.externalId}
            titleName={titleData.title}
            mediaType={titleData.type}
            year={titleData.year}
            runtime={titleData.runtime}
            posterUrl={titleData.posterUrl}
            backdropUrl={titleData.backdropUrl}
            overview={titleData.overview}
            currentStatus={titleData.userStatus}
            watchedAt={titleData.watchedAt}
          />
        ) : (
          <SeasonEpisodesSection
            seasons={titleData.seasons || []}
            userCurrentSeason={hintSeason ?? dbProgress?.defaultSeasonNumber ?? titleData.season}
            userCurrentEpisode={
              dbProgress?.nextUp?.episodeNumber ?? titleData.currentEpisode ?? titleData.episode
            }
            titleExternalSource={titleData.externalSource}
            titleExternalId={titleData.externalId}
            titleName={titleData.title}
            mediaType={titleData.type}
          />
        )}
      </div>
    </AppShell>
  );
}
