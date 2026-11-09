"use client";

import { useState } from "react";
import { BellIcon, CheckIcon, CodeIcon, EnvelopeIcon, EyeIcon, GraduationCapIcon, LockIcon } from "@phosphor-icons/react/ssr";
import { AskCard } from "@/components/ui/ask-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceChip, ChoiceChips } from "@/components/ui/choice-chip";
import { ChoiceList, ChoiceRow } from "@/components/ui/choice-row";
import { DestructiveButton } from "@/components/ui/destructive-button";
import { Loading } from "@/components/ui/loading";
import { MajorRow } from "@/components/ui/major-row";
import { CompactButton } from "@/components/ui/compact-button";
import { DateRow, DateTile } from "@/components/ui/date-row";
import { SchoolTile } from "@/components/ui/school-tile";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RequirementRow } from "@/components/ui/requirement-row";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SettingsGroup, SettingsRow } from "@/components/ui/settings-row";
import { SourceBlock } from "@/components/ui/source-block";
import { Spinner } from "@/components/ui/spinner";
import { StatusControl } from "@/components/ui/status-control";
import { StatusTile, type TileStatus } from "@/components/ui/status-tile";
import { StepPath, type PathStep } from "@/components/ui/step-path";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { UnderlineTabs } from "@/components/ui/underline-tabs";

function Label({ children }: { children: string }) {
  return <p className="mb-1.5 text-slate-600 type-caption">{children}</p>;
}

const TILE_STATUSES: { value: TileStatus; label: string }[] = [
  { value: "not_started", label: "Not yet" },
  { value: "in_progress", label: "Taking now" },
  { value: "done", label: "Done" },
];

export function ExploreDemo() {
  const [status, setStatus] = useState<TileStatus>("not_started");
  const next = () => setStatus((s) => (s === "done" ? "not_started" : "done"));
  return (
    <>
      <Label>Segmented control</Label>
      <SegmentedControl options={TILE_STATUSES} value={status} onChange={setStatus} aria-label="Sample status" />
      <Label>Status tile: not yet, taking now, done</Label>
      <div className="flex gap-3">
        {TILE_STATUSES.map((s) => (
          <StatusTile key={s.value} status={s.value} name={s.label} icon={CodeIcon} tone="green" />
        ))}
      </div>
      <Label>Requirement row, the tile follows the control above</Label>
      <div className="-mx-4">
        <RequirementRow name="Sample course type" howMany="One course" countsForBoth status={status} icon={CodeIcon} onToggle={next} onOpen={() => {}} />
      </div>
      <Label>Major row</Label>
      <MajorRow href="#" name="Sample major" detail="9 UC campuses, 2 count for UC and Cal State" icon={CodeIcon} />
      <Label>School tiles: UC, Cal State, community college, and 4 and 5 letters</Label>
      <div className="flex gap-3">
        <SchoolTile abbreviation="UCB" system="UC" />
        <SchoolTile abbreviation="SJSU" system="CSU" />
        <SchoolTile abbreviation="LPC" system="CCC" />
        <SchoolTile abbreviation="CSUSM" system="CSU" />
        <SchoolTile abbreviation="LATTC" system="CCC" />
      </div>
      <Label>Date tile with no deadline</Label>
      <DateTile status="rolling" />
      <Label>Ask, tier 3</Label>
      <AskCard labelledBy="demo-ask" icon={<GraduationCapIcon weight="fill" size={20} aria-hidden />}>
        <h3 id="demo-ask" className="text-navy-900 type-headline">
          A sample ask
        </h3>
      </AskCard>
      <Label>Source block</Label>
      <SourceBlock line="From a sample source. Checked Oct 31, 2026." link={{ href: "https://example.com", label: "Open the sample page" }} report="mailto:joinstackd@gmail.com" />
    </>
  );
}

export function ProgressDemo() {
  const [value, setValue] = useState(50);
  return (
    <>
      <Label>0, 50 and 100</Label>
      <div className="flex flex-col gap-3">
        <ProgressBar value={0} label="Sample progress" />
        <ProgressBar value={50} label="Sample progress" />
        <ProgressBar value={100} label="Sample progress" />
      </div>
      <Label>Animates only on change</Label>
      <ProgressBar value={value} label="Sample progress" />
      <SecondaryButton onClick={() => setValue((v) => (v >= 100 ? 0 : v + 25))}>Change value</SecondaryButton>
    </>
  );
}

