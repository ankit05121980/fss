import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-muted/30 flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <span className="bg-secondary text-secondary-foreground mb-3 flex size-11 items-center justify-center rounded-full">
        <Icon className="size-5" />
      </span>
      <p className="text-foreground text-sm font-semibold">{title}</p>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
