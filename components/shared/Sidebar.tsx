"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { NAV_GROUPS } from "@/lib/utils/constants";
import { Logo } from "@/components/shared/Logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div
        className={cn(
          "border-sidebar-border flex h-16 items-center border-b px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <Logo collapsed={collapsed} />
      </div>

      <nav className="flex-1 scrollbar-thin overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed && (
              <p className="text-muted-foreground mb-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-2",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <span className={cn("flex items-center", active && "text-brand-blue")}>
                      <Icon className="size-[18px] shrink-0" />
                    </span>
                    {!collapsed && <span className="truncate">{item.title}</span>}
                    {active && !collapsed && (
                      <span className="bg-brand-blue ml-auto h-1.5 w-1.5 rounded-full" />
                    )}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-sidebar-border border-t p-3">
          <div className="bg-secondary rounded-lg px-3 py-2.5">
            <p className="text-secondary-foreground text-xs font-semibold">FSS POC</p>
            <p className="text-muted-foreground text-[11px]">
              Powered by Lumenore intelligence layer
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
