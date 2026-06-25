import { cn } from "@/lib/utils/cn";

/**
 * Lumenore brand logo — faithful rendition of the official mark:
 * a blue→teal gradient "L" with the LUMENORE wordmark and the
 * "Netlink's Flagship AI Product" tagline. Theme-aware (the wordmark adapts
 * to light/dark), with `mark` / `wordmark` / `full` layouts via `collapsed`.
 */

export function LumenoreMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Lumenore" fill="none">
      <defs>
        <linearGradient id="lumenore-mark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9FB8EA" />
          <stop offset="100%" stopColor="#58C3D4" />
        </linearGradient>
      </defs>
      {/* horizontal foot */}
      <rect x="9" y="29" width="30" height="11" rx="2" fill="#58C3D4" />
      {/* vertical bar with gradient */}
      <rect x="9" y="5" width="12" height="35" rx="2" fill="url(#lumenore-mark)" />
      {/* corner accent for depth */}
      <rect x="9" y="29" width="12" height="11" rx="2" fill="#3CAFC6" />
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
