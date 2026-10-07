"use client";

import { useState } from "react";
import { EnvelopeIcon, EyeIcon, LockIcon } from "@phosphor-icons/react/ssr";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ChoiceList, ChoiceRow } from "@/components/ui/choice-row";
import { DestructiveButton } from "@/components/ui/destructive-button";
import { Loading } from "@/components/ui/loading";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchField } from "@/components/ui/search-field";
import { SettingsGroup, SettingsRow } from "@/components/ui/settings-row";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { Toast } from "@/components/ui/toast";
import { TintedButton } from "@/components/ui/tinted-button";
import { UnderlineTabs } from "@/components/ui/underline-tabs";

function Label({ children }: { children: string }) {
  return <p className="mb-1.5 text-slate-600 type-caption">{children}</p>;
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
      <TintedButton onClick={() => setValue((v) => (v >= 100 ? 0 : v + 25))}>Change value</TintedButton>
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
      <EyeIcon size={22} />
    </button>
  );
  return (
    <>
      <TextField id="tf-rest" label="Rest" placeholder="you@example.com" icon={<EnvelopeIcon size={22} />} />
      <TextField id="tf-filled" label="Filled" defaultValue="alex@example.com" icon={<EnvelopeIcon size={22} />} />
      <TextField id="tf-focus" label="Focus" data-focus placeholder="you@example.com" icon={<EnvelopeIcon size={22} />} />
      <TextField id="tf-hint" label="Hint" hint="Use at least 8 characters." type="password" icon={<LockIcon size={22} />} trailing={eye} />
      <TextField id="tf-error" label="Error" error={error ? "Enter your email." : undefined} icon={<EnvelopeIcon size={22} />} />
      <TintedButton onClick={() => setError((e) => !e)}>Toggle error</TintedButton>
      <TextField id="tf-readonly" label="Read-only" readOnly defaultValue="alex@example.com" icon={<EnvelopeIcon size={22} />} />
      <TextField id="tf-disabled" label="Disabled" disabled defaultValue="alex@example.com" icon={<EnvelopeIcon size={22} />} />
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
      <TintedButton onClick={() => setOpen(true)}>Open sheet</TintedButton>
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
      <TintedButton onClick={() => setShown((n) => n + 1)}>Show toast</TintedButton>
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
      <TintedButton onClick={() => setRun((n) => n + 1)}>Start a wait</TintedButton>
    </>
  );
}
