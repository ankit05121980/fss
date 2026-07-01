"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Compass, Flag, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useFlow } from "@/components/shared/FlowProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function GuidedFlowDock() {
  const { active, stepIndex, steps, next, prev, stop, goTo } = useFlow();
  const [minimized, setMinimized] = React.useState(false);

  const step = steps[stepIndex];
  const total = steps.length;
  const isLast = stepIndex === total - 1;

  // Highlight the step's target element (best-effort) after the screen settles.
  React.useEffect(() => {
    if (!active || !step?.target) return;
    let el: Element | null = null;
    const timer = window.setTimeout(() => {
      el = document.querySelector(step.target as string);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("flow-highlight");
      }
    }, 650);
    return () => {
      window.clearTimeout(timer);
      if (el) el.classList.remove("flow-highlight");
    };
  }, [active, stepIndex, step]);

  if (!active || !step) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="bg-primary text-primary-foreground fixed bottom-4 right-4 z-[1050] flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg"
      >
        <Compass className="size-4" /> Guided flow · {stepIndex + 1}/{total}
      </button>
    );
  }

  return (
    <div className="border-border bg-card fixed bottom-4 right-4 z-[1050] w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border shadow-2xl">
      <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <Compass className="text-brand-blue size-4" /> Guided Flow
        </span>
        <div className="flex items-center gap-1">
          <Badge variant="muted">
            {stepIndex + 1} / {total}
          </Badge>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Minimize" onClick={() => setMinimized(true)}>
            <ChevronDown className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" aria-label="End guided flow" onClick={stop}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* progress */}
      <div className="bg-muted h-1 w-full">
        <div
          className="bg-brand-blue h-full transition-all"
          style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-foreground text-sm font-bold">{step.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{step.instruction}</p>
        <div className="border-brand-blue/30 bg-brand-surface-2/50 rounded-md border px-3 py-2">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">Try this</p>
          <p className="text-foreground mt-0.5 text-sm">{step.whatToDo}</p>
        </div>

        {/* step dots */}
        <div className="flex flex-wrap items-center gap-1">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === stepIndex ? "bg-brand-blue w-5" : "bg-border w-1.5 hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={prev} disabled={stepIndex === 0}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {isLast ? (
            <Button size="sm" onClick={stop}>
              <Flag className="size-4" /> Finish
            </Button>
          ) : (
            <Button size="sm" onClick={next}>
              Next <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
