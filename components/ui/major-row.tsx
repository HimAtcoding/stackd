"use client";

import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { IconCircle } from "./icon-circle";

type MajorRowProps = {
  href: string;
  name: string;
  // "12 UC campuses, 2 count for UC and Cal State", or the student's own progress with its mini bar
  detail: ReactNode;
  icon: Icon;
};

// One major in a list (00 → Major row): a --green-700 icon circle, the name and one line of detail.
// No pale tint, no chevron, no dividers. The whole row is the button.
export function MajorRow({ href, name, detail, icon: Glyph }: MajorRowProps) {
  return (
    <Link href={href} transitionTypes={["push"]} className="flex min-h-16 items-center gap-3 rounded-md px-4 py-3 pressed:bg-surface-pressed">
      <IconCircle tone="green" size={40}>
        <Glyph weight="fill" size={20} />
      </IconCircle>
      <span className="min-w-0 flex-1">
        <span className="block text-navy-900 type-row-title">{name}</span>
        <span className="mt-0.5 block text-slate-600 type-caption">{detail}</span>
      </span>
    </Link>
  );
}
