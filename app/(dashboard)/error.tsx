"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="bg-danger/15 text-danger mb-4 flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="size-7" />
      </span>
      <h2 className="text-foreground text-lg font-bold">Something went wrong</h2>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">
        An unexpected error occurred while rendering this view. You can retry, or navigate to
        another dashboard.
      </p>
      {error.digest && (
        <p className="text-muted-foreground mt-2 text-xs">Reference: {error.digest}</p>
      )}
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
