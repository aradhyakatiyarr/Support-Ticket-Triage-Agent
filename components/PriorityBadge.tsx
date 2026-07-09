const STYLES: Record<string, string> = {
  critical: "bg-critical-bg text-critical",
  high: "bg-high-bg text-high",
  medium: "bg-medium-bg text-medium",
  low: "bg-low-bg text-low",
};

export default function PriorityBadge({ priority, size = "md" }: { priority: string; size?: "sm" | "md" }) {
  const cls = STYLES[priority] ?? "bg-border text-muted";
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]";
  return (
    <span className={`inline-flex items-center rounded font-mono font-medium uppercase tracking-wide ${cls} ${pad}`}>
      {priority}
    </span>
  );
}
