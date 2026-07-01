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
    <div className="border-border bg-popover rounded-md border px-3 py-2 text-xs shadow-md">
      {heading && <p className="text-popover-foreground mb-1 font-semibold">{heading}</p>}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: entry.color ?? "var(--brand-blue)" }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="text-popover-foreground ml-auto font-medium tabular-nums">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
              {unit ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
