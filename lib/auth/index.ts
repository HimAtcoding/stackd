import { demoAuth } from "./demo";
import type { Auth } from "./types";

// Real auth replaces the demo here.
export const auth: Auth = demoAuth;

export type { Auth, AuthError, AuthResult, OAuthProvider } from "./types";
