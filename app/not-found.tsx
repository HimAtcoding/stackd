import { GoHome } from "@/components/unbuilt-route";

// Any address Stackd doesn't have replaces itself with Home, which sends a signed-out visitor to Welcome or Sign in.
// Next's own 404 has no way out, and the iOS app has no browser Back (13: no dead ends).
export default function NotFound() {
  return <GoHome />;
}
