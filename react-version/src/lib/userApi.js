import { apiFetch } from "./api";
import { mapActivity, mapSexForApi, dobToAge } from "./mappers";
import { supabase } from "@/lib/supabaseClient";
import { computeSmartMacros } from "./macroCalculator";

//OLD: Go backend helpers
const API_BASE = import.meta.env.VITE_API_BASE_URL; // "https://macromunchservices.onrender.com"

// To prevent concurrent plan generations
let generatePlanInFlight = null;

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

// NEW: Specific helper for goal (with debug)
export async function updateGoal(goal) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError?.message || "Not signed in." };
  }

  console.log("[updateGoal] user.id:", user.id, "new goal:", goal);

  const { data, error, count } = await supabase
    .from("profiles")
    .update({
      goal,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select("*");

  if (error) {
    console.error("[Profiles] updateGoal error", error);
    return { ok: false, error: error.message };
  }

  console.log("[updateGoal] updated rows:", data?.length, "count:", count);
  console.log("[updateGoal] returned goal:", data?.[0]?.goal);

  // 🔎 Immediately re-read from DB to confirm persistence
  const check = await supabase
    .from("profiles")
    .select("user_id, goal, updated_at")
    .eq("user_id", user.id);

  console.log("[updateGoal] DB check after update:", check);

  return { ok: true, data: data?.[0] ?? null };
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
  // ✅ 1) Shuffle once so “pick first match” isn’t always the same meal
  const shuffled = [...(meals || [])].sort(() => Math.random() - 0.5);

  // ✅ 2) Use *shuffled* for all course filters (not the original meals array)
  const breakfastMeals = shuffled.filter((m) => (m.meal_type || "").toLowerCase() === "breakfast");
  const lunchMeals     = shuffled.filter((m) => (m.meal_type || "").toLowerCase() === "lunch");
  const dinnerMeals    = shuffled.filter((m) => (m.meal_type || "").toLowerCase() === "dinner");
  const snackMeals     = shuffled.filter((m) => (m.meal_type || "").toLowerCase() === "snack");

  console.log("[Lineup] shuffled order", shuffled.map(m => `${m.meal_type}:${m.name}`));

  // ✅ Debug: confirm you actually have options per course
  console.log("[Lineup] candidates by course", {
    breakfast: breakfastMeals.length,
    lunch: lunchMeals.length,
    dinner: dinnerMeals.length,
    snack: snackMeals.length,
  });

  try {
    if (!Array.isArray(meals) || meals.length === 0) return [];

    // Bucket by meal_type
    const courseBuckets = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    for (const meal of shuffled) {
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

    const pickRandom = (bucket, fallbackBucket, all) => {
      const b = bucket?.length ? bucket : fallbackBucket?.length ? fallbackBucket : all;
      return b[Math.floor(Math.random() * b.length)];
    };

    const breakfast = pickRandom(courseBuckets.breakfast, courseBuckets.lunch, shuffled);
    const lunch     = pickRandom(courseBuckets.lunch, courseBuckets.dinner, shuffled);
    const dinner    = pickRandom(courseBuckets.dinner, courseBuckets.lunch, shuffled);
    const snack     = pickRandom(courseBuckets.snack, courseBuckets.breakfast, shuffled);

    const mpd = Number(profile?.meals_per_day) || 4;

    let lineup = [];

    if (mpd === 3) {
      lineup = [breakfast, lunch, dinner]; // ✅ no snack
    } else if (mpd === 5) {
      // simple v1: breakfast, lunch, snack, dinner, snack2 (fallback reuse snack bucket)
      const snack2 = pick("snack", "breakfast");
      lineup = [breakfast, lunch, snack, dinner, snack2];
    } else {
      // default 4
      lineup = [breakfast, lunch, snack, dinner];
    }

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

// Scale meal lines to hit target macros
function totalsFromLines(arr) {
  return (arr || []).reduce(
    (acc, l) => {
      const g = Number(l.grams) || 0;
      const ing = l.ingredient || {};
      acc.calories += g * (Number(ing.kcal_per_gram) || 0);
      acc.protein  += g * (Number(ing.protein_g_per_gram) || 0);
      acc.carbs    += g * (Number(ing.carbs_g_per_gram) || 0);
      acc.fats     += g * (Number(ing.fat_g_per_gram) || 0);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

function roundScaledPayload(t) {
  return {
    calories: Math.round(t.calories || 0),
    protein: Math.round(t.protein || 0),
    carbs: Math.round(t.carbs || 0),
    fats: Math.round(t.fats || 0),
  };
}

function clampGrams(g, minG, maxG) {
  let out = Number(g) || 0;
  const min = minG == null ? null : Number(minG);
  const max = maxG == null ? null : Number(maxG);

  if (Number.isFinite(min)) out = Math.max(out, min);
  if (Number.isFinite(max) && max > 0) out = Math.min(out, max);
  return out;
}

function stepRound(g, step) {
  const s = Number(step);
  if (!Number.isFinite(s) || s <= 0) return g;
  return Math.round(g / s) * s;
}

function normRole(role) {
  return String(role || "").toLowerCase().trim();
}

function isAnyLever(role) {
  const r = normRole(role);
  return r.startsWith("lever_"); // lever_protein, lever_carb, lever_fat
}

function isLeverFor(role, macro) {
  return normRole(role) === `lever_${macro}`; // macro: "protein" | "carb" | "fat"
}


/**
 * Day balancing: nudge lever grams across meals to hit daily macros tightly.
 * - Only touches rows where scaling_role === "lever"
 * - Uses step_grams
 * - Respects min/max
 */
function balanceDayAcrossItems(itemStates, dailyTarget, { tolerance = 3, maxIters = 600 } = {}) {
  const getDayTotals = () => {
    return itemStates.reduce(
      (acc, it) => {
        const t = totalsFromLines(it.working);
        acc.calories += t.calories;
        acc.protein += t.protein;
        acc.carbs += t.carbs;
        acc.fats += t.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const residual = () => {
    const cur = getDayTotals();
    return {
      protein: (dailyTarget.protein || 0) - cur.protein,
      carbs: (dailyTarget.carbs || 0) - cur.carbs,
      fats: (dailyTarget.fats || 0) - cur.fats,
    };
  };

  const withinTol = (r) =>
    Math.abs(r.protein) <= tolerance &&
    Math.abs(r.carbs) <= tolerance &&
    Math.abs(r.fats) <= tolerance;

  // Pick best lever line to adjust for a macro.
  // Uses "efficiency": target macro per gram / side effects per gram
  function bestLeverFor(macroKey, direction /* +1 add, -1 remove */) {
    let best = null;

    for (let i = 0; i < itemStates.length; i++) {
      const it = itemStates[i];
      const lines = it.working;

      for (let j = 0; j < lines.length; j++) {
        const l = lines[j];
        if (!isLeverFor(l.scaling_role, macroKey)) continue;

        const ing = l.ingredient || {};
        const p = Number(ing.protein_g_per_gram) || 0;
        const c = Number(ing.carbs_g_per_gram) || 0;
        const f = Number(ing.fat_g_per_gram) || 0;

        const per =
          macroKey === "protein" ? p :
          macroKey === "carb" ? c : f;

        if (per <= 0) continue;

        const step = Number(l.step_grams) || 1;
        const curG = Number(l.grams) || 0;

        const minG = l.min_grams == null ? null : Number(l.min_grams);
        const maxG = l.max_grams == null ? null : Number(l.max_grams);

        const hasRoom =
          direction > 0
            ? (maxG == null || curG + step <= maxG + 1e-9)
            : (minG == null || curG - step >= minG - 1e-9);

        if (!hasRoom) continue;

        const side =
          macroKey === "protein" ? (c + f) :
          macroKey === "carb" ? (p + f) :
          (p + c);

        const score = per / (side + 0.02);

        if (!best || score > best.score) {
          best = { itemIndex: i, lineIndex: j, score, step };
        }
      }
    }

    return best;
  }

  for (let iter = 0; iter < maxIters; iter++) {
    const r = residual();
    if (withinTol(r)) return { ok: true, notes: [`Balanced within ±${tolerance}g in ${iter} iters`], dayTotals: getDayTotals() };

    // Biggest miss first
    const order = [
      { k: "protein", v: Math.abs(r.protein) },
      { k: "carb", v: Math.abs(r.carbs) },
      { k: "fat", v: Math.abs(r.fats) },
    ].sort((a, b) => b.v - a.v);

    let moved = false;

    for (const m of order) {
      const need = r[m.k];
      if (Math.abs(need) <= tolerance) continue;

      const dir = need > 0 ? +1 : -1;
      const pick = bestLeverFor(m.k, dir);
      if (!pick) continue;

      const it = itemStates[pick.itemIndex];
      const l = it.working[pick.lineIndex];

      const step = Number(l.step_grams) || 1;
      const next = clampGrams(stepRound((Number(l.grams) || 0) + dir * step, step), l.min_grams, l.max_grams);

      if (next !== (Number(l.grams) || 0)) {
        it.working[pick.lineIndex] = { ...l, grams: next };
        moved = true;
        break;
      }
    }

    if (!moved) {
      return { ok: false, notes: ["Stopped: no lever room left across day"], dayTotals: getDayTotals() };
    }
  }

  return { ok: false, notes: ["Stopped: max iterations reached"], dayTotals: getDayTotals() };
}

// Generate a daily meal plan AND persist it to meal_plans + meal_plan_items
async function _generateMealPlanForCurrentUser() {
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

  async function mealHasCompleteIngredients(mealId) {
  const res = await getMealWithIngredients(mealId);
  if (!res.ok) return false;

  const rows = res.data || [];
  if (rows.length === 0) return false;

  // “complete” = every row has ingredient + grams (so it contributes macros)
  // If you have multiple recipes per meal, this still works because rows are flattened.
  return rows.every((r) => r.ingredient && Number(r.default_grams) > 0);
}

// After lineup created:
const verified = [];
for (const meal of lineup) {
  const ok = await mealHasCompleteIngredients(meal.id);
  if (ok) verified.push(meal);
  else console.warn("[MealPlans] Dropping meal with missing ingredient lines:", meal.id);
}

// If we dropped too many, fail loudly (better than generating junk)
if (verified.length < lineup.length) {
  // You can decide your threshold. For MVP I’d require all 4.
  return {
    ok: false,
    error: "Some meals are missing ingredient data. Please complete recipes before generating a plan.",
  };
}

lineup = verified;

  // 3) Hard-require profile macro targets (no fallback to lineup totals)
const numOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const pKcal = numOrNull(profile.macros_kcal);
const pP = numOrNull(profile.macros_protein_g);
const pC = numOrNull(profile.macros_carbs_g);
const pF = numOrNull(profile.macros_fat_g);

if ([pKcal, pP, pC, pF].some((v) => v == null)) {
  console.error("[MealPlans] Missing profile macro targets", {
    macros_kcal: profile.macros_kcal,
    macros_protein_g: profile.macros_protein_g,
    macros_carbs_g: profile.macros_carbs_g,
    macros_fat_g: profile.macros_fat_g,
  });

  return {
    ok: false,
    error: "Missing macro targets. Please complete your macro targets before generating a plan.",
  };
}

const macrosUsed = {
  calories: Math.round(pKcal),
  protein_g: Math.round(pP),
  carbs_g: Math.round(pC),
  fats_g: Math.round(pF),
};

console.log("[MealPlans] macrosUsed (profile)", macrosUsed);

  // 4) Get-or-create meal_plans (1 per user per day)
  const todayISO = new Date().toISOString().slice(0, 10);

  const planPayload = {
    user_id: user.id,
    generated_for: todayISO,
    macros_used: macrosUsed,
    status: "pending",
    error_reason: null,
    profile_snapshot: {
      goal: profile.goal,
      macro_mode: profile.macros_mode ?? profile.macro_mode,
      meals_per_day: profile.meals_per_day,
      diet_preferences: profile.diet_preferences,
      diet_allergies: profile.diet_allergies,
      diet_spice_level: profile.diet_spice_level,
      diet_flavor_profiles: profile.diet_flavor_profiles,
    },
  };

  let planRow = null;
  // 4a) Look for an existing plan to avoid insert conflicts
  const { data: existingPlan, error: existingErr } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("generated_for", todayISO)
    .maybeSingle();

  if (existingErr) {
    console.error("[MealPlans] lookup meal_plans error", existingErr);
    return { ok: false, error: existingErr.message };
  }

  if (existingPlan?.id) {
    const { data, error } = await supabase
      .from("meal_plans")
      .update({
        macros_used: planPayload.macros_used,
        profile_snapshot: planPayload.profile_snapshot,
      })
      .eq("id", existingPlan.id)
      .select()
      .single();

    if (error) {
      console.error("[MealPlans] update meal_plans error", error);
      return { ok: false, error: error.message };
    }

    planRow = data;
  } else {
    const { data, error } = await supabase
      .from("meal_plans")
      .upsert(planPayload, { onConflict: "user_id,generated_for" })
      .select()
      .single();

    if (error) {
      // Treat any error here as a conflict race; re-select the row and continue
      const { data: retry, error: retryErr } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("generated_for", todayISO)
        .maybeSingle();

      if (retry) {
        planRow = retry;
        // Refresh macros/profile snapshot best-effort
        const { error: refreshErr } = await supabase
          .from("meal_plans")
          .update({
            macros_used: planPayload.macros_used,
            profile_snapshot: planPayload.profile_snapshot,
          })
          .eq("id", retry.id);
        if (refreshErr) {
          console.warn("[MealPlans] refresh snapshot after conflict failed", refreshErr);
        }
      } else {
        console.error("[MealPlans] insert/upsert meal_plans error", error);
        return { ok: false, error: retryErr?.message || error.message };
      }
    } else {
      planRow = data;
    }
  }

  // If planRow is still missing (e.g., conflict path), re-select today’s row
  if (!planRow) {
    const { data: retry, error: retryErr } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("generated_for", todayISO)
      .maybeSingle();

    if (retry) {
      planRow = retry;
    } else {
      console.error("[MealPlans] unable to read plan after conflict", retryErr);
      return { ok: false, error: retryErr?.message || "Could not load meal plan." };
    }
  }

  if (!planRow?.id) {
    return { ok: false, error: "Meal plan row missing after save." };
  }

  // 5) Replace meal_plan_items for this plan (delete then insert)
  const { error: deleteError } = await supabase
    .from("meal_plan_items")
    .delete()
    .eq("meal_plan_id", planRow.id);

  if (deleteError) {
    console.error("[MealPlans] delete meal_plan_items error", deleteError);
    return { ok: false, error: deleteError.message };
  }

  const itemsPayload = lineup.map((meal, index) => ({
    meal_plan_id: planRow.id,
    meal_id: meal.id,
    course: meal.meal_type || meal.slot || meal.course || null,
    sequence_index: index,
  }));

  // 5b) Insert new items
  const { data: itemsRows, error: itemsError } = await supabase
    .from("meal_plan_items")
    .insert(itemsPayload)
    .select();

  if (itemsError) {
    console.error("[MealPlans] insert meal_plan_items error", itemsError);
    return { ok: false, error: itemsError.message };
  }

  // Persist per-item target macros
  const updates = (itemsRows || []).map((itemRow) => {
    // Find the matching meal so we can use its meal_type/slot for splits
    const meal = lineup.find((m) => m.id === itemRow.meal_id) || {};

    // Use the DB row’s course if present; otherwise fall back to the meal object
    const course = itemRow.course || meal.meal_type || meal.slot || meal.course || null;

    const target = buildTargetMacrosForItem(profile, {
      course,
      sequence_index: itemRow.sequence_index,
    });

    return {
      id: itemRow.id,
      target_macros: target,
    };
  });

  // Persist per-item target macros (UPDATE-only to avoid UPSERT insert-RLS)
  for (const u of updates) {
    const { error } = await supabase
      .from("meal_plan_items")
      .update({
        target_macros: u.target_macros,
        updated_at: new Date().toISOString(),
      })
      .eq("id", u.id);

    if (error) {
      console.error("[MealPlans] update target_macros error", error);
      return { ok: false, error: error.message };
    }
  }

  const scaledByItemId = new Map();

const itemStates = []; // <-- NEW: hold per-item working lines in memory

for (const itemRow of itemsRows || []) {
  const target = updates.find((u) => u.id === itemRow.id)?.target_macros;
  if (!target) continue;

  const mealRes = await getMealWithIngredients(itemRow.meal_id);
  if (!mealRes.ok) return { ok: false, error: mealRes.error };

  const components = mealRes.data || [];

  // Flatten → "lines"
  const lines = [];
  for (const row of components) {
    if (!row.ingredient) continue;

    const pm = Number(row.portion_multiplier) || 1;

    const base = Number(row.default_grams);
    if (!Number.isFinite(base) || base <= 0) continue;

    lines.push({
      recipe_id: row.recipe_id,
      ingredient_id: row.ingredient_id,
      name: row.ingredient?.name,
      category: (row.ingredient?.category || "").toLowerCase(),

      // NEW columns you added:
      scaling_role: row.scaling_role || "anchor",
      step_grams: row.step_grams || 1,

      min_grams: row.min_grams == null ? null : Number(row.min_grams) * pm,
      max_grams: row.max_grams == null ? null : Number(row.max_grams) * pm,

      ingredient: row.ingredient,
      grams: base * pm,
    });
  }

  if (lines.length === 0) continue;

  // Initial clamp
  let working = lines.map((l) => ({
    ...l,
    grams: clampGrams(l.grams, l.min_grams, l.max_grams),
  }));

  const leverContribution = (arr, macro) =>
  totalsFromLines(arr.filter((l) => isLeverFor(l.scaling_role, macro)));

  for (let pass = 0; pass < 2; pass += 1) {
   // Protein
    {
      const curP = leverContribution(working, "protein").protein;
      const mp = curP > 0 ? target.protein / curP : 1;

      working = working.map((l) => {
        if (!isLeverFor(l.scaling_role, "protein")) return l;

        const next = clampGrams(l.grams * mp, l.min_grams, l.max_grams);
        const stepped = stepRound(next, l.step_grams);
        return { ...l, grams: clampGrams(stepped, l.min_grams, l.max_grams) };
      });
    }

    // Carbs
    {
      const curC = leverContribution(working, "carb").carbs;
      const mc = curC > 0 ? target.carbs / curC : 1;

      working = working.map((l) => {
        if (!isLeverFor(l.scaling_role, "carb")) return l;

        const next = clampGrams(l.grams * mc, l.min_grams, l.max_grams);
        const stepped = stepRound(next, l.step_grams);
        return { ...l, grams: clampGrams(stepped, l.min_grams, l.max_grams) };
      });
    }

    // Fats
    {
      const curF = leverContribution(working, "fat").fats;
      const mf = curF > 0 ? target.fats / curF : 1;

      working = working.map((l) => {
        if (!isLeverFor(l.scaling_role, "fat")) return l;

        const next = clampGrams(l.grams * mf, l.min_grams, l.max_grams);
        const stepped = stepRound(next, l.step_grams);
        return { ...l, grams: clampGrams(stepped, l.min_grams, l.max_grams) };
      });
    }
  }

  // Save to in-memory states (DON'T write scaled_macros yet)
  itemStates.push({
    item_id: itemRow.id,
    meal_id: itemRow.meal_id,
    target,
    working, // <-- this is what the day pass will tweak
  });
}

console.log(
  "[DEBUG] itemStates totals",
  itemStates.map(st => ({
    item: st.item_id,
    totals: totalsFromLines(st.working),
    target: st.target
  }))
);

function leverRoomReport(itemStates) {
  const report = {
    carbs: { add: 0, remove: 0 },
    protein: { add: 0, remove: 0 },
    fats: { add: 0, remove: 0 },
  };

  for (const st of itemStates) {
    for (const l of st.working) {
      if (!isAnyLever(l.scaling_role)) continue;

      const step = Number(l.step_grams) || 1;
      const g = Number(l.grams) || 0;
      const min = l.min_grams == null ? null : Number(l.min_grams);
      const max = l.max_grams == null ? null : Number(l.max_grams);

      const canAdd = max == null || g + step <= max + 1e-9;
      const canRemove = min == null || g - step >= min - 1e-9;

      const ing = l.ingredient || {};
      const p = Number(ing.protein_g_per_gram) || 0;
      const c = Number(ing.carbs_g_per_gram) || 0;
      const f = Number(ing.fat_g_per_gram) || 0;

      const role = normRole(l.scaling_role);

      if (role === "lever_carb") {
        if (canAdd) report.carbs.add++;
        if (canRemove) report.carbs.remove++;
      }
      if (role === "lever_protein") {
        if (canAdd) report.protein.add++;
        if (canRemove) report.protein.remove++;
      }
      if (role === "lever_fat") {
        if (canAdd) report.fats.add++;
        if (canRemove) report.fats.remove++;
      }
    }
  }

  console.log("[LeverRoomReport]", report);
}
leverRoomReport(itemStates);

const carbLevers = [];
for (const st of itemStates) {
  for (const l of st.working) {
    if (!isLeverFor(l.scaling_role, "carb")) continue;
    const c = Number(l.ingredient?.carbs_g_per_gram) || 0;
    if (c <= 0) continue;

    carbLevers.push({
      name: l.name,
      grams: l.grams,
      min: l.min_grams,
      max: l.max_grams,
      step: l.step_grams,
      carbsPerGram: c,
    });
  }
}
console.table(carbLevers);


// Daily target macros (use your profile targets)
const dailyTarget = {
  protein: macrosUsed.protein_g,
  carbs: macrosUsed.carbs_g,
  fats: macrosUsed.fats_g,
};

console.log("[DayBalance] dailyTarget", dailyTarget);
console.log("[DayBalance] macrosUsed", macrosUsed);

// Day-level balance to tighten to ±2–3g
const dayBalanceRes = balanceDayAcrossItems(itemStates, dailyTarget, {
  tolerance: 3,   // you can set 2.5 later
  maxIters: 700,
});

console.log("[DayBalance]", dayBalanceRes);

const finalDayTotals = itemStates.reduce(
  (acc, st) => {
    const t = totalsFromLines(st.working);
    acc.calories += t.calories;
    acc.protein += t.protein;
    acc.carbs += t.carbs;
    acc.fats += t.fats;
    return acc;
  },
  { calories: 0, protein: 0, carbs: 0, fats: 0 }
);

const withinTol = (a, b, tol) => Math.abs((a || 0) - (b || 0)) <= tol;

const tol = 3;
const ok =
  withinTol(finalDayTotals.protein, dailyTarget.protein, tol) &&
  withinTol(finalDayTotals.carbs, dailyTarget.carbs, tol) &&
  withinTol(finalDayTotals.fats, dailyTarget.fats, tol);

if (!ok) {
  console.error("[DayBalance] FAILED", { finalDayTotals, dailyTarget, dayBalanceRes });

  // Mark plan as failed with reason
  await supabase
    .from("meal_plans")
    .update({
      status: "failed",
      error_reason: "DayBalance failed to meet targets",
      updated_at: new Date().toISOString(),
    })
    .eq("id", planRow.id);

  return {
    ok: false,
    error: "Could not generate a plan that matches your targets. Please try regenerate or complete recipe lever ranges.",
  };
}

// Now persist each item's FINAL scaled_macros
for (const st of itemStates) {
  const scaledTotals = totalsFromLines(st.working);
  const scaledPayload = roundScaledPayload(scaledTotals);

  scaledByItemId.set(st.item_id, scaledPayload);

  const { error } = await supabase
    .from("meal_plan_items")
    .update({
      scaled_macros: scaledPayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", st.item_id);

  if (error) {
    console.error("[Scaling] update scaled_macros error", error);
    return { ok: false, error: error.message };
  }
}

  // 6) Mark plan as ready
await supabase
  .from("meal_plans")
  .update({
    status: "ready",
    error_reason: null,
    updated_at: new Date().toISOString(),
  })
  .eq("id", planRow.id);

  console.log("[MealPlans] about to clear plan_stale...");

  // ✅ Plan fully generated + targets/scaling saved → clear stale flags
  const clearRes = await updateCurrentUserProfile({
    plan_stale: false,
    plan_stale_reason: null,
    plan_stale_at: null,
  });

  console.log("[MealPlans] clear plan_stale finished:", clearRes);
  console.log("[MealPlans] generator reached");

  if (!clearRes.ok) {
    console.error("[MealPlans] Failed to clear plan_stale", clearRes.error);
    return { ok: false, error: clearRes.error || "Could not clear plan stale state." };
  }

  console.log("[MealPlans] ✅ returning ok:true from _generateMealPlanForCurrentUser");

    return {
      ok: true,
      data: {
        plan: planRow,
        items: itemsRows.map((r) => ({
          ...r,
          target_macros: updates.find((u) => u.id === r.id)?.target_macros ?? null,
          scaled_macros: scaledByItemId.get(r.id) ?? null,
        })),
        lineup,
      },
    };
  }
// SINGLETON in-flight promise to prevent concurrent generation
export async function generateMealPlanForCurrentUser() {
  if (generatePlanInFlight) return generatePlanInFlight;

  generatePlanInFlight = (async () => {
    try {
      return await _generateMealPlanForCurrentUser();
    } finally {
      generatePlanInFlight = null;
    }
  })();

  return generatePlanInFlight;
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
    .maybeSingle();

  if (error) {
    console.error("[Profiles] getCurrentUserProfile error", error);
    return { ok: false, error: error.message };
  }

  // If no profile row found
  if (!data) {
    return { ok: false, error: "Profile row not found for current user." };
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
    .select(
      "id, name, description, meal_type, diet_tags, ready_in_minutes, image_url, base_kcal, base_protein_g, base_carbs_g, base_fat_g"
    );

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

  // If nothing matched, signal empty so we don't serve fallback meals
  const finalMeals = filtered;

  console.log(
    "[Meals] filtering summary:",
    "dietPrefs =", dietPrefs,
    "| raw meals =", meals.length,
    "| filtered =", filtered.length
  );

  if (finalMeals.length === 0) {
    return {
      ok: false,
      error: "No meals matched your preferences.",
    };
  }

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
    for (const meal of shuffled) {
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
  const todayISO = new Date().toISOString().slice(0, 10);

  const { data: plan, error: planError } = await supabase
  .from("meal_plans")
  .select("id, generated_for, macros_used, profile_snapshot, created_at")
  .eq("user_id", user.id)
  .eq("generated_for", todayISO)
  .eq("status", "ready")
  .maybeSingle();

    console.log("[Plan] user/date", user.id, plan?.generated_for);
    console.log("[Plan] loaded", plan?.generated_for, plan?.macros_used);


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
    .select("id, meal_plan_id, meal_id, sequence_index, course, scaled_macros, target_macros, servings, position")
    .eq("meal_plan_id", plan.id)
    .order("sequence_index", { ascending: true });

    console.log(
      "[Items] first item target/scaled",
      items?.[0]?.target_macros,
      items?.[0]?.scaled_macros
    );

  if (itemsError) {
    console.error("[MealPlans] getLatestSavedMealPlanForCurrentUser items error", itemsError);
    return { ok: false, error: itemsError.message };
  }

  console.log("[MealPlans] first item target_macros", items?.[0]?.target_macros);

  console.log("[MealPlans] first item shape", items?.[0]);

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
    .select("id, name, description, instructions, author_name, meal_type, diet_tags, ready_in_minutes, image_url, base_kcal, base_protein_g, base_carbs_g, base_fat_g")
    .in("id", mealIds);

  if (mealsError) {
    console.error("[MealPlans] getLatestSavedMealPlanForCurrentUser meals error", mealsError);
    return { ok: false, error: mealsError.message };
  }

      console.log("[Meals] first meal base macros", meals?.[0]?.base_kcal, meals?.[0]?.base_protein_g);
      console.log("[Items] first item target/scaled", items?.[0]?.target_macros, items?.[0]?.scaled_macros);

  // 3.5) Load recipe mapping for those meals (choose first recipe by sort_order)
  const { data: mealRecipes, error: mrError } = await supabase
    .from("meal_recipes")
    .select("meal_id, recipe_id, sort_order")
    .in("meal_id", mealIds)
    .order("sort_order", { ascending: true });

  if (mrError) {
    console.error("[MealPlans] meal_recipes error", mrError);
  }

  const recipeIdByMealId = new Map();
  for (const mr of mealRecipes || []) {
    // first one wins because we sorted by sort_order asc
    if (!recipeIdByMealId.has(mr.meal_id) && mr.recipe_id) {
      recipeIdByMealId.set(mr.meal_id, mr.recipe_id);
    }
  }

  console.log("[MealRecipes] mapped", recipeIdByMealId.size, "of", mealIds.length);
  console.log("[Items] plan_id", plan.id, "first item plan_id", items?.[0]?.meal_plan_id);

  const mealsById = new Map(meals.map((m) => [m.id, m]));
  const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

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

    const recipe_id = recipeIdByMealId.get(meal.id) || null;

    // Pull base macros from meal row
    const baseKcal    = meal.base_kcal ?? null;
    const baseProtein = meal.base_protein_g ?? null;
    const baseCarbs   = meal.base_carbs_g ?? null;
    const baseFat     = meal.base_fat_g ?? null;

    // Prefer scaled → target → base
    const scaled = item.scaled_macros || null;
    const target = item.target_macros || null;

    const macrosFromBase =
      baseKcal == null
        ? null
        : {
            calories: Math.round(num(baseKcal)),
            protein: Math.round(num(baseProtein)),
            carbs: Math.round(num(baseCarbs)),
            fats: Math.round(num(baseFat)),
          };

    const macrosFromTarget =
      target && typeof target === "object"
        ? {
            calories: Math.round(num(target.calories)),
            protein: Math.round(num(target.protein)),
            carbs: Math.round(num(target.carbs)),
            fats: Math.round(num(target.fats)),
          }
        : null;

    const macrosFromScaled =
      scaled && typeof scaled === "object"
        ? {
            calories: Math.round(num(scaled.calories)),
            protein: Math.round(num(scaled.protein)),
            carbs: Math.round(num(scaled.carbs)),
            fats: Math.round(num(scaled.fats)),
          }
        : null;

    const macrosToShow = macrosFromScaled || macrosFromTarget || macrosFromBase;

    return {
      // ✅ include plan item id for later updates/detail screens
      meal_plan_item_id: item.id,

      // core meal fields
      id: meal.id,
      recipe_id,
      name: meal.name,
      description: meal.description,
      instructions: meal.instructions || null,
      author_name: meal.author_name || null,
      meal_type: meal.meal_type,
      diet_tags: meal.diet_tags,
      ready_in_minutes: meal.ready_in_minutes,
      image_url: meal.image_url || null,

      // keep base macros fields (nice for debugging / recipe screen)
      base_kcal: baseKcal,
      base_protein_g: baseProtein,
      base_carbs_g: baseCarbs,
      base_fat_g: baseFat,

      // ✅ what the UI actually renders
      macros: macrosToShow,

      // keep your "readyIn" string
      readyIn:
        typeof meal.ready_in_minutes === "number"
          ? `${meal.ready_in_minutes} min`
          : "- min",

      // UI helpers
      slot: item.course || deriveSlotLabel(item, meal),
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

// NEW Load a meal with its ingredients + details for scaling
export async function getMealWithIngredients(mealId) {
  // 1) Load the meal's recipe composition (meal_recipes)
  const { data: mealRecipes, error: mrErr } = await supabase
    .from("meal_recipes")
    .select("meal_id, recipe_id, sort_order, is_protein_component, portion_multiplier")
    .eq("meal_id", mealId)
    .order("sort_order", { ascending: true });

  if (mrErr) {
    console.error("[Meal] getMealWithIngredients meal_recipes error", mrErr);
    return { ok: false, error: mrErr.message };
  }

  if (!mealRecipes || mealRecipes.length === 0) {
    return { ok: true, data: [] };
  }

  const recipeIds = mealRecipes.map((r) => r.recipe_id);

  // 2) Load all recipe_ingredients for those recipes + ingredient nutrition
  const { data: recipeIngredients, error: riErr } = await supabase
  .from("recipe_ingredients")
  .select(`
    id,
    recipe_id,
    ingredient_id,
    default_grams,
    min_grams,
    max_grams,
    scaling_role,
    step_grams,
    ingredient:ingredients (
      id,
      name,
      category,
      is_starchy,
      kcal_per_gram,
      protein_g_per_gram,
      carbs_g_per_gram,
      fat_g_per_gram,
      grams_per_unit,
      unit_label
    )
  `)
  .in("recipe_id", recipeIds);

  if (riErr) {
    console.error("[Meal] getMealWithIngredients recipe_ingredients error", riErr);
    return { ok: false, error: riErr.message };
  }

  // 3) Stitch meal_recipes metadata onto each ingredient row
  const metaByRecipeId = new Map(mealRecipes.map((mr) => [mr.recipe_id, mr]));

  const rows = (recipeIngredients || []).map((ri) => {
    const meta = metaByRecipeId.get(ri.recipe_id) || {};
    return {
      meal_id: mealId,
      recipe_id: ri.recipe_id,
      sort_order: meta.sort_order ?? 0,
      is_protein_component: meta.is_protein_component ?? false,
      portion_multiplier: meta.portion_multiplier ?? 1,
      ...ri,
    };
  });

  // 4) Sort by meal recipe order (so scaling feels stable/predictable)
  rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return { ok: true, data: rows };
}

// NEW Helper to compute target macros per meal item based on profile + course
function getCourseSplit(mealsPerDay, course, sequenceIndex) {
  const mpd = Number(mealsPerDay) || 4;

  // Normalize course text
  const c = (course || "").toLowerCase();

  // MVP splits
  if (mpd === 3) {
    const splits = { breakfast: 0.30, lunch: 0.35, dinner: 0.35 };
    return splits[c] ?? 0;
  }

  if (mpd === 5) {
    // Two snacks: we’ll treat seq 2 as snack1, seq 4 as snack2
    // If you later store course = "snack" for both, sequenceIndex distinguishes them.
    const isSnack = c === "snack";
    if (isSnack && sequenceIndex === 4) return 0.15; // snack2
    const splits = { breakfast: 0.20, lunch: 0.25, snack: 0.15, dinner: 0.25 };
    return splits[c] ?? 0;
  }

  // Default: 4 meals/day
  const splits = { breakfast: 0.25, lunch: 0.30, snack: 0.15, dinner: 0.30 };
  return splits[c] ?? 0;
}

// NEW Build target macros for a meal plan item based on profile + course
function buildTargetMacrosForItem(profile, item) {
  const calories = Number(profile.macros_kcal) || 0;
  const protein = Number(profile.macros_protein_g) || 0;
  const carbs   = Number(profile.macros_carbs_g) || 0;
  const fats    = Number(profile.macros_fat_g) || 0;

  console.log("[Target] mpd/course/index", profile.meals_per_day, item.course, item.sequence_index);

  const split = getCourseSplit(profile.meals_per_day, item.course, item.sequence_index);

  return {
    calories: Math.round(calories * split),
    protein:  Math.round(protein * split),
    carbs:    Math.round(carbs * split),
    fats:     Math.round(fats * split),
    split,
    course: item.course,
  };
}

// Loads a single meal_plan_item + its meal row (and returns a "meal-shaped" object your UI can use)
export async function getMealPlanItemDetails(mealPlanItemId) {
  const { data, error } = await supabase
    .from("meal_plan_items")
    .select(`
      id,
      meal_id,
      sequence_index,
      course,
      scaled_macros,
      target_macros,
      meals:meals (
        id,
        name,
        description,
        meal_type,
        diet_tags,
        ready_in_minutes,
        image_url,
        base_kcal,
        base_protein_g,
        base_carbs_g,
        base_fat_g,
        instructions,
        author_name
      )
    `)
    .eq("id", mealPlanItemId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Meal plan item not found." };

  const meal = data.meals;

  // Pick macros to show (scaled -> target -> base)
  const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

  const macrosFromBase =
    meal?.base_kcal == null
      ? null
      : {
          calories: Math.round(num(meal.base_kcal)),
          protein: Math.round(num(meal.base_protein_g)),
          carbs: Math.round(num(meal.base_carbs_g)),
          fats: Math.round(num(meal.base_fat_g)),
        };

  const macrosFromTarget =
    data.target_macros && typeof data.target_macros === "object"
      ? {
          calories: Math.round(num(data.target_macros.calories)),
          protein: Math.round(num(data.target_macros.protein)),
          carbs: Math.round(num(data.target_macros.carbs)),
          fats: Math.round(num(data.target_macros.fats)),
        }
      : null;

  const macrosFromScaled =
    data.scaled_macros && typeof data.scaled_macros === "object"
      ? {
          calories: Math.round(num(data.scaled_macros.calories)),
          protein: Math.round(num(data.scaled_macros.protein)),
          carbs: Math.round(num(data.scaled_macros.carbs)),
          fats: Math.round(num(data.scaled_macros.fats)),
        }
      : null;

  const macrosToShow = macrosFromScaled || macrosFromTarget || macrosFromBase;

  return {
    ok: true,
    data: {
      meal_plan_item_id: data.id,
      id: meal?.id,
      name: meal?.name,
      description: meal?.description,
      meal_type: meal?.meal_type,
      diet_tags: meal?.diet_tags,
      ready_in_minutes: meal?.ready_in_minutes,
      image_url: meal?.image_url,
      instructions: meal?.instructions,
      author_name: meal?.author_name,
      slot: data.course,
      sequence_index: data.sequence_index,
      macros: macrosToShow,

      target_macros: data.target_macros || null,
      scaled_macros: data.scaled_macros || null,
    },
  };
}

// NEW Update the current user's profile with a partial patch
export async function updateCurrentUserProfile(patch) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError?.message || "Not signed in." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[Profiles] updateCurrentUserProfile error", error);
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Profile not found for current user." };
  }

  return { ok: true, data };
}

// NEW Mark the current user's plan as stale (so a new plan is generated next time)
export async function markPlanStale(reason = "Profile updated") {
  return updateCurrentUserProfile({
    plan_stale: true,
    plan_stale_reason: reason,
    plan_stale_at: new Date().toISOString(),
  });
}

// NEW Recompute smart macros based on current profile and save them
export async function recomputeAndSaveSmartMacros() {
  const profileRes = await getCurrentUserProfile();
  if (!profileRes.ok || !profileRes.data) {
    return { ok: false, error: profileRes.error || "Could not load profile." };
  }

  const p = profileRes.data;

  // derive age from dob (since your calculator wants age)
  const age = (() => {
    if (!p.dob) return null;
    const dob = new Date(p.dob);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) years--;
    return years;
  })();

  const macros = computeSmartMacros({
    age,
    weightKg: p.weight_kg,
    heightCm: p.height_cm,
    activity: p.activity_level,
    sex: p.metabolism_sex,
    goal: p.goal,
  });

  if (!macros) {
    return {
      ok: false,
      error: "Missing age/weight/height to compute macros.",
    };
  }

  // Save macro fields back to profile
  return updateCurrentUserProfile({
    macros_mode: "smart",
    macros_kcal: macros.kcal,
    macros_protein_g: macros.proteinG,
    macros_carbs_g: macros.carbsG,
    macros_fat_g: macros.fatsG,
  });
}

function ageFromDobString(dobStr) {
  if (!dobStr) return null;
  const [year, month, day] = String(dobStr).split("-");
  if (!year || !month || !day) return null;
  return dobToAge(year, month, day);
}

export async function regenerateMealPlanForCurrentUser({ reason = "User regenerated plan" } = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError?.message || "Not signed in." };
  }

  // 1) Profile
  const profRes = await getCurrentUserProfile();
  if (!profRes.ok || !profRes.data) {
    return { ok: false, error: profRes.error || "Could not load profile." };
  }
  const profile = profRes.data;

  // 2) Compute macros
  const age = ageFromDobString(profile.dob);
  const weightKg = profile.weight_kg;
  const heightCm = profile.height_cm;

  const activity = mapActivity(profile.activity_level); // ⚠️ only if activity_level stored as UI values
  const sex = mapSexForApi(profile.metabolism_sex);
  const goal = profile.goal || "maintain";

  const macros = computeSmartMacros({
    age,
    weightKg,
    heightCm,
    activity,
    sex,
    goal,
  });

  if (!macros) {
    return {
      ok: false,
      error: "Missing profile data (age/weight/height) to compute macros.",
    };
  }

  // 3) Pick meals (MVP: random from meals table)
  const mealsPerDay = Number(profile.meals_per_day || 4);

  const { data: meals, error: mealsErr } = await supabase
    .from("meals")
    .select("id")
    .limit(200);

  if (mealsErr) return { ok: false, error: mealsErr.message };
  if (!meals?.length) return { ok: false, error: "No meals exist yet to generate a plan." };

  const chosen = [...meals].sort(() => Math.random() - 0.5).slice(0, mealsPerDay);

 // 4) Find latest plan (if any)
const { data: existingPlan, error: existingErr } = await supabase
  .from("meal_plans")
  .select("id")
  .eq("user_id", user.id)
  .order("generated_for", { ascending: false })
  .limit(1)
  .maybeSingle();

if (existingErr) return { ok: false, error: existingErr.message };

// 5) Upsert behavior: update if exists, else insert
let plan;

if (existingPlan?.id) {
  const { data: updated, error: updErr } = await supabase
    .from("meal_plans")
    .update({
      generated_for: new Date().toISOString(),
      macros_used: {
        calories: macros.kcal,
        protein_g: macros.proteinG,
        carbs_g: macros.carbsG,
        fats_g: macros.fatsG,
      },
    })
    .eq("id", existingPlan.id)
    .select()
    .single();

  if (updErr) return { ok: false, error: updErr.message };
  plan = updated;

  // Clear old items
  const { error: delErr } = await supabase
    .from("meal_plan_items")
    .delete()
    .eq("meal_plan_id", plan.id);

  if (delErr) return { ok: false, error: delErr.message };
} else {
  const { data: inserted, error: insErr } = await supabase
    .from("meal_plans")
    .insert({
      user_id: user.id,
      generated_for: new Date().toISOString(),
      macros_used: {
        calories: macros.kcal,
        protein_g: macros.proteinG,
        carbs_g: macros.carbsG,
        fats_g: macros.fatsG,
      },
    })
    .select()
    .single();

  if (insErr) return { ok: false, error: insErr.message };
  plan = inserted;
}

// Now insert new items
const items = chosen.map((m, idx) => ({
  meal_plan_id: plan.id,
  meal_id: m.id,
  sequence_index: idx,
}));

console.log("[Regen] starting regenerate...");

const { error: itemsErr } = await supabase.from("meal_plan_items").insert(items);
if (itemsErr) return { ok: false, error: itemsErr.message };

  // 6) Clear stale + store computed macros on profile
  const clearRes = await updateCurrentUserProfile({
    macros_mode: "smart",
    macros_kcal: macros.kcal,
    macros_protein_g: macros.proteinG,
    macros_carbs_g: macros.carbsG,
    macros_fat_g: macros.fatsG,
    plan_stale: false,
    plan_stale_reason: null,
    plan_stale_at: null,
  });

  if (!clearRes.ok) return { ok: false, error: clearRes.error };

  return { ok: true, data: { planId: plan.id } };
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