export function TabsDemo() {
  const [a, setA] = useState("requirements");
  const [b, setB] = useState("mine");
  return (
    <>
      <Label>Equal columns (03)</Label>
      <UnderlineTabs
        aria-label="Sample tabs"
        value={a}
        onChange={setA}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "requirements", label: "Requirements" },
          { id: "life", label: "Student life" },
        ]}
      />
      <Label>Fixed 140 columns (04)</Label>
      <UnderlineTabs
        aria-label="Sample tabs, fixed width"
        columnWidth={140}
        value={b}
        onChange={setB}
        tabs={[
          { id: "mine", label: "My essays" },
          { id: "resources", label: "Resources" },
        ]}
      />
    </>
  );
}

export function TextFieldDemo() {
  const [error, setError] = useState(true);
  const eye = (
    <button type="button" aria-label="Show password" aria-pressed={false} className="flex size-11 items-center justify-center rounded-sm text-slate-600">
      <EyeIcon weight="bold" size={22} />
    </button>
  );
  return (
    <>
      <TextField id="tf-rest" label="Rest" placeholder="you@example.com" icon={<EnvelopeIcon weight="bold" size={22} />} />
      <TextField id="tf-filled" label="Filled" defaultValue="alex@example.com" icon={<EnvelopeIcon weight="bold" size={22} />} />
      <TextField id="tf-focus" label="Focus" data-focus placeholder="you@example.com" icon={<EnvelopeIcon weight="bold" size={22} />} />
      <TextField id="tf-hint" label="Hint" hint="Use at least 8 characters." type="password" icon={<LockIcon weight="bold" size={22} />} trailing={eye} />
      <TextField id="tf-error" label="Error" error={error ? "Enter your email." : undefined} icon={<EnvelopeIcon weight="bold" size={22} />} />
      <SecondaryButton onClick={() => setError((e) => !e)}>Toggle error</SecondaryButton>
      <TextField id="tf-readonly" label="Read-only" readOnly defaultValue="alex@example.com" icon={<EnvelopeIcon weight="bold" size={22} />} />
      <TextField id="tf-disabled" label="Disabled" disabled defaultValue="alex@example.com" icon={<EnvelopeIcon weight="bold" size={22} />} />
      <TextField id="tf-plain" label="No icon" placeholder="First name" />
    </>
  );
}

export function SearchFieldDemo() {
  const [empty, setEmpty] = useState("");
  const [filled, setFilled] = useState("san d");
  return (
    <>
      <Label>Rest</Label>
      <SearchField id="sf-rest" placeholder="Search schools" value={empty} onChange={setEmpty} />
      <Label>With text: the clear button shows</Label>
      <SearchField id="sf-filled" placeholder="Search schools" value={filled} onChange={setFilled} />
      <Label>Focus</Label>
      <SearchField id="sf-focus" data-focus placeholder="Search schools" value="" onChange={() => {}} />
      <Label>Read-only</Label>
      <SearchField id="sf-readonly" readOnly placeholder="Search schools" value="san d" onChange={() => {}} />
    </>
  );
}

