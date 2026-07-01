"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/Sparkline";

export type KpiStatus = "success" | "warning" | "danger" | "info" | "neutral";

const STATUS_RING: Record<KpiStatus, string> = {
  success: "before:bg-success",
  warning: "before:bg-warning",
  danger: "before:bg-danger",
  info: "before:bg-info",
  neutral: "before:bg-brand-blue",
};

const STATUS_SPARK: Record<KpiStatus, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  neutral: "var(--brand-blue)",
};

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: { value: number; direction: "up" | "down" | "flat"; goodWhenUp?: boolean };
  sparkline?: number[];
  status?: KpiStatus;
  icon?: LucideIcon;
  href?: string;
  hint?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  sparkline,
  status = "neutral",
  icon: Icon,
  href,
  hint,
}: KpiCardProps) {
  const deltaTone = (() => {
    if (!delta || delta.direction === "flat") return "text-muted-foreground";
    const good = (delta.goodWhenUp ?? true) ? delta.direction === "up" : delta.direction === "down";
    return good ? "text-success" : "text-danger";
  })();

  const DeltaIcon =
    delta?.direction === "up"
      ? ArrowUpRight
      : delta?.direction === "down"
        ? ArrowDownRight
        : ArrowRight;

  const inner = (
    <Card
      className={cn(
        "relative h-full overflow-hidden p-4 transition-shadow",
        "before:absolute before:top-0 before:left-0 before:h-full before:w-1 before:content-['']",
        STATUS_RING[status],
        href && "cursor-pointer hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        {Icon && <Icon className="text-muted-foreground size-4 shrink-0" />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-foreground text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          {delta && (
            <p className={cn("mt-1 flex items-center gap-0.5 text-xs font-medium", deltaTone)}>
              <DeltaIcon className="size-3.5" />
              {Math.abs(delta.value)}
              {hint ? <span className="text-muted-foreground ml-1">{hint}</span> : null}
            </p>
          )}
          {!delta && hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="h-9 w-20 shrink-0">
            <Sparkline data={sparkline} color={STATUS_SPARK[status]} />
          </div>
        )}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:ring-ring block focus-visible:rounded-xl focus-visible:ring-2 focus-visible:outline-none"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
