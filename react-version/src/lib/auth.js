import { supabase } from "./supabaseClient";

/**
 * TEMP: always return false so we go to Create Account.
 * Later we can replace this with a real endpoint if needed.
 */

export async function checkEmailExists(email) {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // These two lines let Supabase verify the JWT using the anon key
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      }
    );

    const json = await res.json().catch(() => null);

    if (!json) return false;
    console.log("[Auth] checkEmailExists response:", json); // 👀

    return !!json.exists;
  } catch (err) {
    console.error("[Auth] checkEmailExists error", err);
    // If the function is down, don’t block signup – treat as "no account yet"
    return false;
  }
}

export async function loginWithPassword({ email, password }) {
  console.log("[Auth] loginWithPassword", email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[Auth] login error:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, user: data.user, session: data.session };
}

/**
 * Create auth user.
 * Email confirmation is OFF right now, so you should get a session back.
 */
export async function signUpWithPassword({
  email,
  password,
  firstName,
  lastName,
}) {
  console.log("[Auth] signUpWithPassword", email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    console.error("[Auth] signup error:", error);
    return { ok: false, error: error.message };
  }

  const { user, session } = data;
  console.log("[Auth] signUpWithPassword ok", user?.id);
  
  return { ok: true, user, session: data.session };
}

/**
 * Save profile details to public.profiles.
 * NOTE: our RLS expects user_id to match auth.uid().
 */
export async function upsertProfile({
  userId,
  email,
  dob,           // 'YYYY-MM-DD'
  weight_kg,
  height_cm,
  activity_level,
  metabolism_sex,
  goal = "maintain",
  meals_per_day = 4,
}) {
  console.log("[Profiles] upsertProfile for", userId);

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,             // <-- matches your table column
        email: email.toLowerCase(),  // <-- NEW: store email
        dob,
        weight_kg,
        height_cm,
        activity_level,
        metabolism_sex,
        goal,
        meals_per_day,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",       // we made user_id unique
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[Profiles] upsert error:", error);
    return { ok: false, error: error.message };
  }

  console.log("[Profiles] upsert ok", userId);
  return { ok: true, profile: data };
}