"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TourStep {
  phase: number;
  title: string;
  href: string;
  duration: string;
  body: string;
  watchFor: string;
}

const STEPS: TourStep[] = [
  {
    phase: 1,
    title: "Executive DSCSA Readiness",
    href: "/executive",
    duration: "2 min",
    body: "Start with the boardroom view — overall compliance score, traceability & serialization coverage, authorized-partner %, recall readiness, open risks and active excursions.",
    watchFor: "The compliance gauge and the surfaced predictive alerts strip.",
  },
  {
    phase: 2,
    title: "Supply Chain Control Tower",
    href: "/control-tower",
    duration: "3 min",
    body: "Drop into operations: live shipment visibility across ocean, air and road with ocean lanes emphasized on the global map, carrier performance and port congestion.",
    watchFor: "Filter by mode/status, then click a shipment row to open its full trace.",
  },
  {
    phase: 3,
    title: "End-to-End Traceability",
    href: "/traceability?type=serial&q=SN0008743",
    duration: "3 min",
    body: "Trace serial SN0008743 of the COVID-19 vaccine — product, batch, custody, ownership, verification and temperature history. Open the End-to-End Journey tab for the stage-by-stage flow.",
    watchFor: "The 'End-to-End Journey' tab: dwell time and the customs excursion in sequence.",
  },
  {
    phase: 4,
    title: "Cold Chain Intelligence",
    href: "/cold-chain",
    duration: "2 min",
    body: "See the 10°C excursion detected and root-caused to the 18h Newark customs delay, with the temperature timeline and route overlay.",
    watchFor: "The root-cause panel linking the customs delay to the excursion.",
  },
  {
    phase: 5,
    title: "AskMe — Conversational Intelligence",
    href: "/askme",
    duration: "3 min",
    body: "Ask natural-language compliance questions. Answers are computed from the unified model and reconcile with every dashboard.",
    watchFor: "Try the example chips — e.g. 'Trace serial number SN0008743'.",
  },
  {
    phase: 6,
    title: "Do You Know — Automated Insights",
    href: "/insights",
    duration: "2 min",
    body: "Automatically generated, data-derived insights surface patterns such as excursions after customs delays and the carrier driving custody gaps.",
    watchFor: "Each card shows the supporting number and a mini chart.",
  },
  {
    phase: 7,
    title: "Predictive Analytics",
    href: "/predictive",
    duration: "2 min",
    body: "Move from descriptive to predictive: five heuristic risk types per active shipment with explainable drivers and proactive alerts.",
    watchFor: "SHP-001 delay, SHP-007 excursion and the rising ABC Logistics partner risk.",
  },
];

export function GuidedTour() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const current = STEPS[step];

  function open_(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setStep(0);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
          <Compass className="size-4" /> Guided tour
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Phase {current.phase} of 7</Badge>
            <span className="text-xs text-muted-foreground">{current.duration}</span>
          </div>
          <DialogTitle className="mt-1">{current.title}</DialogTitle>
          <DialogDescription>{current.body}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What to look for
          </p>
          <p className="mt-1 text-foreground">{current.watchFor}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.phase}
              type="button"
              aria-label={`Go to phase ${s.phase}`}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand-blue" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Button variant="outline" size="sm" onClick={() => open_(current.href)}>
            Open this view <ExternalLink className="size-3.5" />
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setOpen(false)}>
              Finish
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
