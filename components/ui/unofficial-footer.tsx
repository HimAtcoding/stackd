import { cn } from "@/lib/cn";

export function UnofficialFooter({ className }: { className?: string }) {
  return (
    <p className={cn("mx-auto max-w-[320px] text-center text-slate-600 type-demo font-normal", className)}>
      Unofficial planning tool. Not affiliated with UC, CSU, ASSIST, or any college.
    </p>
  );
}
