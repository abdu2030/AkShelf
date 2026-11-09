"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

/** A reserved image box remains useful when remote artwork is absent or fails. */
export function ArchiveImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
  decorative = false,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  decorative?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
    if (decorative) return null;
    return (
      <div className="archive-placeholder" role="img" aria-label={`${alt}, artwork unavailable`}>
        <ImageOff className="h-6 w-6 opacity-60" aria-hidden="true" />
        <span className="text-xs leading-relaxed line-clamp-4">{alt}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={decorative ? "" : alt}
      fill
      sizes={sizes}
      preload={priority}
      className={className}
      onError={() => setFailedSrc(src)}
      aria-hidden={decorative || undefined}
    />
  );
}
