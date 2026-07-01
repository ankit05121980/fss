"use client";

import * as React from "react";
import { CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type ToastVariant = "default" | "success" | "info";
interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const ToastContext = React.createContext<{ toast: (message: string, variant?: ToastVariant) => void } | null>(
  null,
);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((message: string, variant: ToastVariant = "default") => {
    const id = ++counter;
    setItems((s) => [...s, { id, message, variant }]);
    window.setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3600);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[1100] flex -translate-x-1/2 flex-col items-center gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-lg",
              "animate-in fade-in-0 slide-in-from-bottom-2",
              "border-border bg-popover text-popover-foreground",
            )}
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="size-4 text-success" />
            ) : (
              <Info className="size-4 text-brand-blue" />
            )}
            <span>{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setItems((s) => s.filter((i) => i.id !== t.id))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
