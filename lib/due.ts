// Pill text for something due in `days`. Nothing past 14 days, or when there's no date.
export function dueLabel(days: number | undefined): string | null {
  if (days === undefined || days < 0 || days > 14) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === 14) return "In 2 weeks";
  return `In ${days} days`;
}
