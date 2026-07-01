import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** KPI strip skeleton. */
export function KpiStripSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-4 pb-2">
            <Skeleton className="h-3 w-24" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** A single chart card skeleton. */
export function ChartSkeleton({
  className,
  height = 280,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

/** Table skeleton. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function GridSkeleton({
  count = 6,
  className,
  height = 160,
}: {
  count?: number;
  className?: string;
  height?: number;
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="w-full" style={{ height }} />
      ))}
    </div>
  );
}
