import { apiFetch } from "./api";
import { mapActivity, mapSexForApi, dobToAge } from "./mappers";
import { supabase } from "@/lib/supabaseClient";

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

// 🔹 Get current user profile (GET /api/v1/users/)
export async function getCurrentUserProfile() {
  return apiRequest("/api/v1/users/", "GET");
}

// 🔹 Generic profile update (PUT /api/v1/users/)
export async function updateUserProfile(partialProfile) {
  // partialProfile can be { mealsPerDay: 4 } or { weight: 73.0 } etc.
  return apiRequest("/api/v1/users/", "PUT", partialProfile);
}

// 🔹 Specific helper for mealsPerDay
export async function updateMealsPerDay(meals) {
  // API docs say: "mealsPerDay" in request body
  return updateUserProfile({ mealsPerDay: meals });
}

// 🔹 Specific helper for activityLevel
export async function updateActivityLevel(activity) {
  // `activity` should be one of:
  // "sedentary" | "lightly_active" | "moderately_active" | "very_active"
  // (whatever your ActivityLevel component uses)
  return callApi("/api/v1/users/", "PUT", {
    activityLevel: activity,
  });
}

// 🔹 Specific helper for goal
export async function updateGoal(goal) {
  // backend expects "goal": "maintain" | "lose" | "gain"
  return authFetch("/users/", {
    method: "PUT",
    body: JSON.stringify({ goal }),
  });
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