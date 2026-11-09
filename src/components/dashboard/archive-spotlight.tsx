import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ContinueWatchingItem, RecentlyWatchedItem } from "@/lib/dashboard";
import { ArchiveImage } from "@/components/ui/archive-image";
import { formatMediaType } from "@/lib/utils/format";

export function ArchiveSpotlight({
  watching,
  recent,
}: {
  watching: ContinueWatchingItem[];
  recent: RecentlyWatchedItem[];
}) {
  const active = watching.find((item) => item.nextUp && item.totalEpisodes > 0) ?? watching[0];
  const item = active ?? recent[0];
  if (!item) return null;
  const next = active && active.totalEpisodes > 0 ? active.nextUp : null;
  const target =
    item.id.startsWith("demo-") || item.id.startsWith("cw-")
      ? `${item.externalSource}-${item.externalId}`
      : item.id.startsWith("db-")
        ? item.id
        : `db-${item.id}`;
  const href = `/title/${target}?${next ? `season=${next.seasonNumber}&` : ""}type=${item.type}`;
  return (
    <section
      aria-label="From your personal archive"
      className="artwork-stage spotlight spotlight-reveal"
    >
      <ArchiveImage
        src={item.backdropUrl}
        alt=""
        sizes="(max-width: 767px) 100vw, 75vw"
        priority
        decorative
      />
      <div className="artwork-scrim" aria-hidden="true" />
      <div className="spotlight-content">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#dfa16f] font-semibold mb-5">
          {active ? "Where you left off" : "From your archive"}
        </p>
        <p className="text-xs text-[#c5c9cb] mb-3">
          {formatMediaType(item.type)}
          {item.year ? ` / ${item.year}` : ""}
        </p>
        <h2 className="editorial text-[clamp(2rem,4vw,3.8rem)] max-w-[15ch] mb-5">{item.title}</h2>
        {active && active.totalEpisodes > 0 && (
          <p className="text-sm tabular-nums text-[#c5c9cb] mb-6">
            {active.watchedEpisodes} of {active.totalEpisodes} episodes recorded
          </p>
        )}
        <Link href={href} className="archive-action archive-action-primary">
          {next
            ? `Continue S${next.seasonNumber} E${next.episodeNumber}`
            : active
              ? "View progress"
              : "Revisit this title"}
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
      {item.posterUrl && (
        <div
          className="spotlight-poster overflow-hidden rounded-lg hidden md:block"
          aria-hidden="true"
        >
          <ArchiveImage src={item.posterUrl} alt={item.title} sizes="150px" />
        </div>
      )}
    </section>
  );
}
