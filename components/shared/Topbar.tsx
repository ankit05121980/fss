"use client";

import { ChevronDown, LogOut, PanelLeft, Settings, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AlertsDrawer } from "@/components/shared/AlertsDrawer";
import { GuidedTour } from "@/components/shared/GuidedTour";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { fmtDateTime, DEMO_NOW } from "@/lib/utils/date";

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
        <CommandPalette />
        <GuidedTour />
        <AlertsDrawer />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="border-border bg-background hover:bg-accent ml-1 flex items-center gap-2 rounded-md border px-2 py-1 transition-colors"
              aria-label="Account menu"
            >
              <Avatar className="size-7">
                <AvatarFallback>FS</AvatarFallback>
              </Avatar>
              <div className="hidden leading-tight lg:block">
                <p className="text-foreground text-xs font-semibold">Frontier Scientific</p>
                <p className="text-muted-foreground text-[10px]">Compliance Team</p>
              </div>
              <ChevronDown className="text-muted-foreground hidden size-3.5 lg:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold text-foreground">Frontier Scientific Solutions</p>
              <p className="text-xs font-normal text-muted-foreground">compliance@fss.example · Admin</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Environment
              </p>
              <p className="mt-0.5 text-xs text-foreground">Demo environment — representative data</p>
              <p className="text-[11px] text-muted-foreground">
                Data as of {fmtDateTime(DEMO_NOW.toISOString())} UTC
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
