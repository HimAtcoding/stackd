import { CheckIcon } from "@phosphor-icons/react/ssr";

type ProgressRingProps = {
  done: number;
  total: number;
  // 56 on Home's Get ready card, with the count inside; 40 in the steps sheet, without it
  size: 56 | 40;
};

// Progress ring (14 → Get ready): --blue-600 arc from 12 o'clock, clockwise, on a --blue-100 track.
// All done: a filled --green-600 circle with a white check. Decorative; the card's words carry the count.
export function ProgressRing({ done, total, size }: ProgressRingProps) {
  if (total > 0 && done >= total) {
    return (
      <span aria-hidden className="flex shrink-0 items-center justify-center rounded-full bg-green-600 text-white" style={{ width: size, height: size }}>
        <CheckIcon weight="bold" size={size === 56 ? 24 : 20} />
      </span>
    );
  }
  const stroke = size === 56 ? 5 : 4;
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  const fraction = total > 0 ? done / total : 0;
  return (
    <span aria-hidden className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--blue-100)" strokeWidth={stroke} />
        {fraction > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--blue-600)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${length * fraction} ${length}`}
            className="transition-[stroke-dasharray] duration-320 ease-out motion-reduce:transition-none"
          />
        )}
      </svg>
      {size === 56 && (
        <span className="relative whitespace-nowrap text-navy-900 tabular-nums type-label">
          {done} of {total}
        </span>
      )}
    </span>
  );
}
