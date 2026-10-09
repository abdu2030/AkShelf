import React from "react";

/**
 * Static Aurora Backdrop (Spec 4.3).
 * Never animated, fixed behind the entire viewport at z-index: -1.
 * Provides the soft color gradients (indigo, violet, teal in dark; indigo, pink, sky in light)
 * that refract through the glass panels.
 */
export function Aurora() {
  return <div className="aurora" aria-hidden="true" />;
}
