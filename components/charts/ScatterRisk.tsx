"use client";

import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import type { PartnerRiskPoint } from "@/lib/data/types";

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" };

function colorFor(p: PartnerRiskPoint): string {
  if (p.auth === "UNAUTHORIZED" || p.license === "EXPIRED") return "var(--danger)";
  if (p.riskScore >= 60 || p.license === "EXPIRING_SOON") return "var(--warning)";
  return "var(--success)";
}

interface ScatterTooltipPayload {
  payload: PartnerRiskPoint;
}

function PartnerTooltip({ active, payload }: { active?: boolean; payload?: ScatterTooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-popover-foreground">{p.name}</p>
      <p className="text-muted-foreground">Risk score: {p.riskScore}</p>
      <p className="text-muted-foreground">Shipment volume: {p.volume}</p>
      <p className="text-muted-foreground">
        {p.auth} · {p.license}
      </p>
    </div>
  );
}

export function ScatterRisk({ data, height = 320 }: { data: PartnerRiskPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 12, right: 16, bottom: 16, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          type="number"
          dataKey="volume"
          name="Volume"
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          label={{
            value: "Shipment volume",
            position: "insideBottom",
            offset: -8,
            fontSize: 11,
            fill: "var(--muted-foreground)",
          }}
        />
        <YAxis
          type="number"
          dataKey="riskScore"
          name="Risk"
          domain={[0, 100]}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={40}
          label={{
            value: "Risk score",
            angle: -90,
            position: "insideLeft",
            fontSize: 11,
            fill: "var(--muted-foreground)",
          }}
        />
        <ZAxis type="number" range={[80, 80]} />
        <Tooltip content={<PartnerTooltip />} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={data} isAnimationActive={false}>
          {data.map((p) => (
            <Cell key={p.partnerId} fill={colorFor(p)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
