import { TextLink } from "@/components/ui/text-link";

type SwitchLineProps = { text: string; link: string; href: string };

// The bottom line that switches between auth screens. It replaces the history entry,
// so Back doesn't bounce between them. Wraps between the two parts, never inside the link.
export function SwitchLine({ text, link, href }: SwitchLineProps) {
  return (
    <p className="mt-auto flex flex-wrap items-center justify-center gap-x-1.5 pt-5 text-center">
      <span className="text-slate-600 type-body">{text}</span>
      <TextLink href={href} replace className="whitespace-nowrap">
        {link}
      </TextLink>
    </p>
  );
}
