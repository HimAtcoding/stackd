import { DEMO_MODE } from "@/lib/flags";
import { demoAuth } from "./demo";
import { supabaseAuth } from "./supabase";
import type { Auth } from "./types";

// Supabase email sign-in by default; demo accounts only for local demos (NEXT_PUBLIC_DEMO_STRIP=on).
export const auth: Auth = DEMO_MODE ? demoAuth : supabaseAuth;

export type { Auth, AuthError, AuthResult, OAuthProvider, OAuthResult, OAuthReturn } from "./types";
