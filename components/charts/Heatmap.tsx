"use client";

import { cn } from "@/lib/utils/cn";
import { RISK_TYPE_META, SEVERITY_META } from "@/lib/utils/constants";
import type { HeatmapCell, RiskType, Severity } from "@/lib/data/types";

const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH"];

/**
 * Risk heatmap: risk category (rows) x severity (columns).
 * Cell background intensity scales with count; severity sets the hue.
 */
export function Heatmap({ cells }: { cells: HeatmapCell[] }) {
  const categories = Array.from(new Set(cells.map((c) => c.category))) as RiskType[];
  const max = Math.max(1, ...cells.map((c) => c.count));

  const lookup = new Map<string, number>();
  for (const c of cells) lookup.set(`${c.category}|${c.severity}`, c.count);

  const hue: Record<Severity, string> = {
    LOW: "46, 125, 50", // success
    MEDIUM: "237, 108, 2", // warning
    HIGH: "198, 40, 40", // danger
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        <div className="grid grid-cols-[170px_repeat(3,1fr)] gap-1.5">
          <div />
          {SEVERITIES.map((s) => (
            <div key={s} className="pb-1 text-center text-xs font-semibold text-muted-foreground">
              {SEVERITY_META[s].label}
            </div>
          ))}
          {categories.map((cat) => (
            <div key={cat} className="contents">
              <div className="flex items-center pr-2 text-xs font-medium text-foreground">
                {RISK_TYPE_META[cat].label}
              </div>
              {SEVERITIES.map((sev) => {
                const count = lookup.get(`${cat}|${sev}`) ?? 0;
                const intensity = count === 0 ? 0 : 0.18 + (count / max) * 0.72;
                return (
                  <div
                    key={`${cat}-${sev}`}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-md border border-border text-sm font-semibold tabular-nums",
                      count === 0 ? "text-muted-foreground" : "text-white",
                    )}
                    style={{
                      backgroundColor:
                        count === 0 ? "var(--muted)" : `rgba(${hue[sev]}, ${intensity})`,
                    }}
                    title={`${RISK_TYPE_META[cat].label} · ${SEVERITY_META[sev].label}: ${count}`}
                  >
                    {count}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
