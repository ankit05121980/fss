import { cn } from "@/lib/utils/cn";
import { KpiCard, type KpiCardProps } from "@/components/charts/KpiCard";

// Pre-defined responsive grid templates keyed by KPI count so Tailwind can
// statically detect the classes (no dynamic class names).
const GRID_BY_COUNT: Record<number, string> = {
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  7: "grid-cols-2 md:grid-cols-4 xl:grid-cols-7",
};

export function KpiStrip({
  items,
  className,
  dataFlow,
}: {
  items: KpiCardProps[];
  className?: string;
  dataFlow?: string;
}) {
  const grid = GRID_BY_COUNT[items.length] ?? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  return (
    <div className={cn("grid gap-4", grid, className)} data-flow={dataFlow}>

      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}
