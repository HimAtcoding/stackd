"use client";

import { useState, type FormEvent } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import type { TermId } from "@/lib/plan/build";
import { termLabel } from "@/lib/plan/warnings";
import { parseUnits, tidyCode } from "./course-sheet";

type CustomCourseSheetProps = {
  // The term it goes in; null closes the sheet
  term: TermId | null;
  onClose: () => void;
  onAdd: (fields: { code: string | null; name: string; units: number; term: TermId }) => void;
};

function Form({ term, onAdd }: { term: TermId; onAdd: CustomCourseSheetProps["onAdd"] }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [units, setUnits] = useState("");
  const [errors, setErrors] = useState<{ name?: string; units?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = parseUnits(units);
    const next = { name: name.trim() ? undefined : "Type the course's name", units: n === null ? "Units are a number from 0.5 to 20" : undefined };
    setErrors(next);
    if (next.name || next.units) return;
    onAdd({ code: code.trim() ? tidyCode(code) : null, name: name.trim(), units: n!, term });
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2 id="custom-course-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        Add a course to {termLabel(term)}
      </h2>
      <p className="mt-2 text-slate-600 type-body">It counts toward your units, not toward your major or Cal-GETC.</p>
      <div className="mt-5 flex flex-col gap-4">
        <TextField id="custom-code" label="Course code" placeholder="Optional, like ART 2A" autoCapitalize="characters" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
        <TextField id="custom-name" label="Name" placeholder="Drawing" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
        <TextField id="custom-units" label="Units" inputMode="decimal" placeholder="3" value={units} error={errors.units} className="max-w-[160px]" onChange={(e) => setUnits(e.target.value)} />
      </div>
      <PrimaryButton type="submit" className="mt-6">
        Add course
      </PrimaryButton>
    </form>
  );
}

// A course the student types (24 → 5, Custom courses): code, name and units, at the end of a term
export function CustomCourseSheet({ term, onClose, onAdd }: CustomCourseSheetProps) {
  const [kept, setKept] = useState<TermId | null>(term);
  if (term && term !== kept) setKept(term);
  return (
    <BottomSheet open={term !== null} onClose={onClose} labelledBy="custom-course-title">
      {kept && <Form key={kept} term={kept} onAdd={onAdd} />}
    </BottomSheet>
  );
}
