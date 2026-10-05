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
    // No email links: codes are typed into the app, so nothing arrives through the URL
    auth: { storageKey: AUTH_STORAGE_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
