import { Capacitor, registerPlugin } from "@capacitor/core";

// True inside the iOS app; false on the web, where nothing below runs.
export const isNativeApp = () => Capacitor.isNativePlatform();

// ios/App/App/AppleSignInPlugin.swift
interface AppleSignInPlugin {
  authorize(options: { nonce: string }): Promise<{ identityToken: string; givenName?: string; familyName?: string }>;
}

const AppleSignIn = registerPlugin<AppleSignInPlugin>("AppleSignIn");

export type AppleAuthorization =
  | { ok: true; identityToken: string; givenName: string | null }
  | { ok: false; cancelled: boolean };

// Apple's own sign-in sheet. Takes the hashed nonce. Closing the sheet is a cancel, not a failure.
export async function authorizeWithApple(hashedNonce: string): Promise<AppleAuthorization> {
  try {
    const { identityToken, givenName } = await AppleSignIn.authorize({ nonce: hashedNonce });
    return { ok: true, identityToken, givenName: givenName?.trim() || null };
  } catch (e) {
    return { ok: false, cancelled: (e as { code?: string }).code === "cancelled" };
  }
}

// ios/App/App/GoogleSignInPlugin.swift
interface GoogleSignInPlugin {
  authorize(options: { nonce: string }): Promise<{ idToken: string; givenName?: string }>;
}

const GoogleSignIn = registerPlugin<GoogleSignInPlugin>("GoogleSignIn");

export type GoogleAuthorization =
  | { ok: true; idToken: string; givenName: string | null }
  | { ok: false; reason: "cancelled" | "not_configured" | "failed" };

// Google's own sign-in sheet, through Google's iOS SDK. Takes the hashed nonce. "not_configured": this build has no iOS
// client ID yet (the GOOGLE_IOS_CLIENT_ID_PREFIX build setting).
export async function authorizeWithGoogle(hashedNonce: string): Promise<GoogleAuthorization> {
  try {
    const { idToken, givenName } = await GoogleSignIn.authorize({ nonce: hashedNonce });
    return { ok: true, idToken, givenName: givenName?.trim() || null };
  } catch (e) {
    const code = (e as { code?: string }).code;
    return { ok: false, reason: code === "cancelled" || code === "not_configured" ? code : "failed" };
  }
}

export type BrowserReturn = { kind: "returned"; url: string } | { kind: "closed" };

// Opens a provider's sign-in page in the in-app browser (SFSafariViewController, not a web view, as Google requires)
// and waits for it to send the app its callback URL, or for the student to close it.
export async function openForCallback(url: string, isCallback: (url: string) => boolean): Promise<BrowserReturn> {
  const [{ App }, { Browser }] = await Promise.all([import("@capacitor/app"), import("@capacitor/browser")]);
  let settle: (result: BrowserReturn) => void = () => {};
  const done = new Promise<BrowserReturn>((resolve) => (settle = resolve));
  const listeners = await Promise.all([
    App.addListener("appUrlOpen", ({ url: opened }) => {
      if (!isCallback(opened)) return;
      settle({ kind: "returned", url: opened });
      Browser.close().catch(() => {});
    }),
    Browser.addListener("browserFinished", () => settle({ kind: "closed" })),
  ]);
  try {
    await Browser.open({ url });
    return await done;
  } finally {
    await Promise.all(listeners.map((l) => l.remove()));
  }
}
