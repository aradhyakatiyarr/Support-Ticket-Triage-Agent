"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import LiveConsole, { type TriageEntry } from "@/components/LiveConsole";
import TriageBoard from "@/components/TriageBoard";
import EvalDashboard from "@/components/EvalDashboard";
import type { ModelKey } from "@/lib/groq";

export default function Home() {
  const [model, setModel] = useState<ModelKey>("fast");
  const [history, setHistory] = useState<TriageEntry[]>([]);

  return (
    <main>
      <TopBar model={model} onModelChange={setModel} />

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-brand-dark">CRM · support ops</p>
            <h1 className="font-display text-[2.15rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.5rem]">
              Every ticket, triaged before a human reads it.
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-muted">
              Paste a ticket on the right. Qwen3.6 27B (via Groq, free tier) reads it, scores sentiment and urgency,
              picks a category and a queue, and drafts a first reply — as one forced tool call, not a hopeful prompt.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6">
              <Fact k="8" v="ticket categories" />
              <Fact k="4" v="priority lanes" />
              <Fact k="2" v="models, one fallback path" />
              <Fact k="30" v="labeled eval tickets" />
            </dl>

            <div className="mt-8 space-y-2 border-t border-border pt-6 font-mono text-[11px] text-faint">
              <p>→ tool-forced JSON, not prompted JSON</p>
              <p>→ retries on 429 / 503, falls back models once</p>
              <p>→ accepts a screenshot as evidence (multimodal)</p>
            </div>
          </div>

          <LiveConsole model={model} onResult={(e) => setHistory((h) => [e, ...h])} />
        </div>
      </section>

      <TriageBoard history={history} />
      <EvalDashboard model={model} />

      <footer className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-8 border-t border-border pt-10 sm:grid-cols-3">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Architecture note</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Classification is a forced <code className="font-mono text-[12px] text-ink">tool_use</code> call against
              a fixed input schema — the model can't return prose instead of data.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Failure handling</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Rate limits and overload errors retry with backoff, then fall back to the other model once before the
              request actually fails.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Why an eval set</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              A demo that works on one ticket proves nothing. 30 labeled tickets checked into the repo make the
              accuracy claim checkable, not asserted.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-ink">{k}</p>
      <p className="text-[12px] text-muted">{v}</p>
    </div>
  );
}
