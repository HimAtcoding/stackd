"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: string };

type UnderlineTabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  "aria-label": string;
  // Fixed column width (04 uses 140). Without it the columns share the row equally (03).
  columnWidth?: number;
};

// Indicator: 3 px bar on the divider, label width + 28, slides and resizes over 200 ms.
export function UnderlineTabs({ tabs, value, onChange, columnWidth, ...rest }: UnderlineTabsProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    function measure() {
      const label = labelRefs.current.get(value);
      const row = rowRef.current;
      if (!label || !row) return;
      const l = label.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      setBar({ left: l.left - r.left - 14, width: l.width + 28 });
    }
    measure();
    const observer = new ResizeObserver(measure);
    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [value]);

  function onKeyDown(e: KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === value);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    onChange(tab.id);
    rowRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${tab.id}"]`)?.focus();
  }

  return (
    <div ref={rowRef} role="tablist" {...rest} onKeyDown={onKeyDown} className="relative flex h-11 border-b border-border">
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab={tab.id}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn("flex h-full items-center justify-center type-segment", !columnWidth && "flex-1", selected ? "text-blue-600" : "text-navy-900")}
            style={columnWidth ? { width: columnWidth } : undefined}
          >
            <span
              ref={(el) => {
                if (el) labelRefs.current.set(tab.id, el);
                else labelRefs.current.delete(tab.id);
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
      {bar && (
        <span
          aria-hidden
          className="absolute -bottom-px h-[3px] rounded-[2px] bg-blue-600 transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ left: bar.left, width: bar.width }}
        />
      )}
    </div>
  );
}
