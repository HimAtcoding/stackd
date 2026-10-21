import { isNativeApp } from "@/lib/capacitor";

// Copying, pasting and sharing text (19). In the iPhone app these use Capacitor's Clipboard and Share plugins, so iOS
// shows its own paste permission and share sheet; on the web, the browser's own APIs. Plugins are loaded only when
// used and never passed through a promise (lib/reminders/native.ts explains why).

export async function copyText(text: string): Promise<boolean> {
  try {
    if (isNativeApp()) {
      const { Clipboard } = await import("@capacitor/clipboard");
      await Clipboard.write({ string: text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    return true;
  } catch {
    return false;
  }
}

// The clipboard's text, "" when it holds none, or null when it can't be read (permission refused)
export async function readClipboard(): Promise<string | null> {
  try {
    if (isNativeApp()) {
      const { Clipboard } = await import("@capacitor/clipboard");
      const { type, value } = await Clipboard.read();
      return type.startsWith("text") || type === "string" ? value : "";
    }
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

export type ShareOutcome = "shared" | "cancelled" | "copied" | "failed";

const cancelled = (e: unknown) => {
  const text = String((e as { message?: string; name?: string })?.message ?? e).toLowerCase();
  return (e as { name?: string })?.name === "AbortError" || text.includes("cancel");
};

// The share sheet with plain text. A browser without one copies the text instead.
export async function shareText(title: string, text: string): Promise<ShareOutcome> {
  try {
    if (isNativeApp()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, dialogTitle: title });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return "shared";
    }
  } catch (e) {
    return cancelled(e) ? "cancelled" : "failed";
  }
  return (await copyText(text)) ? "copied" : "failed";
}

// All answers as one .txt: on the web, a download; in the iPhone app, the share sheet with the text (Notes, Mail,
// Messages), since writing a file there would need the Filesystem plugin and its privacy manifest entry
export async function shareTextFile(name: string, content: string): Promise<ShareOutcome> {
  if (isNativeApp()) return shareText(name.replace(/\.txt$/, ""), content);
  try {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "shared";
  } catch {
    return "failed";
  }
}

// The text of a .docx, .txt or .md file, read on the device; nothing is uploaded. Null when it can't be read.
export async function readDraftFile(file: File): Promise<string | null> {
  try {
    if (/\.docx$/i.test(file.name)) {
      // mammoth's package.json maps its file reading to browser versions; raw text only, no formatting
      const { extractRawText } = await import("mammoth");
      const { value } = await extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return value;
    }
    if (/\.(txt|md)$/i.test(file.name) || file.type.startsWith("text/")) return await file.text();
    return null;
  } catch {
    return null;
  }
}
