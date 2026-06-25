import { cn } from "@/lib/utils/cn";

export type TimelineTone = "default" | "success" | "warning" | "danger" | "info" | "muted";

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  note?: string;
  tone?: TimelineTone;
  badge?: React.ReactNode;
}

const DOT_TONE: Record<TimelineTone, string> = {
  default: "bg-brand-blue border-brand-blue",
  success: "bg-success border-success",
  warning: "bg-warning border-warning",
  danger: "bg-danger border-danger",
  info: "bg-info border-info",
  muted: "bg-muted-foreground border-muted-foreground",
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-1">
      {items.map((item, i) => {
        const tone = item.tone ?? "default";
        const isLast = i === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3 pb-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 size-3 shrink-0 rounded-full border-2 ring-4 ring-background",
                  DOT_TONE[tone],
                )}
              />
              {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.badge}
              </div>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              )}
              {item.timestamp && (
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">{item.timestamp}</p>
              )}
              {item.note && (
                <p className="mt-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {item.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
