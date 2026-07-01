import { NextResponse } from "next/server";

import { answerQuestion } from "@/lib/engines/askme";
import { LLM_ENABLED, callLlm } from "@/lib/engines/llm";

export async function POST(req: Request) {
  let question = "";
  try {
    const body = (await req.json()) as { question?: string };
    question = body.question ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!question.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  // Optional LLM path (off by default); always falls back to the deterministic engine.
  if (LLM_ENABLED) {
    try {
      return NextResponse.json(await callLlm(question));
    } catch {
      // fall through to deterministic engine
    }
  }
  return NextResponse.json(answerQuestion(question));
}
