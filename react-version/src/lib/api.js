// src/lib/api.js
import { supabase } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL; // ✅ your Render backend URL

// Helper: fetch the current user's Supabase JWT
async function getJwt() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Minimal fetch wrapper that injects Supabase JWT.
 * Example: apiFetch("/api/v1/users/", { method: "POST", body: {...} })
 */
export async function apiFetch(path, { method = "GET", headers = {}, body } = {}) {
  const token = await getJwt();
  if (!token) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: json?.message || json?.error || res.statusText,
        data: json,
      };
    }

    return { ok: true, status: res.status, data: json };
  } catch (err) {
    console.error("API fetch failed:", err);
    return { ok: false, status: 500, error: err.message };
  }
}