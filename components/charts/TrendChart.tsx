"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltipContent } from "@/components/charts/ChartTooltip";
import type { TrendPoint } from "@/lib/data/types";

export interface TrendSeries {
  key: string;
  name: string;
  color: string;
}

export interface ThresholdBand {
  y1: number;
  y2: number;
  label?: string;
}

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" };

export function TrendChart({
  data,
  series,
  height = 280,
  unit,
  yDomain,
  thresholdBand,
  xKey = "date",
  labelFormatter,
}: {
  data: Array<TrendPoint | Record<string, number | string>>;
  series: TrendSeries[];
  height?: number;
  unit?: string;
  yDomain?: [number | "auto", number | "auto"];
  thresholdBand?: ThresholdBand;
  xKey?: string;
  labelFormatter?: (label: string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
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
          domain={yDomain}
          width={44}
        />
        {thresholdBand && (
          <ReferenceArea
            y1={thresholdBand.y1}
            y2={thresholdBand.y2}
            fill="var(--success)"
            fillOpacity={0.1}
            stroke="var(--success)"
            strokeOpacity={0.3}
            strokeDasharray="4 4"
          />
        )}
        <Tooltip
          content={<ChartTooltipContent unit={unit} labelFormatter={labelFormatter} />}
          cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
