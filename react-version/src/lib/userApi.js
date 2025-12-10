import { apiFetch } from "./api";
import { mapActivity, mapSexForApi, dobToAge } from "./mappers";
import { supabase } from "@/lib/supabaseClient";
import { computeSmartMacros } from "./macroCalculator";

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


// 🔹 New: update macro settings (manual or auto)
export async function updateMacroSettings({
  macroMode,   // "manual" | "auto"
  goal,        // "lose" | "maintain" | "gain"
  proteinG,    // number
  carbsG,      // number
  fatG,        // number
}) {
  // 1 g protein = 4 kcal, 1 g carb = 4 kcal, 1 g fat = 9 kcal
  const calories =
    Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);

  // 1) Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[Macros] No signed-in user", userError);
    return {
      ok: false,
      error: userError?.message || "Not signed in.",
    };
  }

  // 2) Update their profile row
  const { data, error } = await supabase
    .from("profiles")
    .update({
      macros_mode: macroMode,          // text column
      goal,                             // keep this in sync with onboarding
      macros_kcal: calories,            // int4
      macros_protein_g: proteinG,       // int4
      macros_carbs_g: carbsG,           // int4
      macros_fat_g: fatG,               // int4
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Macros] updateMacroSettings error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

// 🔹 Smart macro generator: reads from Supabase, computes, saves back
export async function generateSmartMacrosForCurrentUser() {
  // 1) Get current auth user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[Macros] No signed-in user", userError);
    return {
      ok: false,
      error: "You’re not signed in. Please log in again.",
    };
  }

  // 2) Load their profile row
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[Macros] profile fetch error", profileError);
    return {
      ok: false,
      error: "We couldn’t load your profile to calculate macros.",
    };
  }

  const {
    dob,
    height_cm,
    weight_kg,
    activity_level,
    goal,
    sex, // optional, may be null
  } = profile;

  // 3) Make sure we have enough data
  if (!dob || !height_cm || !weight_kg) {
    console.warn("[Macros] missing fields", { dob, height_cm, weight_kg });

    return {
      ok: false,
      error:
        "Missing birth date, height, or weight in your profile. Please double-check your profile details.",
    };
  }

  // 4) Compute age (years) from dob "YYYY-MM-DD"
  let ageYears = null;
  try {
    const birthDate = new Date(dob);
    if (!isNaN(birthDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      ageYears = age;
    }
  } catch (e) {
    console.error("[Macros] error parsing dob", dob, e);
  }

  if (ageYears == null || Number.isNaN(ageYears)) {
    return {
      ok: false,
      error:
        "We couldn’t understand your date of birth. Please re-save it in your profile.",
    };
  }

  // 5) Mifflin-St Jeor BMR
  const w = Number(weight_kg);
  const h = Number(height_cm);
  const a = Number(ageYears);

  const sexLower = (sex || "").toString().toLowerCase();

  // Default to "neutral" if sex missing; you can tweak this later
  let bmr;
  if (sexLower === "male") {
    bmr = 10 * w + 6.25 * h - 5 * a + 5;
  } else if (sexLower === "female") {
    bmr = 10 * w + 6.25 * h - 5 * a - 161;
  } else {
    bmr = 10 * w + 6.25 * h - 5 * a;
  }

  // 6) Activity multiplier
  const activity = activity_level || "lightly_active";
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const activityMultiplier = multipliers[activity] || 1.375;
  const maintenanceKcal = bmr * activityMultiplier;

  // 7) Goal adjustment
  const goalMode = goal || "maintain";
  let targetKcal = maintenanceKcal;

  if (goalMode === "lose") {
    targetKcal = maintenanceKcal - 400; // gentle deficit
  } else if (goalMode === "gain") {
    targetKcal = maintenanceKcal + 300; // gentle surplus
  }

  // Clamp so we don’t go wild
  targetKcal = Math.max(1200, Math.round(targetKcal));

  // 8) Macro split 30/45/25 (P/C/F)
  const proteinCalories = targetKcal * 0.3;
  const carbCalories = targetKcal * 0.45;
  const fatCalories = targetKcal * 0.25;

  const proteinGrams = Math.round(proteinCalories / 4);
  const carbGrams = Math.round(carbCalories / 4);
  const fatGrams = Math.round(fatCalories / 9);

  // 9) Save to Supabase
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({
      macros_mode: "auto",
      macros_kcal: targetKcal,
      macros_protein_g: proteinGrams,
      macros_carbs_g: carbGrams,
      macros_fat_g: fatGrams,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
    console.error("[Macros] update error", updateError);
    return {
      ok: false,
      error: "We calculated your macros but couldn’t save them. Please try again.",
    };
  }

  return {
    ok: true,
    data: {
      kcal: targetKcal,
      protein: proteinGrams,
      carbs: carbGrams,
      fats: fatGrams,
      profile: updated,
    },
  };
}

// NEW 🔹 Update macro plan (mode + numbers) in Supabase profiles
export async function updateMacroPlan({
  mode,           // "smart" | "manual"
  calories,       // number
  protein,        // grams
  carbs,          // grams
  fats,           // grams
}) {
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

  // 2) Update their profile row
  const { data, error } = await supabase
    .from("profiles")
    .update({
      macros_mode: mode,
      macros_kcal: Math.round(Number(calories)),
      macros_protein_g: Math.round(Number(protein)),
      macros_carbs_g: Math.round(Number(carbs)),
      macros_fat_g: Math.round(Number(fats)),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Profiles] updateMacroPlan error", error);
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

// NEW 🔹 Update dietary preferences block on the profile
export async function updateDietSettings({
  dietaryPreferences,
  allergies,
  eatingStyles,
  spiceLevel,
  flavorProfiles,
}) {
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

  // 2) Normalize to arrays of strings
  const prefs = (dietaryPreferences ?? []).map(String);
  const allergyTags = (allergies ?? []).map(String);
  const styles = (eatingStyles ?? []).map(String);
  const flavors = (flavorProfiles ?? []).map(String);

  // 3) Only accept a real number for spice; otherwise store null
  const numericSpice =
    typeof spiceLevel === "number" && !Number.isNaN(spiceLevel)
      ? spiceLevel
      : null;

  console.log("[Diet] updateDietSettings payload", {
    dietaryPreferences: prefs,
    allergies: allergyTags,
    eatingStyles: styles,
    spiceLevel,
    numericSpice,
    flavorProfiles: flavors,
  });

  // 4) Update the profile row
  const { data, error } = await supabase
    .from("profiles")
    .update({
      diet_preferences: prefs,
      diet_allergies: allergyTags,
      diet_eating_styles: styles,
      diet_spice_level: numericSpice,
      diet_flavor_profiles: flavors,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Profiles] updateDietSettings error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

// 🔹 Force-clear spice level in profile (used when user skips spice)
export async function clearSpicePreference() {
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

  const { data, error } = await supabase
    .from("profiles")
    .update({
      diet_spice_level: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Profiles] clearSpicePreference error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

// NEW🔹 Mark onboarding as complete
export async function markOnboardingComplete() {
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

  const { data, error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[Profiles] markOnboardingComplete error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
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