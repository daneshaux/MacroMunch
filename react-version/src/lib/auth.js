import { supabase } from "./supabaseClient";

/**
 * NOTE: Client apps can't truly “check if email exists” without a server role key.
 * For now, keep this as a placeholder — Vishesh can expose a tiny endpoint
 * (or Cloud Function) that uses the service role to look up by email.
 */
export async function checkEmailExists(_email) {
  // TEMP: keep your current mock OR always return false to go to Create Account
  return false;
  // OR: return fetch("/api/check-email", { method:"POST", body: JSON.stringify({ email }) })
}

export async function loginWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, user: data.user, session: data.session };
}

/**
 * Create auth user, then create/update profile row.
 * Assumes you have a `profiles` table with RLS allowing
 * insert/update by authenticated user for their own row.
 */
export async function signUpWithPassword({ email, password, firstName, lastName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName }, // optional metadata
    },
  });

  if (error) {
    // Common: 'User already registered' message
    return { ok: false, error: error.message };
  }

  // If email confirmation is ON, data.session may be null until they confirm.
  const user = data.user;

  return { ok: true, user, session: data.session };
}

/**
 * Save profile details (metric) to your public.profile table (example).
 * You can merge this into signUpWithPassword if you prefer.
 */
export async function upsertProfile({
  userId,
  dob,           // 'YYYY-MM-DD'
  weight_kg,
  height_cm,
  activity_level,
  metabolism_sex,
}) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,          // convention: profiles.id === auth.user.id
      dob,
      weight_kg,
      height_cm,
      activity_level,
      metabolism_sex,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, profile: data };
}