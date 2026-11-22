import { isNativeApp } from "./capacitor";

// A light tap when the student marks something done (03, 14). In the iPhone app it's iOS's own light impact
// (@capacitor/haptics); on the web, a 10 ms vibration where the browser supports one (iOS Safari doesn't).
export function lightTap() {
  if (isNativeApp()) {
    import("@capacitor/haptics").then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light })).catch(() => {});
    return;
  }
  try {
    navigator.vibrate?.(10);
  } catch {}
}
