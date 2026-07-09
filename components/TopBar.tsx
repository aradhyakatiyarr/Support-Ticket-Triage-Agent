"use client";

import type { ModelKey } from "@/lib/groq";

export default function TopBar({
  model,
  onModelChange,
}: {
  model: ModelKey;
  onModelChange: (m: ModelKey) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="font-display text-[14px] font-semibold tracking-tight sm:text-[15px]">Ticket Triage Agent</p>
            <p className="hidden font-mono text-[10px] uppercase tracking-wider text-faint sm:block">CRM triage console</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-1.5 font-mono text-[11px] text-muted sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulseDot rounded-full bg-low" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-low" />
            </span>
            live
          </div>

          <div className="flex items-center rounded-lg border border-border bg-panel p-0.5 text-[11.5px] sm:text-[12px]">
            <button
              onClick={() => onModelChange("fast")}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors sm:px-3 ${
                model === "fast" ? "bg-brand text-white" : "text-muted hover:text-ink"
              }`}
            >
              Fast
            </button>
            <button
              onClick={() => onModelChange("quality")}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors sm:px-3 ${
                model === "quality" ? "bg-brand text-white" : "text-muted hover:text-ink"
              }`}
            >
              Thinking
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
