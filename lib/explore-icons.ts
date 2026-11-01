import type { Icon } from "@phosphor-icons/react";
import {
  AtomIcon,
  BookOpenTextIcon,
  BriefcaseIcon,
  ChartLineUpIcon,
  ChatsCircleIcon,
  CodeIcon,
  CpuIcon,
  DnaIcon,
  FlaskIcon,
  FunctionIcon,
  GraduationCapIcon,
  GridFourIcon,
  HandCoinsIcon,
  MathOperationsIcon,
  PersonSimpleIcon,
  ScalesIcon,
  SigmaIcon,
  TreeStructureIcon,
  UsersThreeIcon,
  WaveSineIcon,
} from "@phosphor-icons/react/ssr";

// Explore's icons and search words, kept in code so the database and its verified rows don't change (21 → Row).

const MAJOR_ICONS: Record<string, Icon> = {
  "biological-sciences": DnaIcon,
  "business-administration": BriefcaseIcon,
  communication: ChatsCircleIcon,
  "computer-science": CodeIcon,
  economics: HandCoinsIcon,
  mathematics: SigmaIcon,
  "political-science": ScalesIcon,
  psychology: PersonSimpleIcon,
  sociology: UsersThreeIcon,
};

const TOPIC_ICONS: Record<string, Icon> = {
  cs1: CodeIcon,
  cs2: TreeStructureIcon,
  "comp-org": CpuIcon,
  "calculus-single": FunctionIcon,
  "calculus-multi": ChartLineUpIcon,
  discrete: MathOperationsIcon,
  "linear-algebra": GridFourIcon,
  "diff-eq": WaveSineIcon,
  "physics-year": AtomIcon,
  "physics-mechanics": AtomIcon,
  "science-second": FlaskIcon,
};

// Plain words a student might type for a major
const MAJOR_WORDS: Record<string, string[]> = {
  "computer-science": ["cs", "coding", "programming", "software"],
  "biological-sciences": ["bio", "biology"],
  "business-administration": ["business"],
  "political-science": ["poli sci", "politics"],
  psychology: ["psych"],
  economics: ["econ"],
  mathematics: ["math"],
  communication: ["comm"],
};

export const majorIcon = (slug: string): Icon => MAJOR_ICONS[slug] ?? GraduationCapIcon;
export const topicIcon = (topic: string): Icon => TOPIC_ICONS[topic] ?? BookOpenTextIcon;
export const majorWords = (slug: string): string[] => MAJOR_WORDS[slug] ?? [];
