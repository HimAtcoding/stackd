import type { ReactNode } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";

type InlineErrorProps = {
  title: string;
  body: string;
  // Only when retrying makes sense, e.g. a tinted "Try again" button.
  action?: ReactNode;
  role?: "alert";
};

export function InlineError({ title, body, action, role }: InlineErrorProps) {
  return (
    <div role={role} className="flex gap-3 rounded-md bg-coral-25 p-4">
      <WarningCircleIcon weight="fill" size={24} aria-hidden className="shrink-0 text-coral-700" />
      <div className="min-w-0 flex-1">
        <p className="text-navy-900 type-headline">{title}</p>
        <p className="mt-1 text-slate-700 type-body">{body}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
