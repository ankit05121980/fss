"use client";

interface TooltipPayloadEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  unit?: string;
  labelFormatter?: (label: string) => string;
}

/**
 * Theme-aware tooltip content for Recharts charts. Typed loosely to remain
 * compatible across Recharts minor versions (the `content` render prop passes
 * an internal payload shape).
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  unit,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const heading =
    label != null ? (labelFormatter ? labelFormatter(String(label)) : String(label)) : undefined;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {heading && <p className="mb-1 font-semibold text-popover-foreground">{heading}</p>}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: entry.color ?? "var(--brand-blue)" }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums text-popover-foreground">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
              {unit ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
