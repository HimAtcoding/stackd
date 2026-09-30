import { CalendarDotsIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/cn";
import { dueLabel } from "@/lib/due";
import type { UpcomingItem } from "@/lib/seed";

export function UpcomingCard({ item }: { item: UpcomingItem }) {
  const due = dueLabel(item.dueInDays);
  const deadline = item.type === "deadline";

  return (
    <Card href={`/upcoming/${item.id}`}>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-sm",
            deadline ? "bg-coral-25 text-coral-500" : "bg-tint-sky text-blue-600",
          )}
        >
          {deadline ? <CalendarDotsIcon weight="fill" size={24} aria-hidden /> : <UsersThreeIcon weight="fill" size={24} aria-hidden />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn("flex items-center justify-between gap-2", due && "min-h-7")}>
            <span className="text-navy-900 type-headline">{item.title}</span>
            {due && <Pill variant="due">{due}</Pill>}
          </span>
          <span className="mt-1 line-clamp-2 text-slate-600 type-body">{item.body}</span>
        </span>
      </div>
    </Card>
  );
}
