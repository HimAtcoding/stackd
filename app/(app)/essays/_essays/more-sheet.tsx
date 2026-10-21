"use client";

import type { ReactNode } from "react";
import { ChatCircleTextIcon, ClipboardTextIcon, CopyIcon, ExportIcon, FileArrowUpIcon } from "@phosphor-icons/react/ssr";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/cn";

export type MoreAction = "copy" | "share" | "review" | "paste" | "import";

type MoreSheetProps = {
  open: boolean;
  title: string;
  // Copy, share and review need words to send
  hasText: boolean;
  onAction: (action: MoreAction) => void;
  onClose: () => void;
};

const ITEMS: { action: MoreAction; label: string; icon: ReactNode; needsText: boolean }[] = [
  { action: "copy", label: "Copy text", icon: <CopyIcon weight="bold" size={22} />, needsText: true },
  { action: "share", label: "Share…", icon: <ExportIcon weight="bold" size={22} />, needsText: true },
  { action: "review", label: "Ask for review", icon: <ChatCircleTextIcon weight="bold" size={22} />, needsText: true },
  { action: "paste", label: "Paste a draft", icon: <ClipboardTextIcon weight="bold" size={22} />, needsText: false },
  { action: "import", label: "Import a file", icon: <FileArrowUpIcon weight="bold" size={22} />, needsText: false },
];

// The editor's overflow menu (19 → Send a draft out): send this answer out, then bring text in
export function MoreSheet({ open, title, hasText, onAction, onClose }: MoreSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="more-title">
      <h2 id="more-title" tabIndex={-1} className="truncate text-navy-900 type-title-2 focus:outline-none">
        {title}
      </h2>
      <ul className="-mx-6 mt-3 divide-y divide-border border-y border-border">
        {ITEMS.map((item) => {
          const off = item.needsText && !hasText;
          return (
            <li key={item.action}>
              <button
                type="button"
                disabled={off}
                onClick={() => onAction(item.action)}
                className={cn(
                  "flex h-14 w-full items-center gap-4 px-6 text-left text-navy-900 type-row-title",
                  "transition-colors duration-200 ease-out pressed:bg-surface-pressed pressed:duration-120 focus-ring:-outline-offset-2",
                  off && "opacity-40",
                )}
              >
                <span aria-hidden className="text-indigo-600">
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
