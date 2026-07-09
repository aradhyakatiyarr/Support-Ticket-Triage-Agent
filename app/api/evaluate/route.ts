import { NextRequest, NextResponse } from "next/server";
import { runTriage, TriageError, type ModelKey } from "@/lib/groq";
import { EVAL_TICKETS } from "@/lib/sample-tickets";

export const runtime = "nodejs";
export const maxDuration = 120;

// Groq's free tier caps at 30 requests/min and 8,000 tokens/min for
// qwen3.6-27b — keep concurrency modest so the batch doesn't self-inflict
// a wall of 429s that the retry logic then has to dig out of.
const CONCURRENCY = 3;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const model: ModelKey = payload?.model === "quality" ? "quality" : "fast";

  const rows = await mapWithConcurrency(EVAL_TICKETS, CONCURRENCY, async (ticket) => {
    const start = Date.now();
    try {
      const { result, modelUsed, latencyMs } = await runTriage({ ticketText: ticket.text, model });
      return {
        id: ticket.id,
        text: ticket.text,
        expected: ticket.expected,
        predicted: {
          category: result.category,
          priority: result.priority,
          sentiment: result.sentiment,
          escalate: result.escalate,
        },
        draft_response: result.draft_response,
        confidence: result.confidence,
        modelUsed,
        latencyMs,
        match: {
          category: result.category === ticket.expected.category,
          priority: result.priority === ticket.expected.priority,
          sentiment: result.sentiment === ticket.expected.sentiment,
          escalate: result.escalate === ticket.expected.escalate,
        },
        error: null as string | null,
      };
    } catch (e) {
      const err = e as TriageError;
      return {
        id: ticket.id,
        text: ticket.text,
        expected: ticket.expected,
        predicted: null,
        draft_response: null,
        confidence: null,
        modelUsed: model,
        latencyMs: Date.now() - start,
        match: { category: false, priority: false, sentiment: false, escalate: false },
        error: err.message ?? "Unknown error",
      };
    }
  });

  const n = rows.length;
  const succeeded = rows.filter((r) => !r.error);
  const sum = (key: "category" | "priority" | "sentiment" | "escalate") =>
    rows.filter((r) => r.match[key]).length;

  const overallCorrect = rows.filter(
    (r) => r.match.category && r.match.priority && r.match.sentiment
  ).length;

  const latencies = succeeded.map((r) => r.latencyMs).sort((a, b) => a - b);
  const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p95Latency = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0;

  return NextResponse.json({
    rows,
    stats: {
      total: n,
      succeeded: succeeded.length,
      failed: n - succeeded.length,
      accuracy: {
        category: +((sum("category") / n) * 100).toFixed(1),
        priority: +((sum("priority") / n) * 100).toFixed(1),
        sentiment: +((sum("sentiment") / n) * 100).toFixed(1),
        escalate: +((sum("escalate") / n) * 100).toFixed(1),
        overall_exact_match: +((overallCorrect / n) * 100).toFixed(1),
      },
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      model,
    },
  });
}
