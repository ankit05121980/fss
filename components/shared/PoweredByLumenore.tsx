"use client";

import * as React from "react";

import { LumenoreLogo } from "@/components/shared/LumenoreLogo";

// Candidate paths for the official Lumenore logo. Drop the file you provided at
// one of these locations in `public/` and it will be used exactly as-is.
const CANDIDATES = ["/lumenore-logo.svg", "/lumenore-logo.png"];

/**
 * Renders the official Lumenore logo from `public/` exactly as-is (height
 * adjustable via `className`). Falls back to the built-in lockup only if no
 * file is present yet.
 */
export function PoweredByLumenore({ className }: { className?: string }) {
  const [idx, setIdx] = React.useState(0);

  if (idx >= CANDIDATES.length) {
    return <LumenoreLogo className="text-[9px]" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={CANDIDATES[idx]}
      alt="Lumenore AI"
      className={className}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
