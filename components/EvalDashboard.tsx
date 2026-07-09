"use client";

import { useState } from "react";
import type { ModelKey } from "@/lib/groq";
import PriorityBadge from "./PriorityBadge";

type EvalRow = {
  id: string;
  text: string;
  expected: { category: string; priority: string; sentiment: string; escalate: boolean };
  predicted: { category: string; priority: string; sentiment: string; escalate: boolean } | null;
  confidence: number | null;
  latencyMs: number;
  match: { category: boolean; priority: boolean; sentiment: boolean; escalate: boolean };
  error: string | null;
};

type EvalStats = {
  total: number;
  succeeded: number;
  failed: number;
  accuracy: {
    category: number;
    priority: number;
    sentiment: number;
    escalate: number;
    overall_exact_match: number;
  };
  avgLatencyMs: number;
  p95LatencyMs: number;
  model: string;
};

function Check({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-low">✓</span>
  ) : (
    <span className="text-critical">✗</span>
  );
}

export default function EvalDashboard({ model }: { model: ModelKey }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<EvalRow[] | null>(null);
  const [stats, setStats] = useState<EvalStats | null>(null);
  const [showOnlyMisses, setShowOnlyMisses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runEval() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Eval run failed.");
      setRows(data.rows);
      setStats(data.stats);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong running the eval.");
    } finally {
      setLoading(false);
    }
  }

  const visibleRows = rows ? (showOnlyMisses ? rows.filter((r) => !r.match.category || !r.match.priority || !r.match.sentiment) : rows) : [];

  return (
    <section id="eval" className="border-t border-border bg-panel/60">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Proof, not vibes</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Evaluation dashboard</h2>
            <p className="mt-1 max-w-xl text-[13.5px] text-muted">
              30 hand-labeled tickets, checked into <code className="font-mono text-[12px]">lib/sample-tickets.ts</code>.
              Run them against Qwen3.6 27B in {model === "fast" ? "non-thinking (fast)" : "thinking (deep reasoning)"} mode
              and see exactly where it agrees with the human label — and where it doesn't.
            </p>
          </div>
          <button
            onClick={runEval}
            disabled={loading}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                running 30 tickets…
              </>
            ) : (
              <>Run eval set →</>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-critical/25 bg-critical-bg px-3 py-2.5 text-[12.5px] text-critical">
            {error}
          </div>
        )}

        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Overall match" value={`${stats.accuracy.overall_exact_match}%`} highlight />
            <StatCard label="Category" value={`${stats.accuracy.category}%`} />
            <StatCard label="Priority" value={`${stats.accuracy.priority}%`} />
            <StatCard label="Sentiment" value={`${stats.accuracy.sentiment}%`} />
            <StatCard label="Avg latency" value={`${stats.avgLatencyMs}ms`} />
            <StatCard label="p95 latency" value={`${stats.p95LatencyMs}ms`} />
          </div>
        )}

        {rows && (
          <div className="overflow-hidden rounded-2xl border border-border bg-panel">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
                {visibleRows.length} of {rows.length} rows
              </p>
              <label className="flex items-center gap-1.5 text-[12px] text-muted">
                <input
                  type="checkbox"
                  checked={showOnlyMisses}
                  onChange={(e) => setShowOnlyMisses(e.target.checked)}
                  className="accent-brand"
                />
                mismatches only
              </label>
            </div>
            <div className="thin-scroll max-h-[560px] overflow-auto">
              <table className="w-full min-w-[640px] text-left text-[12.5px]">
                <thead className="sticky top-0 bg-panel">
                  <tr className="border-b border-border text-[10.5px] uppercase tracking-wider text-faint">
                    <th className="px-4 py-2 font-mono">id</th>
                    <th className="px-4 py-2 font-medium">ticket</th>
                    <th className="px-4 py-2 font-medium">category</th>
                    <th className="px-4 py-2 font-medium">priority</th>
                    <th className="px-4 py-2 font-medium">sentiment</th>
                    <th className="px-4 py-2 font-medium">conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-bg/60">
                      <td className="px-4 py-2.5 font-mono text-faint">{r.id}</td>
                      <td className="max-w-xs px-4 py-2.5 text-ink">
                        <span className="line-clamp-2">{r.text}</span>
                      </td>
                      {r.error ? (
                        <td colSpan={4} className="px-4 py-2.5 text-critical">
                          {r.error}
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Check ok={r.match.category} />
                              <span className="text-muted">{r.predicted?.category.replace(/_/g, " ")}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Check ok={r.match.priority} />
                              {r.predicted && <PriorityBadge priority={r.predicted.priority} size="sm" />}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Check ok={r.match.sentiment} />
                              <span className="text-muted">{r.predicted?.sentiment}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-faint">
                            {r.confidence !== null ? `${(r.confidence * 100).toFixed(0)}%` : "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-brand/25 bg-brand-light/50" : "border-border bg-panel"}`}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-1 font-display text-xl font-semibold ${highlight ? "text-brand-dark" : "text-ink"}`}>{value}</p>
    </div>
  );
}
