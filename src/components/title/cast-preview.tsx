import React from "react";
import Image from "next/image";
import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CastMemberItem {
  id: string | number;
  name: string;
  character?: string | null;
  image?: string | null;
  order?: number;
}

export interface CastPreviewProps {
  cast?: CastMemberItem[];
  className?: string;
}

/**
 * CastPreview renders a responsive horizontal scroll track of actor/character cards
 * matching UI spec section 10.4 and page 38.
 */
export function CastPreview({ cast = [], className }: CastPreviewProps) {
  if (!cast || cast.length === 0) {
    return (
      <div
        className={cn(
          "glass-2 rounded-2xl p-5 border border-white/10 text-center text-ink-muted text-xs sm:text-sm space-y-1.5",
          className,
        )}
      >
        <Users className="w-5 h-5 mx-auto text-ink-muted/60 mb-1" aria-hidden="true" />
        <p className="font-medium">No cast information available for this title.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="cast-section-heading" className={cn("space-y-3.5", className)}>
      <div className="flex items-center justify-between px-1">
        <h2
          id="cast-section-heading"
          className="text-base sm:text-lg font-display font-bold text-ink tracking-tight flex items-center gap-2"
        >
          <Users className="w-4 h-4 text-accent" aria-hidden="true" />
          Cast &amp; Characters
        </h2>
        <span className="text-xs text-ink-muted font-medium">
          {cast.length} {cast.length === 1 ? "member" : "members"}
        </span>
      </div>

      {/* Horizontal scrolling cast member list */}
      <div
        role="region"
        aria-label="Cast member list"
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 -mx-1 px-1 snap-x snap-mandatory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        tabIndex={0}
      >
        {cast.map((member) => (
          <div
            key={member.id}
            className="w-28 sm:w-32 shrink-0 snap-start flex flex-col items-center text-center p-2.5 rounded-2xl glass-1 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 shadow-sm group select-none"
          >
            {/* Avatar image with fallback */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-2.5 bg-surface-elevated/80 border border-white/10 group-hover:border-accent/40 transition-colors shadow-inner flex items-center justify-center shrink-0">
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 64px, 80px"
                  className="object-cover"
                />
              ) : (
                <User className="w-7 h-7 sm:w-8 sm:h-8 text-ink-muted/60" aria-hidden="true" />
              )}
            </div>

            {/* Actor name */}
            <span
              className="text-xs sm:text-sm font-semibold text-ink line-clamp-1 group-hover:text-accent transition-colors w-full"
              title={member.name}
            >
              {member.name}
            </span>

            {/* Character name */}
            {member.character && (
              <span
                className="text-[11px] sm:text-xs text-ink-muted line-clamp-1 mt-0.5 font-medium w-full"
                title={member.character}
              >
                {member.character}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
