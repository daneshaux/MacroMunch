import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Singleton guard (prevents extra clients during HMR)
let _supabase = globalThis.__mm_supabase;
if (!_supabase) {
  _supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "mm-sb-auth", // <- custom key so we don't collide
    },
  });
  globalThis.__mm_supabase = _supabase;
}

export const supabase = _supabase;