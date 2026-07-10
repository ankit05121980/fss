import { cn } from "@/lib/utils/cn";

/**
 * Lumenore lockup used in the "powered by" line: a gradient "L" mark, the
 * LUMENORE wordmark, and a small gradient "AI" badge. Theme-aware; scales with
 * the `className` height/font utilities from the caller.
 */
export function LumenoreLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[3px] leading-none", className)}>
      <svg viewBox="0 0 26 32" className="h-[1.15em] w-auto" aria-hidden="true" fill="none">
        <defs>
          <linearGradient id="lumenore-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9FB8EA" />
            <stop offset="100%" stopColor="#59C4D4" />
          </linearGradient>
        </defs>
        {/* vertical bar */}
        <rect x="4" y="1" width="8" height="22" rx="1" fill="url(#lumenore-l)" />
        {/* left highlight edge */}
        <rect x="4" y="1" width="2.4" height="22" rx="1" fill="#AEBAF2" />
        {/* foot */}
        <rect x="4" y="22" width="18" height="8" rx="1" fill="#7FD6DF" />
        {/* corner bevel */}
        <polygon points="4,22 12,22 4,30" fill="#3FB0C4" />
      </svg>
      <span className="font-semibold tracking-[0.14em] text-[#3E4A5C] dark:text-slate-200">
        LUMENORE
      </span>
      <span className="ml-[1px] inline-flex items-center rounded-[3px] bg-gradient-to-br from-[#3AB4F0] to-[#9B5DE5] px-[3px] py-[1px] text-[0.62em] font-bold leading-none text-white">
        AI
      </span>
    </span>
  );
}
