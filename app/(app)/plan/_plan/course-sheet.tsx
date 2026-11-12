"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowsDownUpIcon } from "@phosphor-icons/react/ssr";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceList, ChoiceRow } from "@/components/ui/choice-row";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusTile } from "@/components/ui/status-tile";
import { TextField } from "@/components/ui/text-field";
import type { CollegeCourse } from "@/lib/data/plan-data";
import type { TopicStatus } from "@/lib/explore";
import { topicIcon } from "@/lib/explore-icons";
import type { TermId } from "@/lib/plan/build";
import type { Card } from "@/lib/plan/view";
import { termLabel } from "@/lib/plan/warnings";

const STATUS_OPTIONS: { value: TopicStatus; label: string }[] = [
  { value: "not_started", label: "Not yet" },
  { value: "in_progress", label: "Taking now" },
  { value: "done", label: "Done" },
];

// "math 1a" → "MATH 1A". Kept as typed otherwise: we check it later.
export const tidyCode = (code: string) => code.trim().replace(/\s+/g, " ").toUpperCase();

// Units a student types: above 0 and at most 20
export function parseUnits(text: string): number | null {
  const n = Number(text.trim());
  return text.trim() && Number.isFinite(n) && n > 0 && n <= 20 ? Math.round(n * 10) / 10 : null;
}

type CourseSheetProps = {
  open: boolean;
  onClose: () => void;
  // Kept while the sheet slides away
  card: Card | null;
  college: string | null;
  // The college's verified courses for this course type
  courses: CollegeCourse[];
  terms: TermId[];
  onStatus: (card: Card, status: TopicStatus) => void;
  onChoose: (card: Card, course: CollegeCourse) => void;
  onType: (card: Card, code: string, units: number | null) => void;
  onMove: (card: Card, to: TermId | null) => void;
  onRemove: (card: Card) => void;
};

function YourCourse({ card, college, courses, onChoose, onType }: Pick<CourseSheetProps, "college" | "courses" | "onChoose" | "onType"> & { card: Card }) {
  const chosen = courses.find((c) => c.id === card.item.college_course_id);
  const [typing, setTyping] = useState(courses.length === 0 || (card.code !== null && !chosen));
  const [code, setCode] = useState(chosen ? "" : (card.code ?? ""));
  const [units, setUnits] = useState(chosen || card.item.units === null ? "" : String(card.item.units));
  const [error, setError] = useState<{ code?: string; units?: string }>({});
  const [saved, setSaved] = useState(false);

  function save(e: FormEvent) {
    e.preventDefault();
    const tidy = tidyCode(code);
    const n = units.trim() ? parseUnits(units) : null;
    const next = {
      code: tidy.length < 2 || !/\d/.test(tidy) ? "Type the course code, like MATH 1" : undefined,
      units: units.trim() && n === null ? "Units are a number from 0.5 to 20" : undefined,
    };
    setError(next);
    if (next.code || next.units) return;
    onType(card, tidy, n);
    setCode(tidy);
    setSaved(true);
  }

  return (
    <>
      <h3 className="mt-5 text-navy-900 type-headline">Your course at {college ?? "your college"}</h3>
      {courses.length > 0 && (
        <>
          <p className="mt-1 text-slate-600 type-caption">Matches this course type at your college.</p>
          <ChoiceList role="radiogroup" aria-label={`Your course at ${college ?? "your college"}`} className="mt-2">
            {courses.map((c) => (
              <ChoiceRow
                key={c.id}
                role="radio"
                checked={!typing && chosen?.id === c.id}
                name={c.title}
                detail={`${c.units} ${c.units === 1 ? "unit" : "units"}`}
                tile={<span className="shrink-0 whitespace-nowrap text-navy-900 type-code">{c.code}</span>}
                onSelect={() => {
                  setTyping(false);
                  onChoose(card, c);
                }}
              />
            ))}
            <ChoiceRow role="radio" checked={typing} name="Another course" onSelect={() => setTyping(true)} />
          </ChoiceList>
        </>
      )}
      {typing && (
        <form onSubmit={save} noValidate className="mt-3 flex flex-col gap-3">
          <TextField
            id="course-code"
            label="Course code"
            placeholder="Course code, like MATH 1"
            autoCapitalize="characters"
            autoComplete="off"
            value={code}
            error={error.code}
            hint="We also check new codes against your college's catalog."
            onChange={(e) => {
              setCode(e.target.value);
              setSaved(false);
            }}
          />
          <TextField
            id="course-units"
            label="Units"
            inputMode="decimal"
            placeholder="4"
            value={units}
            error={error.units}
            className="max-w-[160px]"
            onChange={(e) => {
              setUnits(e.target.value);
              setSaved(false);
            }}
          />
          {/* The secondary button's look as a submit button, so Return in a field saves */}
          <button type="submit" className="flex h-12 w-fit items-center rounded-md border-2 border-border bg-surface px-5 text-blue-600 type-button edge-md">
            {saved ? "Course saved" : "Save course"}
          </button>
        </form>
      )}
    </>
  );
}