export function ChoiceDemo() {
  const [one, setOne] = useState("b");
  const [many, setMany] = useState(["a"]);
  const toggle = (id: string) => setMany((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  return (
    <>
      <Label>Single choice, with and without a second line</Label>
      <ChoiceList role="radiogroup" aria-label="Sample single choice">
        <ChoiceRow role="radio" checked={one === "a"} name="Sample row" detail="Second line" onSelect={() => setOne("a")} />
        <ChoiceRow role="radio" checked={one === "b"} name="Chosen row" detail="Second line" onSelect={() => setOne("b")} />
        <ChoiceRow role="radio" checked={one === "c"} name="A long name that wraps to a second line before it is cut off with an ellipsis at the end" onSelect={() => setOne("c")} />
        <ChoiceRow role="radio" checked={one === "d"} name="No second line" onSelect={() => setOne("d")} />
      </ChoiceList>
      <Label>Multiple choice</Label>
      <ChoiceList role="group" aria-label="Sample multiple choice">
        <ChoiceRow role="checkbox" checked={many.includes("a")} name="Sample row" detail="Second line" onSelect={() => toggle("a")} />
        <ChoiceRow role="checkbox" checked={many.includes("b")} name="Sample row" detail="Second line" onSelect={() => toggle("b")} />
      </ChoiceList>
      <Label>Pressed, focus, and read-only (while saving)</Label>
      <ChoiceList role="group" aria-label="Sample states">
        <ChoiceRow role="checkbox" checked={false} name="Pressed" data-pressed onSelect={() => {}} />
        <ChoiceRow role="checkbox" checked={false} name="Focus" data-focus onSelect={() => {}} />
      </ChoiceList>
      <ChoiceList role="group" aria-label="Sample read-only" readOnly>
        <ChoiceRow role="checkbox" checked name="Read-only, chosen" readOnly onSelect={() => {}} />
        <ChoiceRow role="checkbox" checked={false} name="Read-only" readOnly onSelect={() => {}} />
      </ChoiceList>
    </>
  );
}

export function SettingsRowDemo() {
  return (
    <>
      <SettingsGroup>
        <SettingsRow label="Opens a screen" value="Sample value" href="/dev/components" />
        <SettingsRow label="Long value" value="A sample value that is too long to fit on one line of the row" href="/dev/components" />
        <SettingsRow label="Needs attention" value="Sample value" valueTone="action" href="/dev/components" />
        <SettingsRow label="Plain text" value="Sample value" />
        <SettingsRow label="Pressed" href="/dev/components" data-pressed />
        <SettingsRow label="Focus" href="/dev/components" data-focus />
        <SettingsRow label="Working" onClick={() => {}} disabled trailing={<Spinner className="text-navy-900" />} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow label="Action label" labelTone="action" href="/dev/components" />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow label="Single action" onClick={() => {}} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow label="Danger label" labelTone="danger" onClick={() => {}} />
      </SettingsGroup>
    </>
  );
}

export function BottomSheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Label>Slides up over a scrim; Escape or a tap on the scrim closes it</Label>
      <SecondaryButton onClick={() => setOpen(true)}>Open sheet</SecondaryButton>
      <BottomSheet open={open} labelledBy="sheet-demo-title" onClose={() => setOpen(false)}>
        <h2 id="sheet-demo-title" tabIndex={-1} className="text-navy-900 outline-none type-title-2">
          Sample sheet
        </h2>
        <p className="mt-2 text-slate-700 type-body">Sample body text for the sheet.</p>
        <div className="mt-6">
          <DestructiveButton onClick={() => setOpen(false)}>Sample action</DestructiveButton>
        </div>
      </BottomSheet>
    </>
  );
}

export function ToastDemo() {
  const [shown, setShown] = useState(0);
  return (
    <>
      <Label>Specimen</Label>
      <Toast still message="Marked complete" action={{ label: "Undo", onClick: () => {} }} bottom="0" onDone={() => {}} />
      <SecondaryButton onClick={() => setShown((n) => n + 1)}>Show toast</SecondaryButton>
      {shown > 0 && (
        <Toast
          key={shown}
          message="Marked complete"
          action={{ label: "Undo", onClick: () => setShown(0) }}
          bottom="calc(12px + var(--safe-bottom))"
          onDone={() => setShown(0)}
        />
      )}
    </>
  );
}

export function LoadingDemo() {
  const [run, setRun] = useState(0);
  return (
    <>
      <Label>Running</Label>
      <Loading immediate label="Loading requirements" />
      <Label>Waits under 600 ms show nothing</Label>
      {run > 0 ? <Loading key={run} label="Loading requirements" /> : <p className="text-slate-600 type-caption">Not started</p>}
      <SecondaryButton onClick={() => setRun((n) => n + 1)}>Start a wait</SecondaryButton>
    </>
  );
}

export function ChipDemo() {
  const [term, setTerm] = useState<string | null>("fall-2027");
  return (
    <>
      <Label>Tap to choose</Label>
      <ChoiceChips aria-label="Sample term">
        {[["fall-2027", "Fall 2027"], ["fall-2028", "Fall 2028"], ["none", "Not sure yet"]].map(([value, label]) => (
          <ChoiceChip key={value} checked={term === value} onSelect={() => setTerm(value)}>
            {label}
          </ChoiceChip>
        ))}
      </ChoiceChips>
      <Label>Pressed and focus</Label>
      <div className="flex gap-2">
        <ChoiceChip checked={false} onSelect={() => {}} data-pressed>
          Pressed
        </ChoiceChip>
        <ChoiceChip checked={false} onSelect={() => {}} data-focus>
          Focus
        </ChoiceChip>
      </div>
    </>
  );
}

export function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center gap-4">
      <Switch checked={on} onChange={setOn} aria-label="Sample switch" />
      <Switch checked={false} onChange={() => {}} aria-label="Off" />
      <Switch checked={false} onChange={() => {}} disabled aria-label="Disabled" />
      <Switch checked onChange={() => {}} data-focus aria-label="Focus" />
    </div>
  );
}

