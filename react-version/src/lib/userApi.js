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

// NEW Small helper to shuffle an array in-place
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

// 🔹 Helper: pick 3 meals + 1 snack from the candidate list
function buildSimpleDailyLineup(meals, profile) {
  try {
    if (!Array.isArray(meals) || meals.length === 0) return [];

    // Bucket by meal_type
    const courseBuckets = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    for (const meal of meals) {
      const typeRaw = meal.meal_type || "";
      const type = String(typeRaw).toLowerCase();

      if (type.includes("breakfast")) {
        courseBuckets.breakfast.push(meal);
      } else if (type.includes("lunch")) {
        courseBuckets.lunch.push(meal);
      } else if (type.includes("dinner")) {
        courseBuckets.dinner.push(meal);
      } else if (type.includes("snack")) {
        courseBuckets.snack.push(meal);
      } else {
        // If unknown, treat as lunch for now
        courseBuckets.lunch.push(meal);
      }
    }

    const pick = (bucketName, fallbackBucketName) => {
      const bucket = courseBuckets[bucketName];
      if (bucket && bucket.length > 0) return bucket[0];

      const fallback = courseBuckets[fallbackBucketName];
      if (fallback && fallback.length > 0) return fallback[0];

      // As a last resort, just return the first meal
      return meals[0];
    };

    const breakfast = pick("breakfast", "lunch");
    const lunch = pick("lunch", "dinner");
    const dinner = pick("dinner", "lunch");
    const snack = pick("snack", "breakfast");

    const lineup = [breakfast, lunch, snack, dinner];

    // De-duplicate in case the same meal got picked twice
    const unique = [];
    const seen = new Set();

    for (const meal of lineup) {
      if (!meal) continue;
      if (seen.has(meal.id)) continue;
      seen.add(meal.id);
      unique.push(meal);
    }

    console.log("[Meals] simple daily lineup:", unique);
    return unique;
  } catch (err) {
    console.error("[Meals] buildSimpleDailyLineup hard error:", err);
    return [];
  }
}

// Generate a daily meal plan AND persist it to meal_plans + meal_plan_items
export async function generateMealPlanForCurrentUser() {
  // 0) Get the current auth user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[MealPlans] no signed-in user", userError);
    return {
      ok: false,
      error: userError?.message || "Not signed in.",
    };
  }

  // 1) Get candidate meals (already filtered by prefs)
  const candidatesRes = await getCandidateMealsForCurrentUser();
  if (!candidatesRes.ok) {
    console.error("[MealPlans] failed to get candidate meals", candidatesRes.error);
    return candidatesRes;
  }

  const { profile, meals } = candidatesRes.data;

  if (!Array.isArray(meals) || meals.length === 0) {
    console.warn("[MealPlans] No meals available to build a plan.");
    return {
      ok: false,
      error: "No meals available to build a plan.",
    };
  }

  // 2) Build a simple 3 meals + 1 snack lineup
  let lineup = [];
  try {
    lineup = buildSimpleDailyLineup(meals, profile);
  } catch (err) {
    console.error("[MealPlans] buildSimpleDailyLineup failed (hard throw):", err);
    return {
      ok: false,
      error: "Failed to build daily lineup.",
    };
  }

  if (!Array.isArray(lineup) || lineup.length === 0) {
    console.error("[MealPlans] buildSimpleDailyLineup returned empty lineup");
    return {
      ok: false,
      error: "Failed to build daily lineup.",
    };
  }

  // 3) Compute macros_used snapshot from profile (best-effort)
  const macrosUsed = {
    calories: profile.macros_kcal ?? null,
    protein_g: profile.macros_protein_g ?? null,
    carbs_g: profile.macros_carbs_g ?? null,
    fats_g: profile.macros_fats_g ?? null,
  };

  // 4) Insert into meal_plans
  const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: planRow, error: planError } = await supabase
    .from("meal_plans")
    .insert([
      {
        user_id: user.id,
        generated_for: todayISO,
        macros_used: macrosUsed,
        profile_snapshot: {
          goal: profile.goal,
          macro_mode: profile.macro_mode,
          diet_preferences: profile.diet_preferences,
          diet_allergies: profile.diet_allergies,
          diet_spice_level: profile.diet_spice_level,
          diet_flavor_profiles: profile.diet_flavor_profiles,
        },
      },
    ])
    .select()
    .single();

  if (planError) {
    console.error("[MealPlans] insert meal_plans error", planError);
    return {
      ok: false,
      error: planError.message,
    };
  }

  // 5) Insert into meal_plan_items (one row per meal in lineup)
  const itemsPayload = lineup.map((meal, index) => ({
    meal_plan_id: planRow.id,
    meal_id: meal.id,
    course: meal.meal_type || null,
    sequence_index: index,
  }));

  const { data: itemsRows, error: itemsError } = await supabase
    .from("meal_plan_items")
    .insert(itemsPayload)
    .select();

  if (itemsError) {
    console.error("[MealPlans] insert meal_plan_items error", itemsError);
    return {
      ok: false,
      error: itemsError.message,
    };
  }

  console.log("[MealPlans] generated + saved plan:", {
    plan: planRow,
    items: itemsRows,
    lineup,
  });

  return {
    ok: true,
    data: {
      plan: planRow,
      items: itemsRows,
      lineup,
    },
  };
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

