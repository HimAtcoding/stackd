import type { ReactNode } from "react";
import {
  ArrowLeftIcon,
  BarricadeIcon,
  BellIcon,
  CalendarDotsIcon,
  CheckIcon,
  FileTextIcon,
  HeartIcon,
  PencilSimpleIcon,
  PlusIcon,
  StarIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { Art } from "@/components/art";
import { providerLogos } from "@/components/auth/auth-screen";
import { Card } from "@/components/ui/card";
import { CircleButton } from "@/components/ui/circle-button";
import { DestructiveButton } from "@/components/ui/destructive-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Hero } from "@/components/ui/hero";
import { IconCircle } from "@/components/ui/icon-circle";
import { InlineError } from "@/components/ui/inline-error";
import { LabelledDivider } from "@/components/ui/labelled-divider";
import { Pill } from "@/components/ui/pill";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { ShortcutTile } from "@/components/ui/shortcut-tile";
import { SocialButton } from "@/components/ui/social-button";
import { StatusIcon } from "@/components/ui/status-icon";
import { TabBar } from "@/components/ui/tab-bar";
import { TextLink } from "@/components/ui/text-link";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { ProgressRing } from "@/components/ui/progress-ring";
import { WindowBar } from "@/components/ui/window-bar";
import {
  BottomSheetDemo,
  ChipDemo,
  ChoiceDemo,
  CompactDemo,
  DateDemo,
  ExploreDemo,
  LoadingDemo,
  ProgressDemo,
  SearchFieldDemo,
  SettingsRowDemo,
  StatusControlDemo,
  StatusTileDemo,
  StepPathDemo,
  SwitchDemo,
  TabsDemo,
  TextFieldDemo,
  ToastDemo,
} from "./demos";

export const metadata = { title: "Components · Stackd dev" };

const COLORS = [
  "blue-600", "blue-700", "yellow-400", "yellow-700", "green-600", "green-700", "green-800", "navy-900", "slate-700",
  "slate-600", "slate-400", "border", "border-strong", "field-border", "surface", "page", "surface-pressed", "white",
  "indigo-600", "indigo-800", "amber-700", "amber-800", "amber-900", "coral-700", "coral-800", "coral-500", "coral-50",
  "coral-25", "yellow-50", "mint-100", "mint-800", "sky-100",
];

const TYPE = [
  "celebrate", "hero-number", "display", "title-1", "title-2", "title-3", "headline", "row-title", "body-lg", "body",
  "body-md", "label", "pill", "caption", "code", "tab", "button-lg", "button", "link", "segment", "demo",
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

// The hero's progress track and honey fill, as a still specimen
function ProgressBarOnHero() {
  return (
    <div aria-hidden className="mt-3 h-3 rounded-full bg-(--partner)">
      <div className="h-full w-3/5 rounded-full bg-yellow-400" />
    </div>
  );
}

export default function ComponentsPage() {
  return (
    <main
      className="mx-auto max-w-[480px] px-4 pb-24"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)" }}
    >
      <h1 className="text-navy-900 type-title-1">Components</h1>
      <p className="mt-2 text-slate-600 type-body">Every shared component from 00-foundations rev 2, in every state. Hold anything with an edge to see it sink.</p>

      <Section title="Color">
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span className="size-8 shrink-0 rounded-sm border-2 border-border" style={{ background: `var(--${c})` }} />
              <code className="text-navy-900 type-caption">--{c}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        {TYPE.map((t) => (
          <div key={t} className="flex items-baseline justify-between gap-3 border-b-2 border-border pb-2">
            <span className={`type-${t} min-w-0 truncate text-navy-900`}>Transfer plans</span>
            <code className="shrink-0 text-slate-600 type-caption">{t}</code>
          </div>
        ))}
      </Section>

      <Section title="Radius">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex h-16 items-center justify-center rounded-sm border-2 border-border type-caption">r-sm 12</div>
          <div className="flex h-16 items-center justify-center rounded-md border-2 border-border type-caption">r-md 16</div>
          <div className="flex h-16 items-center justify-center rounded-lg border-2 border-border type-caption">r-lg 20</div>
          <div className="flex h-16 items-center justify-center rounded-hero border-2 border-border type-caption">r-hero 24</div>
        </div>
      </Section>

      <Section title="Edges">
        <p className="text-slate-600 type-body">An edge means you can tap it. Hold any of these to see it sink.</p>
        <div className="grid grid-cols-3 gap-3">
          <a href="#edges" className="flex h-16 items-center justify-center rounded-md border-2 border-border bg-surface type-caption edge-sm">edge-sm 3</a>
          <a href="#edges" className="flex h-16 items-center justify-center rounded-md border-2 border-border bg-surface type-caption edge-md">edge-md 4</a>
          <a href="#edges" className="flex h-16 items-center justify-center rounded-md bg-blue-600 text-white type-caption edge-lg edge-blue-700">edge-lg 6</a>
          <a href="#edges" data-pressed className="flex h-16 items-center justify-center rounded-md border-2 border-border bg-surface type-caption edge-md">Pressed</a>
          <div className="flex h-16 items-center justify-center rounded-md border-2 border-border bg-surface type-caption">Passive: flat</div>
        </div>
      </Section>

      <Section title="Primary button">
        <State name="Rest"><PrimaryButton>Get started</PrimaryButton></State>
        <State name="Pressed"><PrimaryButton data-pressed>Get started</PrimaryButton></State>
        <State name="Focus"><PrimaryButton data-focus>Get started</PrimaryButton></State>
        <State name="Disabled"><PrimaryButton disabled>Get started</PrimaryButton></State>
        <State name="Loading"><PrimaryButton loading>Sign in</PrimaryButton></State>
      </Section>

      <Section title="Primary button on a hero">
        <Hero tone="blue">
          <div className="flex flex-col items-start gap-3">
            <PrimaryButton onHero>Keep going</PrimaryButton>
            <PrimaryButton onHero data-pressed>Pressed</PrimaryButton>
            <PrimaryButton onHero data-focus>Focus</PrimaryButton>
          </div>
        </Hero>
      </Section>

      <Section title="Secondary button">
        <State name="Rest"><SecondaryButton icon={<PencilSimpleIcon weight="fill" size={20} />}>Edit draft</SecondaryButton></State>
        <State name="Pressed"><SecondaryButton data-pressed icon={<PencilSimpleIcon weight="fill" size={20} />}>Edit draft</SecondaryButton></State>
        <State name="Focus"><SecondaryButton data-focus>Try again</SecondaryButton></State>
      </Section>

      <Section title="Compact and text button">
        <CompactDemo />
      </Section>

      <Section title="Circle button">
        <div className="flex flex-wrap items-end gap-4">
          <State name="Back"><CircleButton aria-label="Back" icon={<ArrowLeftIcon weight="bold" size={22} />} /></State>
          <State name="Save"><CircleButton aria-label="Save" icon={<HeartIcon weight="bold" size={22} />} /></State>
          <State name="Saved"><CircleButton aria-label="Saved" icon={<HeartIcon weight="fill" size={22} />} /></State>
          <State name="Bell"><CircleButton aria-label="Notifications" icon={<BellIcon weight="bold" size={24} />} /></State>
          <State name="Pressed"><CircleButton data-pressed aria-label="Back" icon={<ArrowLeftIcon weight="bold" size={22} />} /></State>
          <State name="Focus"><CircleButton data-focus aria-label="Back" icon={<ArrowLeftIcon weight="bold" size={22} />} /></State>
          <State name="Plus"><CircleButton variant="plus" aria-label="New essay" icon={<PlusIcon weight="bold" size={24} />} /></State>
          <State name="Plus pressed"><CircleButton data-pressed variant="plus" aria-label="New essay" icon={<PlusIcon weight="bold" size={24} />} /></State>
          <State name="Done"><CircleButton variant="done" aria-label="Mark done" icon={<CheckIcon weight="bold" size={22} />} /></State>
        </div>
      </Section>

      <Section title="Card">
        <State name="Static"><Card><p className="type-title-3">Card title</p><p className="mt-1 text-slate-600 type-body">Card body text.</p></Card></State>
        <State name="Tappable, rest"><Card href="/dev/components"><p className="type-title-3">Tappable card</p></Card></State>
        <State name="Tappable, pressed"><Card href="/dev/components" data-pressed><p className="type-title-3">Tappable card</p></Card></State>
        <State name="Tappable, focus"><Card href="/dev/components" data-focus><p className="type-title-3">Tappable card</p></Card></State>
      </Section>

      <Section title="Hero">
        <State name="Blue, passive">
          <Hero tone="blue">
            <p className="text-white type-label">Up next</p>
            <p className="mt-3 type-hero-number">22</p>
            <ProgressBarOnHero />
          </Hero>
        </State>
        <State name="Coral, 14 days or less">
          <Hero tone="coral">
            <p className="type-hero-number">9</p>
            <ProgressBarOnHero />
          </Hero>
        </State>
        <State name="Green, the whole hero is the button: rest, pressed, focus">
          <div className="flex flex-col gap-4">
            <Hero tone="green" href="/dev/components" aria-label="Sample major">
              <p className="text-white type-label">Your major</p>
              <p className="mt-1 type-title-2">Computer Science</p>
              <SegmentedBar steps={[true, true, "taking", false, false]} onFill className="mt-3" />
            </Hero>
            <Hero tone="green" href="/dev/components" aria-label="Sample major, pressed" data-pressed>
              <p className="type-title-2">Pressed</p>
            </Hero>
            <Hero tone="green" href="/dev/components" aria-label="Sample major, focus" data-focus>
              <p className="type-title-2">Focus</p>
            </Hero>
          </div>
        </State>
        <State name="Indigo">
          <Hero tone="indigo">
            <p className="type-title-2">Personal insight answers</p>
            <SegmentedBar steps={[true, "taking", false, false]} onFill className="mt-3" />
          </Hero>
        </State>
      </Section>

      <Section title="Icon circle">
        <div className="flex flex-wrap items-center gap-3">
          {(["blue", "green", "indigo", "amber", "yellow", "coral"] as const).map((t) => (
            <IconCircle key={t} tone={t}>
              <StarIcon weight="fill" size={22} />
            </IconCircle>
          ))}
          <IconCircle tone="green" size={40}>
            <StarIcon weight="fill" size={20} />
          </IconCircle>
        </div>
      </Section>

      <Section title="Shortcut tile">
        <div className="grid grid-cols-2 gap-3">
          <ShortcutTile href="/dev/components" icon={<FileTextIcon weight="fill" size={22} />} tone="green" title="Sample tile" subtitle="Sample subtitle" />
          <ShortcutTile href="/dev/components" icon={<PencilSimpleIcon weight="fill" size={22} />} tone="indigo" title="Pressed" subtitle="Sample subtitle" data-pressed />
          <ShortcutTile href="/dev/components" icon={<UsersThreeIcon weight="fill" size={22} />} tone="blue" title="Unread" subtitle="Sample subtitle" unread />
          <ShortcutTile href="/dev/components" icon={<CalendarDotsIcon weight="fill" size={22} />} tone="indigo" title="Focus" subtitle="Sample subtitle" data-focus />
        </div>
      </Section>

      <Section title="Pill">
        <div className="flex flex-wrap gap-3">
          <Pill variant="due">Dec 9, 9 days left</Pill>
          <Pill variant="soon">Jan 6, 59 days left</Pill>
          <Pill variant="good">Fits you</Pill>
          <Pill variant="neutral">Mar 2, 114 days left</Pill>
        </div>
      </Section>

      <Section title="Status icon">
        <div className="flex gap-6">
          <State name="Done"><StatusIcon status="done" /></State>
          <State name="In progress"><StatusIcon status="in_progress" /></State>
          <State name="Not started"><StatusIcon status="not_started" /></State>
        </div>
        <State name="As a control (tap the first)"><StatusControlDemo /></State>
      </Section>

      <Section title="Status tile">
        <StatusTileDemo />
      </Section>

      <Section title="Step path">
        <StepPathDemo />
      </Section>

      <Section title="Segmented bar">
        <State name="On white: done, taking now, not yet"><SegmentedBar steps={[true, true, "taking", false, false]} /></State>
      </Section>

      <Section title="Progress bar">
        <ProgressDemo />
      </Section>

      <Section title="Underline tabs">
        <TabsDemo />
      </Section>

      <Section title="Tab bar">
        {(["home", "explore", "essays", "you"] as const).map((t) => (
          <State key={t} name={`Active: ${t}`}>
            <TabBar active={t} still />
          </State>
        ))}
      </Section>

      <Section title="Text field">
        <TextFieldDemo />
      </Section>

      <Section title="Search field">
        <SearchFieldDemo />
      </Section>

      <Section title="Choice row">
        <ChoiceDemo />
      </Section>

      <Section title="Settings row">
        <SettingsRowDemo />
      </Section>

      <Section title="Destructive button">
        <State name="Rest"><DestructiveButton>Delete account</DestructiveButton></State>
        <State name="Pressed"><DestructiveButton data-pressed>Delete account</DestructiveButton></State>
        <State name="Focus"><DestructiveButton data-focus>Delete account</DestructiveButton></State>
        <State name="Loading"><DestructiveButton loading>Delete account</DestructiveButton></State>
      </Section>

      <Section title="Bottom sheet">
        <BottomSheetDemo />
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

      <Section title="Filter chip (14, 22)">
        <ChipDemo />
      </Section>

      <Section title="Switch (14)">
        <SwitchDemo />
      </Section>

      <Section title="Window bar (14)">
        <State name="Open, 25% gone"><WindowBar progress={0.25} soon={false} start="Opened Oct 1" end="Nov 30" /></State>
        <State name="14 days or less"><WindowBar progress={0.85} soon start="Opened Oct 1" end="Nov 30" /></State>
        <State name="Not open yet"><WindowBar progress={null} soon={false} start="Opens Dec 15" end="Jan 31" /></State>
        <State name="On a hero">
          <Hero tone="blue">
            <WindowBar progress={0.6} soon={false} onFill start="Opened Oct 1" end="Nov 30" />
          </Hero>
        </State>
      </Section>

      <Section title="Progress ring (14)">
        <div className="flex items-center gap-4">
          <State name="0 of 6"><ProgressRing done={0} total={6} size={56} /></State>
          <State name="2 of 6"><ProgressRing done={2} total={6} size={56} /></State>
          <State name="Done"><ProgressRing done={6} total={6} size={56} /></State>
          <State name="40"><ProgressRing done={2} total={6} size={40} /></State>
        </div>
      </Section>

      <Section title="Date tile and row (18)">
        <DateDemo />
      </Section>

      <Section title="Explore (21)">
        <ExploreDemo />
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
        <div className="rounded-lg border-2 border-border">
          <EmptyState
            icon={<BarricadeIcon weight="fill" size={32} />}
            title="This part isn't built yet"
            body="It's on the list. Your plan is still on the home screen."
            action={<SecondaryButton>Back to home</SecondaryButton>}
          />
        </div>
      </Section>

      <Section title="Inline error">
        <State name="With retry">
          <InlineError title="Couldn't load requirements" body="Check your connection, then try again." action={<SecondaryButton>Try again</SecondaryButton>} />
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
