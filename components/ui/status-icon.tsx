import { CheckIcon } from "@phosphor-icons/react/ssr";

export type Status = "done" | "in_progress" | "not_started";

// 28 × 28. Decorative: the row's status text carries the meaning.
export function StatusIcon({ status }: { status: Status }) {
  if (status === "done") {
    return (
      <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-green-600 text-white">
        <CheckIcon weight="bold" size={16} />
      </span>
    );
  }
  if (status === "in_progress") {
    // 3 px ring: --border track, --blue-600 arc over the left half, from 12 o'clock counter-clockwise.
    return (
      <svg aria-hidden width={28} height={28} viewBox="0 0 28 28" className="block">
        <circle cx="14" cy="14" r="12.5" fill="none" stroke="var(--border)" strokeWidth="3" />
        <path d="M14 1.5 A12.5 12.5 0 0 0 14 26.5" fill="none" stroke="var(--blue-600)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return <span aria-hidden className="block size-7 rounded-full border-[2.5px] border-slate-400" />;
}
