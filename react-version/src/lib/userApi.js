import { apiFetch } from "./api";
import { mapActivity, mapSexForApi, dobToAge } from "./mappers";
import { supabase } from "@/lib/supabaseClient";

//OLD: Go backend helpers
const API_BASE = import.meta.env.VITE_API_BASE_URL; // "https://macromunchservices.onrender.com"

async function apiRequest(path, method = "GET", body) {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session?.access_token) {
    return {
      ok: false,
      status: 401,
      error: "You’re not signed in. Please log in again.",
    };
  }

  const token = data.session.access_token;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: json?.error || "Request failed",
        data: json || null,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: json,
    };
  } catch (err) {
    console.error("API request error:", err);
    return {
      ok: false,
      status: 0,
      error: "Network error. Please try again.",
    };
  }
}

// NEW: Supabase native helpers
export async function getCurrentUserProfile() {
  // 1) Get the current auth user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: userError?.message || "Not signed in.",
    };
  }

  // 2) Fetch their profile row
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("[Profiles] getCurrentUserProfile error", error);
    return { ok: false, error: error.message };
  }

  // 🔥 keep shape the same as before: data = profile row
  return { ok: true, data };
}

// NEW: Small helper to get name / email / initial for the UI
export async function getAuthProfileSummary() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return { ok: false, error: error?.message || "Not signed in." };
  }

  const user = data.user;

  const first =
    user.user_metadata?.first_name ||
    user.user_metadata?.firstName ||
    "";
  const last =
    user.user_metadata?.last_name ||
    user.user_metadata?.lastName ||
    "";

  const displayName = [first, last].filter(Boolean).join(" ") || user.email;
  const email = user.email || "";
  const initial = (first || email || "?").trim().charAt(0).toUpperCase();

  return {
    ok: true,
    data: {
      displayName,
      email,
      initial,
    },
  };
}

// 🔹 Generic profile update (PUT /api/v1/users/)
export async function updateUserProfile(partialProfile) {
  // partialProfile can be { mealsPerDay: 4 } or { weight: 73.0 } etc.
  return apiRequest("/api/v1/users/", "PUT", partialProfile);
}

// NEW: mealsPerDay helper
export async function updateMealsPerDay(mealsPerDay) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError?.message || "Not signed in." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      meals_per_day: mealsPerDay,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Profiles] updateMealsPerDay error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

// NEW: activityLevel helper
export async function updateActivityLevel(activity) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError?.message || "Not signed in." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      activity_level: activity,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Profiles] updateActivityLevel error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

// NEW: Specific helper for goal
export async function updateGoal(goal) {
  // 1) Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: userError?.message || "Not signed in.",
    };
  }

  // 2) Update their profile
  const { data, error } = await supabase
    .from("profiles")
    .update({
      goal,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Profiles] updateGoal error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

// Generic helper to patch the current user's profile row in Supabase
async function updateProfilePatch(patch) {
  // 1) Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: userError?.message || "Not signed in.",
    };
  }

  // 2) Update their profile row by user_id
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Profiles] updateProfilePatch error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

// 🔹 Height (cm)
export async function updateHeightCm(heightCm) {
  return updateProfilePatch({ height_cm: Number(heightCm) });
}

// 🔹 Weight (kg)
export async function updateWeightKg(weightKg) {
  return updateProfilePatch({ weight_kg: Number(weightKg) });
}

// 🔹 Date of birth (YYYY-MM-DD)
export async function updateDob({ year, month, day }) {
  // ensure 2-digit month/day
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const dob = `${year}-${mm}-${dd}`; // Supabase 'date' column format

  return updateProfilePatch({ dob });
}

export async function createUserProfile({
  firstName,
  lastName,
  gender,           // 'female' | 'male' | 'nonbinary' | 'prefer-not'
  dobYear, dobMonth, dobDay,
  heightCm,
  weightKg,
  activity,         // 'sedentary' | 'light' | 'moderate' | 'very'
  goal = "maintain",         // 'lose' | 'maintain' | 'gain'
  dietaryFlags = ["none"],   // array
  mealsPerDay = 3,
}) {
  const age = dobToAge(dobYear, dobMonth, dobDay);

  const body = {
    firstName,
    lastName,
    sex: mapSexForApi(gender),
    age,
    height: Number(heightCm),
    weight: Number(weightKg),
    activityLevel: mapActivity(activity),
    goal,
    dietaryFlags,
    mealsPerDay,
  };

  return apiFetch("/api/v1/users/", {
    method: "POST",
    body,
  });
}