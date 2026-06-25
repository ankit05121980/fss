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
                  "ring-background mt-1 size-3 shrink-0 rounded-full border-2 ring-4",
                  DOT_TONE[tone],
                )}
              />
              {!isLast && <span className="bg-border mt-1 w-px flex-1" />}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-foreground text-sm font-semibold">{item.title}</p>
                {item.badge}
              </div>
              {item.subtitle && <p className="text-muted-foreground text-xs">{item.subtitle}</p>}
              {item.timestamp && (
                <p className="text-muted-foreground mt-0.5 text-xs font-medium">{item.timestamp}</p>
              )}
              {item.note && (
                <p className="bg-muted text-muted-foreground mt-1 rounded-md px-2 py-1 text-xs">
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
