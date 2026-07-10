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

  const hasSpark = !!sparkline && sparkline.length > 1;

  const inner = (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden p-4 transition-shadow",
        "before:absolute before:top-0 before:left-0 before:h-full before:w-1 before:content-['']",
        STATUS_RING[status],
        href && "cursor-pointer hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground line-clamp-2 min-h-[2rem] text-[11px] font-medium tracking-wide uppercase">
          {label}
        </p>
        {Icon && <Icon className="text-muted-foreground size-4 shrink-0" />}
      </div>

      <div className="mt-1">
        <p className="text-foreground text-2xl leading-none font-bold tracking-tight tabular-nums">
          {value}
        </p>
        {delta ? (
          <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", deltaTone)}>
            <DeltaIcon className="size-3.5 shrink-0" />
            <span className="tabular-nums">{Math.abs(delta.value)}</span>
            {hint ? <span className="text-muted-foreground truncate">{hint}</span> : null}
          </p>
        ) : hint ? (
          <p className="text-muted-foreground mt-1.5 truncate text-xs">{hint}</p>
        ) : null}
      </div>

      {/* Full-width sparkline pinned to the card bottom so all cards align */}
      {hasSpark && (
        <div className="mt-auto w-full pt-3">
          <Sparkline data={sparkline!} color={STATUS_SPARK[status]} height={28} />
        </div>
      )}
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
