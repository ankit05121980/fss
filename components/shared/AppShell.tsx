"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // On small screens the toggle opens a drawer; on desktop it collapses.
  function toggleSidebar() {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((c) => !c);
    } else {
      setMobileOpen((o) => !o);
    }
  }

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only z-[60] rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-4"
      >
        Skip to main content
      </a>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "border-sidebar-border hidden shrink-0 border-r transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main id="main-content" className="flex-1 scrollbar-thin overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
