// 12 tall: --green-600 on a --border track (00 → Progress bar). Width animates only when the value changes; a CSS transition never runs on first paint.
// `max` is what a full bar counts to: 100 by default, or a step count (10 uses 3).
export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className="h-3 overflow-hidden rounded-full bg-border"
    >
      <div
        className="h-full rounded-full bg-green-600 transition-[width] duration-320 ease-out motion-reduce:transition-none"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
