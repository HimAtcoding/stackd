"use client";

import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";

type MajorRowProps = {
  href: string;
  name: string;
  // "UC and Cal State"
  detail: string;
  icon: Icon;
};

// One major in a list (21 → Row): an icon tile, the name and one line of detail. The whole row is the button.
export function MajorRow({ href, name, detail, icon: Glyph }: MajorRowProps) {
  return (
    <Link href={href} transitionTypes={["push"]} className="flex min-h-16 items-center gap-3 rounded-md px-4 py-3 pressed:bg-surface-pressed">
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-mint-100 text-mint-600">
        <Glyph weight="duotone" size={22} />
      </span>
      <span className="min-w-0">
        <span className="block text-navy-900 type-row-title">{name}</span>
        <span className="mt-0.5 block text-slate-600 type-caption">{detail}</span>
      </span>
    </Link>
  );
}