export function StatusTileDemo() {
  const [status, setStatus] = useState<TileStatus>("in_progress");
  const cycle = () => setStatus((s) => (s === "not_started" ? "in_progress" : s === "in_progress" ? "done" : "not_started"));
  return (
    <>
      <Label>As a control: not yet, taking now, done (tap to cycle, with the burst)</Label>
      <div className="flex gap-3">
        {TILE_STATUSES.map((s) => (
          <StatusTile key={s.value} status={s.value} name={s.label} icon={CodeIcon} tone="green" onToggle={() => {}} />
        ))}
        <StatusTile status={status} name="Sample" icon={CodeIcon} tone="green" onToggle={cycle} />
      </div>
      <Label>Pressed and focus</Label>
      <div className="flex gap-3">
        <StatusTile status="not_started" name="Pressed" icon={CodeIcon} tone="green" onToggle={() => {}} data-pressed />
        <StatusTile status="done" name="Pressed, done" icon={CodeIcon} tone="green" onToggle={() => {}} data-pressed />
        <StatusTile status="not_started" name="Focus" icon={CodeIcon} tone="green" onToggle={() => {}} data-focus />
      </div>
      <Label>Display only (flat): not yet, taking now, done</Label>
      <div className="flex gap-3">
        {TILE_STATUSES.map((s) => (
          <StatusTile key={s.value} status={s.value} name={s.label} icon={CodeIcon} tone="green" />
        ))}
      </div>
    </>
  );
}

export function StatusControlDemo() {
  const [done, setDone] = useState(false);
  return (
    <div className="flex gap-4">
      <StatusControl done={done} restStatus="not_started" label="Sample, not started" onToggle={() => setDone((d) => !d)} />
      <StatusControl done={false} restStatus="in_progress" label="Sample, in progress" onToggle={() => {}} />
      <StatusControl done label="Sample, done" restStatus="not_started" onToggle={() => {}} />
      <StatusControl done={false} restStatus="not_started" label="Sample, 24" size={24} onToggle={() => {}} />
    </div>
  );
}

const PATH: PathStep[] = [
  { id: "a", title: "Pick your campuses and majors", done: true },
  { id: "b", title: "Enter your courses and grades", done: true },
  { id: "c", title: "Write your personal insight answers", done: false, caption: "1 of 4 written" },
  { id: "d", title: "Add activities and awards", done: false },
  { id: "e", title: "Submit by Nov 30", done: false },
];

export function StepPathDemo() {
  const [steps, setSteps] = useState(PATH);
  return (
    <>
      <Label>Done, current, not yet. The circle checks; the title opens the step</Label>
      <StepPath steps={steps} onToggle={(id, done) => setSteps((all) => all.map((s) => (s.id === id ? { ...s, done } : s)))} onOpen={() => {}} />
    </>
  );
}

export function CompactDemo() {
  return (
    <>
      <Label>Compact: rest, pressed (hold), and a text button</Label>
      <div className="flex flex-wrap items-center gap-3">
        <CompactButton variant="solid" icon={<CheckIcon weight="bold" size={16} aria-hidden />} onClick={() => {}}>
          Mark done
        </CompactButton>
        <CompactButton variant="text" icon={<BellIcon weight="bold" size={16} aria-hidden />} onClick={() => {}}>
          Remind me
        </CompactButton>
      </div>
    </>
  );
}

export function DateDemo() {
  return (
    <>
      <Label>Date tiles: open, due in 14 days or less, not open yet, done, missed, rolling</Label>
      <div className="flex flex-wrap gap-3">
        <DateTile month="Dec" day="15" status="open" />
        <DateTile month="Nov" day="30" status="soon" />
        <DateTile month="Jan" day="31" status="later" />
        <DateTile month="Sep" day="30" status="done" />
        <DateTile month="Sep" day="30" status="missed" />
        <DateTile status="rolling" />
      </div>
      <Label>Date rows; the third is pressed</Label>
      <ul className="-mx-2 flex flex-col gap-1">
        <li><DateRow month="Nov" day="30" status="soon" title="Sample deadline" detail="All UC campuses, 11:59 p.m. Pacific" onOpen={() => {}} aria-label="Sample, soon" /></li>
        <li><DateRow month="Dec" day="15" status="open" title="Window open" detail="Financial aid" onOpen={() => {}} aria-label="Sample, open" /></li>
        <li><DateRow month="Jan" day="31" status="later" title="Not open yet, with a longer title that wraps to two lines" detail="Opens Dec 15" onOpen={() => {}} aria-label="Sample, later" data-pressed /></li>
        <li><DateRow month="Sep" day="30" status="done" dimmed title="Done" detail="All UC campuses" onOpen={() => {}} aria-label="Sample, done" /></li>
        <li><DateRow month="Sep" day="30" status="missed" dimmed title="Missed" detail="All UC campuses" onOpen={() => {}} aria-label="Sample, missed" /></li>
      </ul>
    </>
  );
}
