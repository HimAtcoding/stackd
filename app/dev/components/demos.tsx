"use client";

import { useState } from "react";
import { EnvelopeIcon, EyeIcon, LockIcon } from "@phosphor-icons/react/ssr";
import { Loading } from "@/components/ui/loading";
import { ProgressBar } from "@/components/ui/progress-bar";
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
