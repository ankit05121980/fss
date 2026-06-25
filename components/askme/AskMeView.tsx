"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Bot, Send, Sparkles, User } from "lucide-react";

import { fetchJson } from "@/lib/hooks/api";
import { ASKME_EXAMPLES } from "@/lib/engines/askme";
import type { AskMeResult } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarCompare } from "@/components/charts/BarCompare";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  result?: AskMeResult;
  pending?: boolean;
}

let idCounter = 0;
const nextId = () => `msg-${++idCounter}`;

export function AskMeView() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: (question: string) =>
      fetchJson<AskMeResult>("/api/askme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      }),
  });

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  async function submitQuestion(question: string) {
    const q = question.trim();
    if (!q || ask.isPending) return;
    const userMsg: ChatMessage = { id: nextId(), role: "user", text: q };
    const pendingMsg: ChatMessage = { id: nextId(), role: "assistant", pending: true };
    setMessages((m) => [...m, userMsg, pendingMsg]);
    scrollToBottom();
    try {
      const result = await ask.mutateAsync(q);
      setMessages((m) => m.map((msg) => (msg.id === pendingMsg.id ? { ...msg, pending: false, result } : msg)));
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingMsg.id
            ? { ...msg, pending: false, text: "Sorry, something went wrong answering that." }
            : msg,
        ),
      );
    }
    scrollToBottom();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("q") as HTMLInputElement;
    submitQuestion(input.value);
    input.value = "";
  }

  const useLlm = process.env.NEXT_PUBLIC_USE_LLM === "true";

  return (
    <div className="flex h-[calc(100dvh-180px)] min-h-[520px] flex-col gap-4">
      <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto rounded-lg">
        {messages.length === 0 ? (
          <WelcomePanel onPick={submitQuestion} useLlm={useLlm} />
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>

      {messages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ASKME_EXAMPLES.slice(0, 5).map((ex) => (
            <button
              key={ex.intent}
              type="button"
              onClick={() => submitQuestion(ex.text)}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:border-brand-blue hover:bg-accent"
            >
              {ex.text}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Bot className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            autoComplete="off"
            placeholder="Ask about shipments, traceability, excursions, carriers, custody, recalls, partners…"
            aria-label="Ask a question"
            className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" size="lg" className="h-11" disabled={ask.isPending}>
          <Send className="size-4" /> Ask
        </Button>
      </form>
    </div>
  );
}

function WelcomePanel({ onPick, useLlm }: { onPick: (q: string) => void; useLlm: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="size-6" />
      </span>
      <h2 className="text-lg font-bold text-foreground">AskMe — Conversational Compliance Intelligence</h2>
      <p className="mt-1 max-w-lg text-sm text-muted-foreground">
        Ask natural-language questions about your supply chain. Answers are computed from the unified
        data model and reconcile with every dashboard.
        {useLlm ? " (LLM mode enabled)" : " (deterministic engine)"}
      </p>
      <div className="mt-5 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {ASKME_EXAMPLES.map((ex) => (
          <button
            key={ex.intent}
            type="button"
            onClick={() => onPick(ex.text)}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:border-brand-blue hover:bg-accent"
          >
            <span className="text-foreground">{ex.text}</span>
            <ArrowRight className="size-4 shrink-0 text-brand-blue" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.text}
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <User className="size-4" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Bot className="size-4" />
      </span>
      <div className="w-full max-w-[88%] space-y-3">
        {message.pending ? (
          <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
            <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
          </div>
        ) : message.result ? (
          <ResultCard result={message.result} />
        ) : (
          <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm">
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="size-2 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  );
}

function ResultCard({ result }: { result: AskMeResult }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start gap-2">
        {result.intent !== "FALLBACK" && <Badge variant="secondary">{result.intent.replaceAll("_", " ")}</Badge>}
      </div>
      <p className="text-sm text-foreground">{result.summary}</p>

      {result.chart && result.chart.data.length > 0 && (
        <div className="rounded-lg border border-border p-2">
          <BarCompare data={result.chart.data} unit={result.chart.unit} colorByIndex height={220} />
        </div>
      )}

      {result.table && result.table.rows.length > 0 && (
        <div className="max-h-72 overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {result.table.columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.table.rows.map((row, i) => (
                <TableRow key={i}>
                  {result.table!.columns.map((c) => (
                    <TableCell key={c.key}>{String(row[c.key] ?? "—")}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {result.links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {result.links.map((l) => (
            <Button key={l.href} asChild variant="outline" size="sm">
              <Link href={l.href}>
                {l.label} <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
