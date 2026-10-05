"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { InlineError } from "@/components/ui/inline-error";
import { StatusControl } from "@/components/ui/status-control";
import { TintedButton } from "@/components/ui/tinted-button";
import { Toast } from "@/components/ui/toast";
import { claimCelebration } from "@/lib/celebration";
import { previousStatus, setRequirementStatus, toggleRequirement, useRequirementStatuses } from "@/lib/requirements";
import type { Requirement, RequirementStatus } from "@/lib/seed";

const STATUS_TEXT: Record<RequirementStatus, string> = {
  done: "Complete",
  in_progress: "In progress",
  not_started: "Not started",
};

type ToastState = { key: number; requirement: Requirement; from: RequirementStatus };

type RequirementListProps = {
  slug: string;
  requirements: Requirement[];
  // requirementId → journey step id
  journeySteps: Record<string, string>;
};

// Step 9 opens the celebration (05) here, 400 ms after the check finishes, at most once per step per session.
// Until then a linked row gets the same toast as any other row.
function onJourneyStepCompleted(stepId: string, showToast: () => void) {
  claimCelebration(stepId);
  showToast();
}

export function RequirementList({ slug, requirements, journeySteps }: RequirementListProps) {
  const statuses = useRequirementStatuses(requirements);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);

  function toggle(requirement: Requirement) {
    const { from, to, saved } = toggleRequirement(requirement);
    if (!saved) setStorageBlocked(true);
    try {
      navigator.vibrate?.(10);
    } catch {}
    if (to !== "done") {
      setToast(null);
      return;
    }
    const showToast = () => setToast({ key: Date.now(), requirement, from });
    const stepId = journeySteps[requirement.id];
    if (stepId) onJourneyStepCompleted(stepId, showToast);
    else showToast();
  }

  return (
    <>
      {storageBlocked && (
        <div className="mx-4 mt-4">
          <InlineError
            role="alert"
            title="Changes won't be saved on this device"
            body="Private browsing blocks saving. Your checkmarks will reset when you close this tab."
            action={<TintedButton onClick={() => setStorageBlocked(false)}>Dismiss</TintedButton>}
          />
        </div>
      )}

      <ul className="mx-4 mt-4 overflow-hidden rounded-md border border-border bg-surface shadow-card">
        {requirements.map((r) => {
          const status = statuses[r.id] ?? r.status;
          return (
            <li key={r.id} className="relative h-13 border-b border-border last:border-b-0">
              {/* The circle marks the row done; the rest of the row opens the detail. Two targets, side by side */}
              <StatusControl
                done={status === "done"}
                restStatus={status === "done" ? previousStatus(r) : status}
                label={`Mark ${r.title} complete`}
                onToggle={() => toggle(r)}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2"
              />
              <Link
                href={`/requirement/?university=${slug}&id=${r.id}`}
                aria-label={`${r.title}, ${STATUS_TEXT[status]}`}
                className="flex h-full items-center pl-17 pr-4 transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120 focus-ring:-outline-offset-2"
              >
                <span className="min-w-0 flex-1 truncate text-navy-900 type-row-title">{r.title}</span>
                <span className="relative h-5 w-22 shrink-0">
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={status}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 whitespace-nowrap text-slate-600 type-body"
                    >
                      {STATUS_TEXT[status]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <CaretRightIcon weight="bold" size={20} aria-hidden className="ml-3 shrink-0 text-navy-900" />
              </Link>
            </li>
          );
        })}
      </ul>

      {toast && (
        <Toast
          key={toast.key}
          message="Marked complete"
          action={{
            label: "Undo",
            onClick: () => {
              setRequirementStatus(toast.requirement, toast.from);
              setToast(null);
            },
          }}
          bottom="calc(var(--safe-bottom) + 12px)"
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
