"use client";

import { PanelLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AlertsDrawer } from "@/components/shared/AlertsDrawer";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="shrink-0"
      >
        <PanelLeft className="size-5" />
      </Button>

      <div className="hidden flex-1 md:block">
        <GlobalSearch />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
        <Badge
          variant="warning"
          className="hidden sm:inline-flex"
          title="This environment is powered by realistic demo data"
        >
          POC — Demo Data
        </Badge>

        <AlertsDrawer />
        <ThemeToggle />

        <div className="border-border bg-background ml-1 hidden items-center gap-2 rounded-md border px-2 py-1 lg:flex">
          <Avatar className="size-7">
            <AvatarFallback>FS</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-foreground text-xs font-semibold">Frontier Scientific</p>
            <p className="text-muted-foreground text-[10px]">Compliance Team</p>
          </div>
        </div>
      </div>
    </header>
  );
}