function Details({ card, college, courses, onStatus, onChoose, onType, onRemove, onMoveTo }: Omit<CourseSheetProps, "open" | "onClose" | "card" | "terms" | "onMove"> & { card: Card; onMoveTo: () => void }) {
  const [burst, setBurst] = useState(0);
  return (
    <>
      <div className="flex items-center gap-3">
        <StatusTile status={card.progress} name={card.name} icon={topicIcon(card.topic ?? "")} tone="blue" burst={burst} />
        <div className="min-w-0 flex-1">
          <h2 id="course-sheet-title" tabIndex={-1} className="text-navy-900 type-title-3 focus:outline-none">
            {card.name}
          </h2>
          {card.code && <p className="mt-0.5 text-slate-700 type-code">{card.code}</p>}
        </div>
      </div>

      {card.reasons.length > 0 && (
        <>
          <h3 className="mt-5 text-navy-900 type-headline">Why it&apos;s here</h3>
          <ul className="mt-1 flex flex-col gap-1">
            {card.reasons.map((r) => (
              <li key={r} className="text-slate-700 type-body">
                {r}
              </li>
            ))}
          </ul>
        </>
      )}

      {card.kind !== "custom" && <YourCourse card={card} college={college} courses={courses} onChoose={onChoose} onType={onType} />}

      <h3 className="mt-5 text-navy-900 type-headline">Your status</h3>
      <SegmentedControl
        options={STATUS_OPTIONS}
        value={card.progress}
        onChange={(s) => {
          if (s === card.progress) return;
          if (s === "done") setBurst((n) => n + 1);
          onStatus(card, s);
        }}
        aria-label="Your status"
        className="mt-2"
      />

      {card.progress !== "done" && (
        <SecondaryButton icon={<ArrowsDownUpIcon weight="bold" size={20} aria-hidden />} onClick={onMoveTo} className="mt-5">
          Move to…
        </SecondaryButton>
      )}
      {card.kind === "custom" && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => onRemove(card)} className="-my-3 py-3 text-coral-700 type-link pressed:underline focus-ring:underline">
            Remove from plan
          </button>
        </div>
      )}
    </>
  );
}

function MoveList({ card, terms, onMove, onBack }: { card: Card; terms: TermId[]; onMove: (to: TermId | null) => void; onBack: () => void }) {
  const choices: { id: TermId | null; label: string }[] = [...terms.map((t) => ({ id: t, label: termLabel(t) })), { id: null, label: "Not in a term yet" }];
  // The sheet's content changed under the reader, so focus its new title
  useEffect(() => document.getElementById("course-sheet-title")?.focus(), []);
  return (
    <>
      <h2 id="course-sheet-title" tabIndex={-1} className="text-navy-900 type-title-3 focus:outline-none">
        Move {card.name} to
      </h2>
      <ChoiceList role="radiogroup" aria-label={`Move ${card.name} to`} className="mt-4">
        {choices.map((c) => (
          <ChoiceRow key={c.label} role="radio" checked={card.term === c.id} name={c.label} detail={terms[0] === c.id ? "Now" : null} onSelect={() => onMove(c.id)} />
        ))}
      </ChoiceList>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={onBack} className="-my-3 py-3 text-slate-600 type-link pressed:underline focus-ring:underline">
          Back
        </button>
      </div>
    </>
  );
}

// One course in full (24 → 3): why it's here, your course, your status, Move to… and, for a course the student added,
// Remove from plan. Move to… swaps the sheet for the list of terms; picking one closes it.
export function CourseSheet({ open, onClose, card, terms, onMove, ...rest }: CourseSheetProps) {
  const [moving, setMoving] = useState<string | null>(null);
  return (
    <BottomSheet
      open={open && card !== null}
      onClose={() => {
        setMoving(null);
        onClose();
      }}
      labelledBy="course-sheet-title"
    >
      {card && (
        <div className="-mx-6 -mt-6 max-h-[calc(100dvh-var(--safe-top)-72px)] overflow-y-auto px-6 pt-6">
          {moving === card.key ? (
            <MoveList
              card={card}
              terms={terms}
              onBack={() => setMoving(null)}
              onMove={(to) => {
                setMoving(null);
                onMove(card, to);
              }}
            />
          ) : (
            <Details key={card.key} card={card} {...rest} onMoveTo={() => setMoving(card.key)} />
          )}
        </div>
      )}
    </BottomSheet>
  );
}
