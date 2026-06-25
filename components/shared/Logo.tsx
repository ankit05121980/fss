import { cn } from "@/lib/utils/cn";

/**
 * Lumenore wordmark. The glyph is a stylized beam/lens ("illuminating the
 * supply chain") rendered as an inline SVG so it themes via currentColor.
 */
export function Logo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none">
          <path
            d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-foreground text-base font-bold tracking-tight">Lumenore</span>
          <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
            Supply Chain Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
