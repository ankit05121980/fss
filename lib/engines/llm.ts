// =============================================================================
// Optional LLM hook for AskMe (OFF by default).
//
// When NEXT_PUBLIC_USE_LLM === "true" AND an OPENAI_API_KEY is present, AskMe
// can route free-text questions to an LLM that is given the dataset as context.
// By default the flag is off and the deterministic engine is always used.
//
// This is intentionally a thin stub: the POC ships the deterministic engine.
// To enable, implement `callLlm` to call your provider and return an AskMeResult
// (e.g. via a structured-output / tool-calling prompt seeded with the dataset).
// =============================================================================

import type { AskMeResult } from "@/lib/data/types";

export const LLM_ENABLED = process.env.NEXT_PUBLIC_USE_LLM === "true";

export async function callLlm(question: string): Promise<AskMeResult> {
  // NOTE: Deliberately unimplemented for the POC. When LLM_ENABLED is true but
  // this throws, the API route gracefully falls back to the deterministic engine.
  void question;
  throw new Error("LLM hook not configured — using deterministic engine");
}
