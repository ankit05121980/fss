"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { FLOW_STEPS, FLOW_STORAGE_KEY, type FlowStep } from "@/lib/utils/flow";

const LAST = FLOW_STEPS.length - 1;
const clampStep = (i: number) => Math.min(Math.max(i, 0), LAST);

interface FlowContextValue {
  active: boolean;
  stepIndex: number;
  steps: FlowStep[];
  start: (index?: number) => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

const FlowContext = React.createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [active, setActive] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const stepRef = React.useRef(0);
  React.useEffect(() => {
    stepRef.current = stepIndex;
  }, [stepIndex]);

  // Restore an in-progress flow on the client.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(FLOW_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { active?: boolean; stepIndex?: number };
        if (parsed.active) {
          /* eslint-disable react-hooks/set-state-in-effect */
          setActive(true);
          setStepIndex(Math.min(Math.max(parsed.stepIndex ?? 0, 0), FLOW_STEPS.length - 1));
          /* eslint-enable react-hooks/set-state-in-effect */
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist (writing to an external store from an effect is fine).
  React.useEffect(() => {
    try {
      localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ active, stepIndex }));
    } catch {
      /* ignore */
    }
  }, [active, stepIndex]);

  // Navigation is tied to user actions (not an effect) so restoring a persisted
  // flow on refresh never yanks the user off the page they loaded.
  const goToIndex = React.useCallback(
    (index: number, activate: boolean) => {
      const i = clampStep(index);
      stepRef.current = i;
      setStepIndex(i);
      if (activate) setActive(true);
      router.push(FLOW_STEPS[i].href);
    },
    [router],
  );

  const start = React.useCallback((index = 0) => goToIndex(index, true), [goToIndex]);
  const goTo = React.useCallback((index: number) => goToIndex(index, true), [goToIndex]);
  const next = React.useCallback(() => goToIndex(stepRef.current + 1, true), [goToIndex]);
  const prev = React.useCallback(() => goToIndex(stepRef.current - 1, true), [goToIndex]);
  const stop = React.useCallback(() => setActive(false), []);

  const value = React.useMemo<FlowContextValue>(
    () => ({ active, stepIndex, steps: FLOW_STEPS, start, stop, next, prev, goTo }),
    [active, stepIndex, start, stop, next, prev, goTo],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = React.useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within FlowProvider");
  return ctx;
}
