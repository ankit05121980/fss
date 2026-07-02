"use client";

import Link from "next/link";
import { ArrowRight, Compass, Play, Sparkles } from "lucide-react";

import { useFlow } from "@/components/shared/FlowProvider";
import { FLOW_STEPS } from "@/lib/utils/flow";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GettingStartedPage() {
  const { start, goTo } = useFlow();

  return (
    <>
      <PageHeader
        title="Getting Started"
        subtitle="A guided, end-to-end flow through the entire Veritrace platform."
      >
        <Button onClick={() => start(0)} className="gap-1.5">
          <Play className="size-4" /> Start guided flow
        </Button>
      </PageHeader>

      <Card
        data-flow="getting-started"
        className="from-brand-surface-2 to-card border-l-brand-blue overflow-hidden border-l-4 bg-gradient-to-br"
      >
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-xl">
              <Compass className="size-6" />
            </span>
            <div>
              <h2 className="text-foreground text-lg font-bold">
                Follow the golden-thread story in {FLOW_STEPS.length} guided steps
              </h2>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                Trace a serialized COVID-19 vaccine batch from a German manufacturer to a US hospital —
                across readiness, control tower, traceability, cold chain, recall, partners and AI.
                The guided flow walks each screen and highlights what matters; you can stop or resume
                anytime.
              </p>
            </div>
          </div>
          <Button onClick={() => start(0)} size="lg" className="shrink-0 gap-1.5">
            <Sparkles className="size-4" /> Begin
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {FLOW_STEPS.map((step, i) => (
          <Card key={step.id} className="transition-colors hover:border-brand-blue">
            <CardContent className="flex items-start gap-3 p-4">
              <span className="bg-secondary text-secondary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-foreground text-sm font-semibold">{step.title}</h3>
                  <Badge variant="muted">Step {i + 1}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{step.instruction}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => goTo(i)}>
                    Start here <ArrowRight className="size-3.5" />
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={step.href}>Just open</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
