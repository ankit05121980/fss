"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/shared/Toast";
import { RoleProvider } from "@/components/shared/RoleProvider";
import { FlowProvider } from "@/components/shared/FlowProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session. Data is static (mock), so cache it hard.
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ToastProvider>
          <RoleProvider>
            <FlowProvider>
              <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
            </FlowProvider>
          </RoleProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
