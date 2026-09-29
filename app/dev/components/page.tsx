import type { ReactNode } from "react";
import {
  ArrowLeftIcon,
  BarricadeIcon,
  BellIcon,
  CalendarDotsIcon,
  FileTextIcon,
  HeartIcon,
  PencilSimpleIcon,
  PlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { Art } from "@/components/art";
import { providerLogos } from "@/components/auth/auth-screen";
import { Card } from "@/components/ui/card";
import { CircleButton } from "@/components/ui/circle-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
import { LabelledDivider } from "@/components/ui/labelled-divider";
import { Pill } from "@/components/ui/pill";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ShortcutTile } from "@/components/ui/shortcut-tile";
import { SocialButton } from "@/components/ui/social-button";
import { StatusIcon } from "@/components/ui/status-icon";
import { TabBar } from "@/components/ui/tab-bar";
import { TextLink } from "@/components/ui/text-link";
import { TintedButton } from "@/components/ui/tinted-button";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { LoadingDemo, ProgressDemo, TabsDemo, TextFieldDemo, ToastDemo } from "./demos";

export const metadata = { title: "Components · Stackd dev" };

const COLORS = [
  "blue-600", "blue-700", "blue-100", "blue-50", "blue-50-border", "sky-200", "sky-100", "sky-50",
  "surface", "white", "navy-900", "slate-700", "slate-600", "slate-400", "border", "border-strong",
  "field-border", "surface-pressed", "tint-sky", "tint-indigo", "node-empty", "green-600", "mint-100",
  "mint-800", "coral-500", "coral-700", "coral-50", "coral-25", "amber-50", "amber-500", "yellow-400",
  "confetti-sky",
];

const TYPE = [
  "celebrate", "display", "title-1", "title-2", "title-3", "headline", "row-title", "body-lg", "body",
  "body-md", "label", "pill", "caption", "tab", "button-lg", "button", "link", "segment", "demo",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-navy-900 type-title-2">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function State({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-slate-600 type-caption">{name}</p>
      {children}
    </div>
  );
}

const { appleLogo, googleLogo } = providerLogos();

