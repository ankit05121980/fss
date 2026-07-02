"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TemperatureReading } from "@/lib/data/types";
import { fmtDateTime } from "@/lib/utils/date";

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" };

interface TempPoint {
  label: string;
  temperature: number;
  excursion: number | null;
}

function TempTooltip({ active, payload }: { active?: boolean; payload?: { payload: TempPoint }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-popover-foreground">{d.label}</p>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: "var(--brand-blue)" }} />
        <span className="text-muted-foreground">Temperature</span>
        <span className="text-popover-foreground ml-auto font-medium tabular-nums">
          {d.temperature.toFixed(1)}°C
        </span>
      </div>
      {d.excursion !== null && (
        <p className="text-danger mt-1 font-medium">Excursion — outside safe range</p>
      )}
    </div>
  );
}

export interface TempChartProps {
  readings: TemperatureReading[];
  tempMinC: number;
  tempMaxC: number;
  height?: number;
}

/**
 * Cold-chain temperature timeline: line for temperature, shaded safe band
 * (2–8°C), and red excursion markers above the limit.
 */
export function TempChart({ readings, tempMinC, tempMaxC, height = 300 }: TempChartProps) {
  const data = readings.map((r, i) => ({
    i,
    label: fmtDateTime(r.timestamp),
    temperature: r.temperatureC,
    excursion: r.excursion ? r.temperatureC : null,
  }));

  const maxTemp = Math.max(tempMaxC + 2, ...readings.map((r) => r.temperatureC));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="i" tick={false} axisLine={{ stroke: "var(--border)" }} height={10} />
        <YAxis
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, Math.ceil(maxTemp)]}
          unit="°"
        />
        <ReferenceArea
          y1={tempMinC}
          y2={tempMaxC}
          fill="var(--success)"
          fillOpacity={0.12}
          stroke="var(--success)"
          strokeOpacity={0.35}
          strokeDasharray="4 4"
        />
        <Tooltip content={<TempTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey="temperature"
          name="Temperature"
          stroke="var(--brand-blue)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Scatter
          dataKey="excursion"
          name="Excursion"
          fill="var(--danger)"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
