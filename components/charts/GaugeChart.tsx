"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

function toneFor(value: number): string {
  if (value >= 85) return "var(--success)";
  if (value >= 70) return "var(--info)";
  if (value >= 50) return "var(--warning)";
  return "var(--danger)";
}

export function GaugeChart({
  value,
  label,
  height = 200,
}: {
  value: number;
  label?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const data = [{ name: "score", value: clamped, fill: toneFor(clamped) }];

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={210}
          endAngle={-30}
          barSize={18}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: "var(--muted)" }}
            dataKey="value"
            cornerRadius={10}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-foreground">{Math.round(clamped)}</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
