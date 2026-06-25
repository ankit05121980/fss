"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltipContent } from "@/components/charts/ChartTooltip";
import { CHART_COLORS } from "@/lib/utils/constants";
import type { NamedValue } from "@/lib/data/types";

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" };

export function BarCompare({
  data,
  height = 280,
  layout = "horizontal",
  unit,
  color,
  colorByIndex = false,
  barName = "Value",
}: {
  data: NamedValue[];
  height?: number;
  layout?: "horizontal" | "vertical";
  unit?: string;
  color?: string;
  colorByIndex?: boolean;
  barName?: string;
}) {
  const fill = color ?? "var(--brand-blue)";

  if (layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            width={130}
          />
          <Tooltip
            content={<ChartTooltipContent unit={unit} />}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar dataKey="value" name={barName} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={colorByIndex ? CHART_COLORS[i % CHART_COLORS.length] : fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          interval={0}
          angle={data.length > 6 ? -20 : 0}
          textAnchor={data.length > 6 ? "end" : "middle"}
          height={data.length > 6 ? 60 : 30}
        />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<ChartTooltipContent unit={unit} />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" name={barName} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={colorByIndex ? CHART_COLORS[i % CHART_COLORS.length] : fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
