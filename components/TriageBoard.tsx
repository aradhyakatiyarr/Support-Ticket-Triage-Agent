"use client";

import type { TriageEntry } from "./LiveConsole";

const LANES: { key: string; label: string; dot: string; bg: string; border: string }[] = [
  { key: "critical", label: "Critical", dot: "bg-critical", bg: "bg-critical-bg", border: "border-critical/20" },
  { key: "high", label: "High", dot: "bg-high", bg: "bg-high-bg", border: "border-high/20" },
  { key: "medium", label: "Medium", dot: "bg-medium", bg: "bg-medium-bg", border: "border-medium/20" },
  { key: "low", label: "Low", dot: "bg-low", bg: "bg-low-bg", border: "border-low/20" },
];

export default function TriageBoard({ history }: { history: TriageEntry[] }) {
  const byLane = (key: string) => history.filter((h) => h.result.priority === key).slice(0, 8);

  return (
    <section id="board" className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Signature view</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">The triage board</h2>
          <p className="mt-1 max-w-xl text-[13.5px] text-muted">
            Every ticket you run through the console lands in a lane the moment it's scored — this is what a triage
            queue looks like from the inside.
          </p>
        </div>
        <p className="font-mono text-[11px] text-faint">{history.length} ticket{history.length === 1 ? "" : "s"} triaged</p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-panel/50 px-6 py-14 text-center">
          <p className="text-[13.5px] text-faint">Run a ticket through the console above — it'll show up here, sorted into its lane.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LANES.map((lane) => {
            const items = byLane(lane.key);
            return (
              <div key={lane.key} className={`rounded-2xl border ${lane.border} ${lane.bg} p-3`}>
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={`h-2 w-2 rounded-full ${lane.dot}`} />
                  <p className="font-mono text-[11px] font-medium uppercase tracking-wider">{lane.label}</p>
                  <span className="ml-auto font-mono text-[10.5px] text-faint">{items.length}</span>
                </div>
                <div className="thin-scroll flex max-h-80 flex-col gap-2 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="px-1 text-[11.5px] text-faint">empty</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="animate-rise rounded-lg border border-border bg-panel p-2.5">
                        <p className="mb-1 font-mono text-[10px] text-faint">{item.result.category.replace(/_/g, " ")}</p>
                        <p className="line-clamp-2 text-[12px] leading-snug text-ink">{item.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