export default function ComponentsPage() {
  return (
    <main
      className="mx-auto max-w-[480px] px-4 pb-24"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)" }}
    >
      <h1 className="text-navy-900 type-title-1">Components</h1>
      <p className="mt-2 text-slate-600 type-body">Every shared component from 00-foundations, in every state.</p>

      <Section title="Color">
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span className="size-8 shrink-0 rounded-sm border border-border" style={{ background: `var(--${c})` }} />
              <code className="text-navy-900 type-caption">--{c}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        {TYPE.map((t) => (
          <div key={t} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
            <span className={`type-${t} min-w-0 truncate text-navy-900`}>Transfer plans</span>
            <code className="shrink-0 text-slate-600 type-caption">{t}</code>
          </div>
        ))}
      </Section>

      <Section title="Radius and elevation">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex h-16 items-center justify-center rounded-sm bg-surface shadow-card type-caption">r-sm 12</div>
          <div className="flex h-16 items-center justify-center rounded-md bg-surface shadow-card type-caption">r-md 16</div>
          <div className="flex h-16 items-center justify-center rounded-lg bg-surface shadow-card type-caption">r-lg 20</div>
          <div className="flex h-16 items-center justify-center rounded-lg bg-surface shadow-card type-caption">shadow-card</div>
          <div className="flex h-16 items-center justify-center rounded-lg bg-surface shadow-float type-caption">shadow-float</div>
          <div className="flex h-16 items-center justify-center rounded-lg bg-surface shadow-cta type-caption">shadow-cta</div>
        </div>
      </Section>

      <Section title="Primary button">
        <State name="Rest"><PrimaryButton>Get started</PrimaryButton></State>
        <State name="Pressed"><PrimaryButton data-pressed>Get started</PrimaryButton></State>
        <State name="Focus"><PrimaryButton data-focus>Get started</PrimaryButton></State>
        <State name="Disabled"><PrimaryButton disabled>Get started</PrimaryButton></State>
        <State name="Loading"><PrimaryButton loading>Sign in</PrimaryButton></State>
      </Section>

      <Section title="Tinted button">
        <State name="Rest"><TintedButton icon={<PencilSimpleIcon weight="fill" size={20} />}>Edit draft</TintedButton></State>
        <State name="Pressed"><TintedButton data-pressed icon={<PencilSimpleIcon weight="fill" size={20} />}>Edit draft</TintedButton></State>
        <State name="Focus"><TintedButton data-focus>Try again</TintedButton></State>
      </Section>

      <Section title="Circle button">
        <div className="flex flex-wrap items-end gap-4 rounded-lg bg-sky-200 p-4">
          <State name="Back"><CircleButton aria-label="Back" icon={<ArrowLeftIcon weight="bold" size={22} />} /></State>
          <State name="Save"><CircleButton aria-label="Save" icon={<HeartIcon size={22} />} /></State>
          <State name="Saved"><CircleButton aria-label="Saved" icon={<HeartIcon weight="fill" size={22} />} /></State>
          <State name="Bell"><CircleButton aria-label="Notifications" icon={<BellIcon size={24} />} /></State>
          <State name="Pressed"><CircleButton data-pressed aria-label="Back" icon={<ArrowLeftIcon weight="bold" size={22} />} /></State>
          <State name="Focus"><CircleButton data-focus aria-label="Back" icon={<ArrowLeftIcon weight="bold" size={22} />} /></State>
          <State name="Plus"><CircleButton variant="plus" aria-label="New essay" icon={<PlusIcon weight="bold" size={24} />} /></State>
          <State name="Plus pressed"><CircleButton data-pressed variant="plus" aria-label="New essay" icon={<PlusIcon weight="bold" size={24} />} /></State>
        </div>
      </Section>

      <Section title="Card">
        <State name="Static"><Card><p className="type-title-3">Card title</p><p className="mt-1 text-slate-600 type-body">Card body text.</p></Card></State>
        <State name="Tappable, rest"><Card href="/dev/components"><p className="type-title-3">Tappable card</p></Card></State>
        <State name="Tappable, pressed"><Card href="/dev/components" data-pressed><p className="type-title-3">Tappable card</p></Card></State>
        <State name="Tappable, focus"><Card href="/dev/components" data-focus><p className="type-title-3">Tappable card</p></Card></State>
      </Section>

      <Section title="Shortcut tile">
        <div className="grid grid-cols-2 gap-3">
          <ShortcutTile href="/dev/components" icon={<FileTextIcon weight="fill" size={24} className="text-blue-600" />} iconTint="sky" title="Sample tile" subtitle="Sample subtitle" />
          <ShortcutTile href="/dev/components" icon={<PencilSimpleIcon weight="fill" size={24} className="text-blue-600" />} iconTint="indigo" title="Pressed" subtitle="Sample subtitle" data-pressed />
          <ShortcutTile href="/dev/components" icon={<UsersThreeIcon weight="fill" size={24} className="text-blue-600" />} iconTint="sky" title="Unread" subtitle="Sample subtitle" unread />
          <ShortcutTile href="/dev/components" icon={<CalendarDotsIcon weight="fill" size={24} className="text-blue-600" />} iconTint="indigo" title="Focus" subtitle="Sample subtitle" data-focus />
        </div>
      </Section>

      <Section title="Pill">
        <div className="flex gap-3">
          <Pill variant="due">Due soon</Pill>
          <Pill variant="progress">In progress</Pill>
        </div>
      </Section>

      <Section title="Status icon">
        <div className="flex gap-6">
          <State name="Done"><StatusIcon status="done" /></State>
          <State name="In progress"><StatusIcon status="in_progress" /></State>
          <State name="Not started"><StatusIcon status="not_started" /></State>
        </div>
      </Section>

      <Section title="Progress bar">
        <ProgressDemo />
      </Section>

      <Section title="Underline tabs">
        <TabsDemo />
      </Section>

      <Section title="Tab bar">
        {(["home", "explore", "essays", "mentors"] as const).map((t) => (
          <State key={t} name={`Active: ${t}`}>
            <TabBar active={t} still />
          </State>
        ))}
      </Section>

      <Section title="Text field">
        <TextFieldDemo />
      </Section>

      <Section title="Social button">
        <State name="Rest"><SocialButton logo={appleLogo}>Continue with Apple</SocialButton></State>
        <State name="Rest"><SocialButton logo={googleLogo}>Continue with Google</SocialButton></State>
        <State name="Pressed"><SocialButton data-pressed logo={appleLogo}>Continue with Apple</SocialButton></State>
        <State name="Focus"><SocialButton data-focus logo={googleLogo}>Continue with Google</SocialButton></State>
        <State name="Disabled"><SocialButton disabled logo={googleLogo}>Continue with Google</SocialButton></State>
        <State name="Pending"><SocialButton loading logo={appleLogo}>Continue with Apple</SocialButton></State>
      </Section>

      <Section title="Labelled divider">
        <LabelledDivider label="or" />
      </Section>

      <Section title="Text link">
        <div className="flex flex-wrap gap-6">
          <State name="Link"><TextLink href="/dev/components">View feedback</TextLink></State>
          <State name="Small"><TextLink href="/dev/components" size="label">Forgot password?</TextLink></State>
          <State name="Pressed"><TextLink href="/dev/components" data-pressed>View feedback</TextLink></State>
          <State name="Focus"><TextLink href="/dev/components" data-focus>View feedback</TextLink></State>
        </div>
      </Section>

      <Section title="Toast">
        <ToastDemo />
      </Section>

      <Section title="Demo strip">
        <div className="flex h-6 items-center justify-center bg-navy-900 text-white type-demo">Demo data</div>
      </Section>

      <Section title="Unofficial footer line">
        <UnofficialFooter />
      </Section>

      <Section title="Empty state">
        <div className="rounded-lg bg-surface">
          <EmptyState
            icon={<BarricadeIcon weight="fill" size={32} />}
            title="This part isn't built yet"
            body="It's on the list. Your plan is still on the home screen."
            action={<TintedButton>Back to home</TintedButton>}
          />
        </div>
      </Section>

      <Section title="Inline error">
        <State name="With retry">
          <InlineError title="Couldn't load requirements" body="Check your connection, then try again." action={<TintedButton>Try again</TintedButton>} />
        </State>
        <State name="Fix is in the student's hands">
          <InlineError title="Couldn't sign you in" body="That email and password don't match. Check them, or reset your password." />
        </State>
      </Section>

      <Section title="Loading">
        <LoadingDemo />
      </Section>

      <Section title="Art placeholder">
        <State name="Labelled (48 and up)"><Art id="husky-wave" width={176} height={186} /></State>
        <State name="Small (under 48): no label, ID in data-asset">
          <div className="flex gap-3">
            <Art id="burst-dashes" width={28} height={28} />
          </div>
        </State>
      </Section>

    </main>
  );
}
