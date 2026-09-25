import { SessionGate } from "./session-gate";

// Every screen in this group needs a session.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <SessionGate>{children}</SessionGate>;
}
