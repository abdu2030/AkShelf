import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Calendar, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge, WatchStatusType } from "@/components/ui/status-badge";
import { MediaTypeIcon, MediaType } from "@/components/title/media-card";
import { formatMediaType, formatRating } from "@/lib/utils/format";
import { demoTitles, DemoTitleDefinition } from "@/lib/data/demo-titles";

interface TitleDetailPageProps {
  params: Promise<{ id: string }>;
}

// Helper to resolve title metadata either by demo ID, external ID, or database ID
function findTitleById(id: string): DemoTitleDefinition | null {
  const decodedId = decodeURIComponent(id);

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

export default async function TitleDetailPage({ params }: TitleDetailPageProps) {
  const { id } = await params;
  const titleData = findTitleById(id);

  if (!titleData) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <div className="glass-2 rounded-2xl p-8 max-w-md mx-auto space-y-4">
            <h1 className="text-xl font-display font-bold text-ink">Title Not Found</h1>
            <p className="text-sm text-ink-muted">
              We couldn&apos;t locate the requested title (&quot;{decodeURIComponent(id)}&quot;) in
              your library.
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

  const mediaType: MediaType = titleData.type;
  const watchStatus: WatchStatusType = titleData.status;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
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

        {/* Hero Title Section */}
        <div className="glass-2 rounded-[24px] p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start relative z-10">
            {/* 2:3 Aspect Ratio Poster */}
            <div className="relative aspect-[2/3] w-40 sm:w-56 shrink-0 rounded-2xl overflow-hidden glass-1 shadow-2xl border border-white/10 mx-auto sm:mx-0">
              {titleData.posterUrl ? (
                <Image
                  src={titleData.posterUrl}
                  alt={titleData.title}
                  fill
                  sizes="(max-width: 640px) 160px, 224px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-indigo-950/60 to-purple-950/60 text-ink-muted">
                  <MediaTypeIcon type={mediaType} className="w-10 h-10 mb-2 opacity-60" />
                  <span className="text-xs font-medium">{titleData.title}</span>
                </div>
              )}
            </div>

            {/* Title Metadata & Details */}
            <div className="flex-1 space-y-4 text-left">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-elevated text-ink-muted border border-white/10">
                    <MediaTypeIcon type={mediaType} className="w-3.5 h-3.5 text-accent" />
                    {formatMediaType(mediaType)}
                  </span>
                  <StatusBadge status={watchStatus} />
                  {titleData.rating && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-amber-500" aria-hidden="true" />
                      {formatRating(titleData.rating)}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-display font-bold text-ink tracking-tight">
                  {titleData.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-ink-muted font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-ink-muted/80" aria-hidden="true" />
                    {titleData.year}
                  </span>
                  {titleData.totalEpisodes && <span>• {titleData.totalEpisodes} Episodes</span>}
                </div>
              </div>

              {/* Genres */}
              {titleData.genres && titleData.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {titleData.genres.map((genre) => (
                    <span
                      key={genre}
                      className="text-xs px-2.5 py-1 rounded-lg bg-surface-elevated/60 text-ink-muted border border-white/5 font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview / Synopsis */}
              <div className="pt-2">
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Overview
                </h2>
                <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-2xl">
                  {titleData.overview}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seasons & Episodes Breakdown (if available) */}
        {titleData.seasons && titleData.seasons.length > 0 && (
          <div className="glass-2 rounded-[20px] p-6 space-y-4 border border-white/10">
            <h2 className="text-lg font-display font-bold text-ink">
              Seasons &amp; Episodes ({titleData.seasons[0].episodeCount} episodes)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {titleData.seasons[0].episodes.map((ep) => (
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
          </div>
        )}

        {/* Roadmap notice for Week 3 */}
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3 text-xs sm:text-sm text-ink-soft">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          <span>
            <strong>Week 3 Roadmap Notice:</strong> Title detail views with live external API sync
            (TMDB &amp; AniList GraphQL) and interactive episode tracking checkmarks are scheduled
            for implementation in <strong>Week 3 (Days 15–20)</strong>.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
