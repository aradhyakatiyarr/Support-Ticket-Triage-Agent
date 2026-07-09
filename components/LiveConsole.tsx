"use client";

import { useRef, useState } from "react";
import type { ModelKey } from "@/lib/groq";
import PriorityBadge from "./PriorityBadge";
import { ROUTING_TEAMS } from "@/lib/schema";

const SAMPLES = [
  "You charged my card $2,400 instead of $24 for my monthly plan. That's my rent money. I need this reversed immediately, I'm calling my bank in the next hour if I don't hear back.",
  "Hey, loving the new dashboard redesign! One small thing — any chance you could add a dark mode for the mobile app?",
  "Getting a 502 error every time I try to upload a file over 50MB. Smaller files are fine.",
];

export type TriageEntry = {
  id: string;
  text: string;
  result: any;
  modelUsed: string;
  fellBack: boolean;
  latencyMs: number;
};

export default function LiveConsole({
  model,
  onResult,
}: {
  model: ModelKey;
  onResult: (entry: TriageEntry) => void;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ base64: string; mediaType: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [meta, setMeta] = useState<{ modelUsed: string; fellBack: boolean; latencyMs: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      setImage({ base64, mediaType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function run() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setMeta(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticketText: text,
          model,
          imageBase64: image?.base64,
          imageMediaType: image?.mediaType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Something went wrong.");
        return;
      }
      setResult(data.result);
      setMeta({ modelUsed: data.modelUsed, fellBack: data.fellBack, latencyMs: data.latencyMs });
      onResult({
        id: `${Date.now()}`,
        text,
        result: data.result,
        modelUsed: data.modelUsed,
        fellBack: data.fellBack,
        latencyMs: data.latencyMs,
      });
    } catch (e: any) {
      setError(e?.message ?? "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-panel shadow-panel">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Live console</p>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-critical/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-medium/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-low/40" />
        </div>
      </div>

      <div className="p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a customer message, support email, or chat transcript…"
          rows={5}
          className="w-full resize-none rounded-lg border border-border bg-bg p-3 text-[13.5px] leading-relaxed text-ink placeholder:text-faint focus:border-brand focus:outline-none"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAMPLES.map((s, i) => (
            <button
              key={i}
              onClick={() => setText(s)}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted hover:border-brand hover:text-brand"
            >
              sample {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {image ? (
              <div className="flex items-center gap-2">
                <img src={`data:${image.mediaType};base64,${image.base64}`} alt="" className="h-8 w-8 rounded object-cover" />
                <span className="text-[11px] text-muted">{image.name}</span>
                <button onClick={() => setImage(null)} className="text-[11px] text-faint hover:text-critical">
                  remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-[12px] text-muted hover:text-brand"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                attach screenshot (multimodal)
              </button>
            )}
          </div>

          <button
            onClick={run}
            disabled={!text.trim() || loading}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                triaging…
              </>
            ) : (
              <>Run triage →</>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-critical/25 bg-critical-bg px-3 py-2.5 text-[12.5px] text-critical">
            {error}
          </div>
        )}

        {result && meta && (
          <div className="mt-4 animate-rise space-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={result.priority} />
              <span className="rounded bg-bg px-2 py-1 font-mono text-[11px] text-muted">{result.category.replace(/_/g, " ")}</span>
              <span className="rounded bg-bg px-2 py-1 font-mono text-[11px] text-muted">{result.sentiment}</span>
              {result.escalate && (
                <span className="rounded bg-critical px-2 py-1 font-mono text-[11px] font-medium text-white">⚑ escalate</span>
              )}
              <span className="ml-auto font-mono text-[10.5px] text-faint">
                {meta.modelUsed} · {meta.latencyMs}ms{meta.fellBack ? " · fell back" : ""}
              </span>
            </div>

            <p className="text-[13px] text-muted">{result.urgency_reason}</p>

            <div className="rounded-lg bg-brand-light/40 border border-brand/15 p-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-brand-dark">→ routes to {ROUTING_TEAMS[result.category as keyof typeof ROUTING_TEAMS]}</p>
              <p className="text-[13px] leading-relaxed text-ink">{result.draft_response}</p>
            </div>

            <div className="flex items-center gap-3 font-mono text-[10.5px] text-faint">
              <span>confidence {(result.confidence * 100).toFixed(0)}%</span>
              <span>sentiment score {result.sentiment_score.toFixed(2)}</span>
              <span>priority score {result.priority_score}/100</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
