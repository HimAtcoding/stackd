import { DEMO_MODE } from "@/lib/flags";
import { demoAuth } from "./demo";
import { supabaseAuth } from "./supabase";
import type { Auth } from "./types";

// Demo accounts for local demos (NEXT_PUBLIC_DEMO_STRIP on, the default); Supabase email sign-in otherwise.
export const auth: Auth = DEMO_MODE ? demoAuth : supabaseAuth;

export type { Auth, AuthError, AuthResult, OAuthProvider } from "./types";
