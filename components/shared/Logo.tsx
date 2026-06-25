import { cn } from "@/lib/utils/cn";

/**
 * Lumenore brand logo — faithful rendition of the official mark:
 * a blue→teal gradient "L" with the LUMENORE wordmark and the
 * "Netlink's Flagship AI Product" tagline. Theme-aware (the wordmark adapts
 * to light/dark), with `mark` / `wordmark` / `full` layouts via `collapsed`.
 */

export function LumenoreMark({ className }: { className?: string }) {
  // Faithful rendition of the official "L" app-icon: a 3D-beveled L with a
  // periwinkle upright (lighter left edge) and a teal foot with a darker fold.
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Lumenore" fill="none">
      {/* upright — front face */}
      <rect x="16" y="6" width="9" height="28" rx="1.5" fill="#8C9EEB" />
      {/* upright — left highlight edge (3D) */}
      <rect x="16" y="6" width="2.6" height="28" rx="1.5" fill="#AAB6F1" />
      {/* foot — top face */}
      <rect x="16" y="33" width="20" height="8" rx="1.5" fill="#A4E7E9" />
      {/* corner fold — darker teal bevel */}
      <polygon points="16,33 24,33 16,41" fill="#62C5CE" />
    </svg>
  );
}

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LumenoreMark className="size-8 shrink-0" />
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-[0.18em] text-[#1F3864] dark:text-white">
            LUMEN
            <span className="text-[#5A6B82] dark:text-slate-300">ORE</span>
          </span>
          <span className="mt-1 text-[10px] font-medium tracking-tight text-muted-foreground">
            Netlink&rsquo;s Flagship AI Product
          </span>
        </div>
      )}
    </div>
  );
}
