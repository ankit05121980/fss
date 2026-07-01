"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronDown, Compass, LogOut, PanelLeft, Settings, UserCircle, UserCog } from "lucide-react";

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
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useFlow } from "@/components/shared/FlowProvider";
import { useRole } from "@/components/shared/RoleProvider";
import { useToast } from "@/components/shared/Toast";
import { ROLE_LIST } from "@/lib/utils/roles";
import { fmtDateTime, DEMO_NOW } from "@/lib/utils/date";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();
  const { start } = useFlow();
  const { role, roleId, setRole } = useRole();
  const { toast } = useToast();

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
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-1.5 sm:inline-flex"
          onClick={() => start(0)}
        >
          <Compass className="size-4" /> Guided flow
        </Button>
        <AlertsDrawer />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="border-border bg-background hover:bg-accent ml-1 flex items-center gap-2 rounded-md border px-2 py-1 transition-colors"
              aria-label="Account menu"
            >
              <Avatar className="size-7">
                <AvatarFallback>{role.initials}</AvatarFallback>
              </Avatar>
              <div className="hidden leading-tight lg:block">
                <p className="text-foreground text-xs font-semibold">{role.person}</p>
                <p className="text-muted-foreground text-[10px]">{role.title}</p>
              </div>
              <ChevronDown className="text-muted-foreground hidden size-3.5 lg:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <p className="text-foreground text-sm font-semibold">{role.person}</p>
              <p className="text-muted-foreground text-xs font-normal">
                {role.title} · Frontier Scientific
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
              <UserCog className="size-3.5" /> Switch role
            </DropdownMenuLabel>
            {ROLE_LIST.map((r) => {
              const Icon = r.icon;
              return (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => {
                    setRole(r.id);
                    toast(`Viewing as ${r.label}`, "success");
                    router.push(r.landing);
                  }}
                >
                  <Icon className="size-4" />
                  <span>{r.label}</span>
                  {r.id === roleId && <Check className="ml-auto size-4 text-brand-blue" />}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                Environment
              </p>
              <p className="text-foreground mt-0.5 text-xs">Demo — representative data</p>
              <p className="text-muted-foreground text-[11px]">
                Data as of {fmtDateTime(DEMO_NOW.toISOString())} UTC
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <UserCircle className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toast("Sign-out is disabled in the demo environment", "info")}
            >
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
