"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltipContent } from "@/components/charts/ChartTooltip";
import type { TrendPoint } from "@/lib/data/types";

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" };

export function AreaTrend({
  data,
  dataKey = "value",
  name,
  color = "var(--brand-blue)",
  height = 240,
  xKey = "date",
  unit,
}: {
  data: Array<TrendPoint | Record<string, number | string>>;
  dataKey?: string;
  name: string;
  color?: string;
  height?: number;
  xKey?: string;
  unit?: string;
}) {
  const gradientId = `area-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          minTickGap={24}
        />
        <YAxis
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltipContent unit={unit} />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
