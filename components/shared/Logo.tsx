import { cn } from "@/lib/utils/cn";
import { PoweredByLumenore } from "@/components/shared/PoweredByLumenore";

/**
 * NetTrace brand logo — a "verified trace" mark (a route/check with an
 * end node) plus the NETTRACE wordmark and the "Netlink's Flagship AI Product"
 * tagline. Theme-aware, with `mark` / full layouts via `collapsed`.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="NetTrace" fill="none">
      <defs>
        <linearGradient id="nettrace-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9FB8EA" />
          <stop offset="100%" stopColor="#58C3D4" />
        </linearGradient>
      </defs>
      {/* traced route ending in a verified check */}
      <path
        d="M8 22 L20 34 L40 9"
        stroke="url(#nettrace-mark)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* origin node */}
      <circle cx="8" cy="22" r="3.6" fill="#9FB8EA" />
      {/* verified end node */}
      <circle cx="40" cy="9" r="4.6" fill="#58C3D4" />
    </svg>
  );
}

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="size-8 shrink-0" />
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-[0.16em] text-[#1F3864] dark:text-white">
            NET
            <span className="text-[#5A6B82] dark:text-slate-300">TRACE</span>
          </span>
          <span className="mt-1 flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
            powered by <PoweredByLumenore className="h-4 w-auto" />
          </span>
        </div>
      )}
    </div>
  );
}
