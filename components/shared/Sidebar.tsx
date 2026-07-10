"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { ALL_NAV_ITEMS, NAV_GROUPS, type NavItem } from "@/lib/utils/constants";
import { Logo } from "@/components/shared/Logo";
import { useRole } from "@/components/shared/RoleProvider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function NavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
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
      {active && !collapsed && <span className="bg-brand-blue ml-auto h-1.5 w-1.5 rounded-full" />}
    </Link>
  );
  return (
    <li>
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
}

function NavSection({
  label,
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      {!collapsed && (
        <p className="text-muted-foreground mb-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { role } = useRole();
  const RoleIcon = role.icon;

  // Role-tailored navigation. Admin sees the full grouped nav; other personas
  // get a curated "Your workspace" plus the remaining modules (all reachable).
  const isAdmin = role.id === "ADMIN";
  const primarySet = new Set(role.primary);
  const workspaceItems = role.primary
    .map((href) => ALL_NAV_ITEMS.find((n) => n.href === href))
    .filter((n): n is NavItem => !!n);
  const moreItems = ALL_NAV_ITEMS.filter((n) => !primarySet.has(n.href));

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div
        className={cn(
          "border-sidebar-border flex h-16 items-center border-b px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <Link href="/executive" onClick={onNavigate} aria-label="NetTrace home">
          <Logo collapsed={collapsed} />
        </Link>
      </div>

      {!collapsed && (
        <div className="border-sidebar-border border-b px-4 py-2.5">
          <Badge variant="secondary" className="gap-1.5">
            <RoleIcon className="size-3.5" /> {role.label}
          </Badge>
        </div>
      )}

      <nav className="flex-1 scrollbar-thin overflow-y-auto px-3 py-4" aria-label="Primary">
        {isAdmin ? (
          NAV_GROUPS.map((group) => (
            <NavSection
              key={group.label}
              label={group.label}
              items={group.items}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))
        ) : (
          <>
            <NavSection
              label="Your workspace"
              items={workspaceItems}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
            <NavSection
              label="More modules"
              items={moreItems}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </>
        )}
      </nav>
    </div>
  );
}
