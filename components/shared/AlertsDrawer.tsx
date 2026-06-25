"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronRight } from "lucide-react";

import { fetchJson } from "@/lib/hooks/api";
import { fromNow } from "@/lib/utils/date";
import { RISK_TYPE_META, SEVERITY_META } from "@/lib/utils/constants";
import type { RiskEvent } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export function AlertsDrawer() {
  const [open, setOpen] = React.useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => fetchJson<RiskEvent[]>("/api/risk-events?resolved=false"),
    enabled: open,
  });

  const count = data?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open alerts" className="relative">
          <Bell className="size-4" />
          {open && count > 0 ? null : (
            <span className="absolute -right-1 -top-1 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="size-4" /> Exception Alerts
            {count > 0 && <Badge variant="danger">{count} open</Badge>}
          </SheetTitle>
          <SheetDescription>
            Open risk events detected across the supply chain.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {isLoading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </>
            )}
            {isError && (
              <EmptyState
                title="Couldn't load alerts"
                description="There was a problem retrieving exception alerts."
              />
            )}
            {!isLoading && !isError && count === 0 && (
              <EmptyState title="No open alerts" description="All exceptions have been resolved." />
            )}
            {!isLoading &&
              !isError &&
              data?.map((event) => {
                const meta = RISK_TYPE_META[event.type];
                const sev = SEVERITY_META[event.severity];
                return (
                  <Link
                    key={event.id}
                    href={`/traceability?q=${event.shipmentId}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-border bg-card p-3 transition-colors hover:border-brand-blue hover:bg-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{event.description}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{event.shipmentId}</span>
                      <span className="flex items-center gap-1">
                        {fromNow(event.timestamp)}
                        <ChevronRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
