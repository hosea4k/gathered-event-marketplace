import { NextResponse } from "next/server";
import { z } from "zod";
import { runRuleEngine } from "@/lib/chatbot/rules";
import type { ChatMessage, ChatState } from "@/lib/chatbot/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(40),
  state: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = parsed.data.messages as ChatMessage[];
  const state = (parsed.data.state as ChatState) ?? {};

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { runClaudeChat } = await import("@/lib/chatbot/claude");
      const reply = await runClaudeChat(messages);
      return NextResponse.json({ reply, state: {}, engine: "claude" });
    } catch (err) {
      console.error("Claude chat engine failed, falling back to rule engine:", err);
      // fall through to rule engine below
    }
  }

  const { reply, state: nextState } = await runRuleEngine(messages, state);
  return NextResponse.json({ reply, state: nextState, engine: "rules" });
}
