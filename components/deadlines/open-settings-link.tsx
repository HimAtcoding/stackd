import { cn } from "@/lib/cn";

// Opens Stackd's page in the iPhone's Settings app, where notifications can be turned back on.
// app-settings: is iOS's own link for it (UIApplication.openSettingsURLString).
export function OpenSettingsLink({ className }: { className?: string }) {
  return (
    <a href="app-settings:" className={cn("-my-[13px] inline-block py-[13px] text-blue-600 type-label pressed:underline focus-ring:underline", className)}>
      Open Settings
    </a>
  );
}