// NEW Get the full profile for the current user (diet prefs, macros, etc.)
export async function getCurrentUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError?.message || "Not signed in." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("[Profiles] getCurrentUserProfile error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

// NEW STEP 1: Get meals that roughly match the user's preferences
export async function getCandidateMealsForCurrentUser() {
  // 1) Load profile (diet prefs, allergies later, etc.)
  const profileRes = await getCurrentUserProfile();
  if (!profileRes.ok) {
    console.error("[Meals] getCandidateMealsForCurrentUser profile error:", profileRes.error);
    return profileRes; // { ok: false, error: ... }
  }

  const profile = profileRes.data || {};

  // 🔹 Normalize profile fields safely
  const rawPrefs = profile.diet_preferences;
  let dietPrefs = [];

  // If it's already an array (e.g. Supabase jsonb[]), use it directly
  if (Array.isArray(rawPrefs)) {
    dietPrefs = rawPrefs;
  } else if (typeof rawPrefs === "string" && rawPrefs.length > 0) {
    // If it's a JSON-looking string, try to parse: '["vegan"]' -> ["vegan"]
    try {
      const parsed = JSON.parse(rawPrefs);
      dietPrefs = Array.isArray(parsed) ? parsed : [];
    } catch {
      // If parsing fails, just ignore and fall back to empty
      dietPrefs = [];
    }
  } else {
    dietPrefs = [];
  }

  const rawAllergies = profile.diet_allergies;
  const allergies = Array.isArray(rawAllergies) ? rawAllergies : [];

  const spiceLevel =
    typeof profile.diet_spice_level === "number" ? profile.diet_spice_level : null;

  // 2) Load meals from Supabase
  const { data: meals, error } = await supabase
    .from("meals")
    .select("id, name, description, meal_type, diet_tags, ready_in_minutes");

  if (error) {
    console.error("[Meals] getCandidateMealsForCurrentUser error", error);
    return { ok: false, error: error.message };
  }

  console.log("[Meals] raw meals from Supabase:", meals);

  // If somehow no meals in DB, just return empty but ok
  if (!Array.isArray(meals) || meals.length === 0) {
    return {
      ok: true,
      data: {
        profile,
        meals: [],
      },
    };
  }

  const prefsSet = new Set(dietPrefs.map(String));

  // 3) Basic filtering:
  //    - If user has no diet prefs, let everything through
  //    - If user DOES have prefs, only keep meals that share at least one tag
  const filtered = meals.filter((meal) => {
    const tags = Array.isArray(meal.diet_tags)
      ? meal.diet_tags.map(String)
      : [];

    // A) Diet preferences
    if (prefsSet.size > 0) {
      const hasOverlap = tags.some((tag) => prefsSet.has(tag));
      if (!hasOverlap) return false;
    }

    // B) Allergies / spice / etc. can be layered in later
    //    For now, we skip that logic in v1.

    return true;
  });

  // 🔥 Fallback: if filtering removed everything, just use all meals
  const finalMeals = filtered.length > 0 ? filtered : meals;

  console.log(
    "[Meals] filtering summary:",
    "dietPrefs =", dietPrefs,
    "| raw meals =", meals.length,
    "| filtered =", filtered.length,
    "| finalMeals =", finalMeals.length
  );

  return {
    ok: true,
    data: {
      profile,
      meals: finalMeals,
    },
  };
}

// STEP 2: Build a simple "3 meals + 1 snack" lineup from candidate meals
export async function buildSimpleDailyLineupForCurrentUser() {
  // 1) Get candidate meals (already filtered by diet prefs)
  const baseRes = await getCandidateMealsForCurrentUser();
  if (!baseRes.ok) {
    return baseRes; // { ok: false, error: ... }
  }

  const { profile, meals } = baseRes.data || {};

  // If no meals at all, return empty lineup
  if (!meals || meals.length === 0) {
    console.warn("[Meals] No candidate meals found for this user.");
    return {
      ok: true,
      data: {
        profile,
        meals: [],
        lineup: [],
      },
    };
  }

  // 2) Bucket meals by meal_type (normalized to lowercase)
  const buckets = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  meals.forEach((meal) => {
    const type = (meal.meal_type || "").toLowerCase();
    if (buckets[type]) {
      buckets[type].push(meal);
    }
  });

  // 3) Helper to pick one meal from a bucket (if available, not duplicated)
  const lineup = [];
  const usedIds = new Set();

  function pickFromBucket(type) {
    const arr = buckets[type];
    if (!arr || arr.length === 0) return;

    // stable ordering (optional)
    arr.sort((a, b) => a.name.localeCompare(b.name));

    const next = arr[0];
    if (!usedIds.has(next.id)) {
      lineup.push(next);
      usedIds.add(next.id);
    }
  }

  // 4) Try to fill: breakfast → lunch → dinner → snack
  ["breakfast", "lunch", "dinner", "snack"].forEach(pickFromBucket);

  const TARGET_COUNT = 4; // 👉 3 meals + 1 snack

  // 5) If we still have fewer than 4, fill with any remaining meals
  if (lineup.length < TARGET_COUNT && meals.length > lineup.length) {
    for (const meal of meals) {
      if (lineup.length >= TARGET_COUNT) break;
      if (!usedIds.has(meal.id)) {
        lineup.push(meal);
        usedIds.add(meal.id);
      }
    }
  }

  console.log(
    "[Meals] simple daily lineup (TARGET 4):",
    lineup.map((m) => ({
      id: m.id,
      name: m.name,
      meal_type: m.meal_type,
    }))
  );

  return {
    ok: true,
    data: {
      profile,
      meals,
      lineup,
    },
  };
}

// NEW: Load the latest saved meal plan + its meals
export async function getLatestSavedMealPlanForCurrentUser() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError?.message || "Not signed in." };
  }

  // 1) Get the most recent meal_plan for this user
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("id, generated_for, macros_used, profile_snapshot")
    .eq("user_id", user.id)
    .order("generated_for", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    console.error("[MealPlans] getLatestSavedMealPlanForCurrentUser plan error", planError);
    return { ok: false, error: planError.message };
  }

  if (!plan) {
    // No saved plans yet
    return {
      ok: true,
      data: {
        plan: null,
        items: [],
        meals: [],
      },
    };
  }

  // 2) Get the items for that plan
  const { data: items, error: itemsError } = await supabase
    .from("meal_plan_items")
    // ⛔️ NOTE: we NO LONGER ask for 'slot' here
    .select("id, meal_plan_id, meal_id, sequence_index")
    .eq("meal_plan_id", plan.id)
    .order("sequence_index", { ascending: true });

  if (itemsError) {
    console.error("[MealPlans] getLatestSavedMealPlanForCurrentUser items error", itemsError);
    return { ok: false, error: itemsError.message };
  }

  if (!items || items.length === 0) {
    return {
      ok: true,
      data: {
        plan,
        items: [],
        meals: [],
      },
    };
  }

  // 3) Load the meal rows for those items
  const mealIds = items.map((item) => item.meal_id);
  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("id, name, description, meal_type, diet_tags, ready_in_minutes")
    .in("id", mealIds);

  if (mealsError) {
    console.error("[MealPlans] getLatestSavedMealPlanForCurrentUser meals error", mealsError);
    return { ok: false, error: mealsError.message };
  }

  const mealsById = new Map(meals.map((m) => [m.id, m]));

  // Helper to derive a friendly label (slot) if we don't have one in DB
  function deriveSlotLabel(item, meal) {
    // First try the meal_type if it looks nice
    if (meal?.meal_type) {
      const type = meal.meal_type.toLowerCase();
      if (type === "breakfast") return "Breakfast";
      if (type === "lunch") return "Lunch";
      if (type === "dinner") return "Dinner";
      if (type === "snack") return "Snack";
    }

    // Otherwise, fall back on index position
    switch (item.sequence_index) {
      case 0:
        return "Breakfast";
      case 1:
        return "Lunch";
      case 2:
        return "Snack";
      case 3:
        return "Dinner";
      default:
        return "Meal";
    }
  }

  // 4) Build a lineup array that your UI can use directly
  const lineup = items
    .map((item) => {
      const meal = mealsById.get(item.meal_id);
      if (!meal) return null;

      return {
      // core meal fields
      id: meal.id,
      name: meal.name,
      description: meal.description,
      meal_type: meal.meal_type,
      diet_tags: meal.diet_tags,
      ready_in_minutes: meal.ready_in_minutes,

      // nice UI string for HomeMealPlan
      readyIn:
        typeof meal.ready_in_minutes === "number"
          ? `${meal.ready_in_minutes} min`
          : "- min",

      // UI helpers
      slot: deriveSlotLabel(item, meal),
      sequence_index: item.sequence_index,
    };
    })
    .filter(Boolean);

  return {
    ok: true,
    data: {
      plan,
      items,
      meals: lineup,
    },
  };
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
  mealsPerDay = 4,
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