import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Where supabase-js keeps the signed-in session. Starts with "stackd." so /dev/reset clears it too.
export const AUTH_STORAGE_KEY = "stackd.auth";

let client: SupabaseClient | null | undefined;

// The app's Supabase client: the public URL and anon key only, so row-level security decides what it can reach.
// The service role key never goes here; it's for local import scripts only. Null on the server or without config.
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof window === "undefined" || !url || !anonKey) return null;
  client = createClient(url, anonKey, {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      // Apple and Google come back with a one-time code that only this browser can exchange. Typed email codes
      // work the same as before under PKCE (Supabase returns the session directly).
      flowType: "pkce",
      // Only /auth/callback/ reads a code from the URL, on purpose; email codes are typed, never links
      detectSessionInUrl: false,
    },
  });
  return client;
}
