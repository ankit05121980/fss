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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
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

        <div className="ml-1 hidden items-center gap-2 rounded-md border border-border bg-background px-2 py-1 lg:flex">
          <Avatar className="size-7">
            <AvatarFallback>FS</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-foreground">Frontier Scientific</p>
            <p className="text-[10px] text-muted-foreground">Compliance Team</p>
          </div>
        </div>
      </div>
    </header>
  );
}
