import { cn } from "@/lib/cn";

// 20 px ring spinner, 2 px stroke, 800 ms linear rotation.
export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} aria-hidden className={cn("spinner", className)}>
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="42 100" />
    </svg>
  );
}
