// src/lib/scaleRecipe.js
import { supabase } from "@/lib/supabaseClient";

/** ---------------------------
 *  Utilities
 *  --------------------------*/

const EPS = 1e-9;

function clamp(n, min, max) {
  let x = n;
  if (Number.isFinite(min)) x = Math.max(x, Number(min));
  if (Number.isFinite(max) && Number(max) > 0) x = Math.min(x, Number(max));
  return x;
}

function roundToStep(grams, step) {
  const s = Number(step);
  if (!Number.isFinite(s) || s <= 0) return grams;
  return Math.round(grams / s) * s;
}

function normalizeRole(ri) {
  // scaling_role is YOUR new column: "lever" | "anchor" | null
  const role = String(ri?.scaling_role || "").trim().toLowerCase();
  return role === "lever" ? "lever" : "anchor";
}

function normalizeCategory(ri) {
  // You said categories: carb, protein, fat, veg, spice, liquid
  return String(ri?.ingredient?.category || "").trim().toLowerCase();
}

function getEffectiveStep(ri) {
  // step_grams is your new column on recipe_ingredients
  const s = Number(ri?.step_grams);
  return Number.isFinite(s) && s > 0 ? s : 1; // default 1g increments
}

function getCurrentGrams(ri) {
  // prefer scaled_grams if present, otherwise default_grams
  const g = Number(ri?.scaled_grams ?? ri?.default_grams);
  return Number.isFinite(g) ? g : 0;
}

function getMinMax(ri) {
  const min = Number(ri?.min_grams);
  const max = Number(ri?.max_grams);
  return {
    min: Number.isFinite(min) ? min : undefined,
    max: Number.isFinite(max) ? max : undefined,
  };
}

/** Combine duplicates by ingredient_id (or ingredient.id).
 *  This prevents "olive oil twice" and makes scaling stable.
 */
export function combineDuplicateIngredients(rows) {
  const map = new Map();

  for (const ri of rows ?? []) {
    const ingId = ri?.ingredient_id || ri?.ingredient?.id;
    const key = String(ingId || ri?.id || Math.random());

    if (!map.has(key)) {
      map.set(key, { ...ri });
      continue;
    }

    // Combine grams + keep stricter clamps + prefer lever if either is lever
    const existing = map.get(key);
    const existingGrams = getCurrentGrams(existing);
    const newGrams = getCurrentGrams(ri);

    const exRole = normalizeRole(existing);
    const newRole = normalizeRole(ri);

    const exMM = getMinMax(existing);
    const newMM = getMinMax(ri);

    map.set(key, {
      ...existing,
      // sum grams at the "default" level too (so computeRecipeTotals stays sane)
      default_grams: (Number(existing.default_grams) || 0) + (Number(ri.default_grams) || 0),
      scaled_grams: existingGrams + newGrams,
      // min becomes sum of mins if both exist; max becomes sum of maxes if both exist
      min_grams:
        Number.isFinite(exMM.min) && Number.isFinite(newMM.min) ? exMM.min + newMM.min : (exMM.min ?? newMM.min),
      max_grams:
        Number.isFinite(exMM.max) && Number.isFinite(newMM.max) ? exMM.max + newMM.max : (exMM.max ?? newMM.max),
      scaling_role: exRole === "lever" || newRole === "lever" ? "lever" : "anchor",
      // step: prefer the smaller step for finer control
      step_grams: Math.min(getEffectiveStep(existing), getEffectiveStep(ri)),
    });
  }

  return Array.from(map.values());
}

/** ---------------------------
 *  Macros
 *  --------------------------*/

// Compute macros for a single ingredient given grams and per-gram nutrient data.
export function computeIngredientMacros(grams, ingredient = {}) {
  const factor = grams > 0 ? grams : 0;

  const calories = Number(ingredient.kcal_per_gram);
  const protein = Number(ingredient.protein_g_per_gram);
  const carbs = Number(ingredient.carbs_g_per_gram);
  const fats = Number(ingredient.fat_g_per_gram);

  return {
    calories: Number.isFinite(calories) ? calories * factor : 0,
    protein_g: Number.isFinite(protein) ? protein * factor : 0,
    carbs_g: Number.isFinite(carbs) ? carbs * factor : 0,
    fats_g: Number.isFinite(fats) ? fats * factor : 0,
  };
}

export function computeTotalsFromRows(rows) {
  const totals = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };

  for (const ri of rows ?? []) {
    const grams = getCurrentGrams(ri);
    const macros = computeIngredientMacros(grams, ri.ingredient);
    totals.calories += macros.calories;
    totals.protein_g += macros.protein_g;
    totals.carbs_g += macros.carbs_g;
    totals.fats_g += macros.fats_g;
  }

  return totals;
}

// Sum macros across all recipe ingredients using default_grams (legacy support)
export function computeRecipeTotals(recipeWithIngredients) {
  const totals = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
  if (!recipeWithIngredients?.ingredients) return totals;

  for (const ri of recipeWithIngredients.ingredients) {
    const grams = Number(ri.default_grams) || 0;
    const macros = computeIngredientMacros(grams, ri.ingredient);
    totals.calories += macros.calories;
    totals.protein_g += macros.protein_g;
    totals.carbs_g += macros.carbs_g;
    totals.fats_g += macros.fats_g;
  }

  return totals;
}

/** ---------------------------
 *  Per-meal scaling (Option C style)
 *  --------------------------
 *  - Anchors are fixed (or you can still clamp them to defaults)
 *  - Levers are allowed to move within min/max in step_grams increments
 *  - Goal: land within +/- tolerance grams on P/C/F for the meal target
 */

function residuals(totals, target) {
  return {
    protein_g: (target.protein_g || 0) - (totals.protein_g || 0),
    carbs_g: (target.carbs_g || 0) - (totals.carbs_g || 0),
    fats_g: (target.fats_g || 0) - (totals.fats_g || 0),
  };
}

function withinTolerance(res, tol) {
  return (
    Math.abs(res.protein_g) <= tol &&
    Math.abs(res.carbs_g) <= tol &&
    Math.abs(res.fats_g) <= tol
  );
}

function getMacroDominance(ingredient) {
  // which macro does this ingredient "mostly" contribute per gram?
  const p = Number(ingredient?.protein_g_per_gram) || 0;
  const c = Number(ingredient?.carbs_g_per_gram) || 0;
  const f = Number(ingredient?.fat_g_per_gram) || 0;

  if (p >= c && p >= f) return "protein_g";
  if (c >= p && c >= f) return "carbs_g";
  return "fats_g";
}

/**
 * Pick best lever rows for each macro in a meal.
 * If you have explicit lever macros, we still auto-detect by dominance
 * (keeps MVP simple and works even if category is "liquid").
 */
function getLeverCandidates(rows) {
  return (rows ?? []).filter((ri) => normalizeRole(ri) === "lever");
}

function applyDeltaToRow(ri, deltaGrams) {
  const step = getEffectiveStep(ri);
  const { min, max } = getMinMax(ri);

  const current = getCurrentGrams(ri);
  let next = current + deltaGrams;

  // clamp, then round to step, then clamp again (rounding can push over)
  next = clamp(next, min, max);
  next = roundToStep(next, step);
  next = clamp(next, min, max);

  return { ...ri, scaled_grams: next };
}

/**
 * Greedy nudge: adjust levers iteratively.
 * This is not "perfect solver math", but it is stable, fast, and MVP-friendly.
 */
export function scaleRecipeToMacroTargets(recipeWithIngredients, targetMacros, opts = {}) {
  const tol = Number(opts.tolerance_g ?? 2.5); // your “2–3g”
  const maxIters = Number(opts.maxIterations ?? 250);

  const notes = [];
  const baseRows = combineDuplicateIngredients(recipeWithIngredients?.ingredients ?? []);

  // Start from default grams (anchors fixed by default, levers can move)
  let rows = baseRows.map((ri) => ({
    ...ri,
    scaled_grams: Number(ri.default_grams) || 0,
  }));

  // Compute initial totals
  let totals = computeTotalsFromRows(rows);
  let res = residuals(totals, targetMacros);

  if (withinTolerance(res, tol)) {
    return { scaledIngredients: rows, totals, baseTotals: computeTotalsFromRows(baseRows), notes };
  }

  const levers = getLeverCandidates(rows);

  if (levers.length === 0) {
    notes.push("No levers in this recipe; cannot macro-balance beyond anchors.");
    return { scaledIngredients: rows, totals, baseTotals: computeTotalsFromRows(baseRows), notes };
  }

  // Pre-classify levers by dominant macro (protein/carb/fat)
  const leverByMacro = {
    protein_g: [],
    carbs_g: [],
    fats_g: [],
  };

  for (const ri of levers) {
    const dom = getMacroDominance(ri.ingredient);
    leverByMacro[dom].push(ri);
  }

  // helper: find a lever row instance by id inside current `rows`
  const findRowIndex = (templateRi) =>
    rows.findIndex((r) => (r.id && r.id === templateRi.id) || (r.ingredient_id && r.ingredient_id === templateRi.ingredient_id));

  // iterative nudge
  for (let iter = 0; iter < maxIters; iter++) {
    totals = computeTotalsFromRows(rows);
    res = residuals(totals, targetMacros);

    if (withinTolerance(res, tol)) {
      notes.push(`Balanced within ±${tol}g in ${iter} iterations.`);
      break;
    }

    // Decide which macro is most “off” right now
    const absRes = {
      protein_g: Math.abs(res.protein_g),
      carbs_g: Math.abs(res.carbs_g),
      fats_g: Math.abs(res.fats_g),
    };

    const macroOrder = Object.entries(absRes)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    let moved = false;

    for (const macroKey of macroOrder) {
      const pool = leverByMacro[macroKey];
      if (!pool || pool.length === 0) continue;

      // Choose the strongest lever in this pool (highest grams-per-macro per gram)
      // aka: best "efficiency" to move that macro with minimal side effects.
      let best = null;
      let bestScore = -Infinity;

      for (const ri of pool) {
        const ing = ri.ingredient || {};
        const perGram =
          macroKey === "protein_g"
            ? Number(ing.protein_g_per_gram) || 0
            : macroKey === "carbs_g"
            ? Number(ing.carbs_g_per_gram) || 0
            : Number(ing.fat_g_per_gram) || 0;

        if (perGram <= 0) continue;

        // Higher per-gram macro = better lever
        if (perGram > bestScore) {
          bestScore = perGram;
          best = ri;
        }
      }

      if (!best) continue;

      const idx = findRowIndex(best);
      if (idx < 0) continue;

      const ing = rows[idx].ingredient || {};
      const perGram =
        macroKey === "protein_g"
          ? Number(ing.protein_g_per_gram) || 0
          : macroKey === "carbs_g"
          ? Number(ing.carbs_g_per_gram) || 0
          : Number(ing.fat_g_per_gram) || 0;

      if (perGram <= 0) continue;

      // We want to reduce residual toward 0
      // If res is positive => need MORE of that macro => add grams
      // If res is negative => need LESS of that macro => subtract grams
      const desiredMacroDelta = res[macroKey]; // grams of macro
      const rawDeltaGrams = desiredMacroDelta / perGram;

      // Limit the nudge so we don’t swing wildly (MVP stability)
      const step = getEffectiveStep(rows[idx]);
      const nudge = clamp(rawDeltaGrams, -8 * step, 8 * step);

      const updated = applyDeltaToRow(rows[idx], nudge);
      if (getCurrentGrams(updated) !== getCurrentGrams(rows[idx])) {
        rows[idx] = updated;
        moved = true;
        break; // re-evaluate totals after one move
      }
    }

    if (!moved) {
      notes.push("Hit clamp limits; no more room to adjust levers.");
      break;
    }
  }

  // attach macros per row
  rows = rows.map((ri) => ({
    ...ri,
    macros: computeIngredientMacros(getCurrentGrams(ri), ri.ingredient),
  }));

  totals = computeTotalsFromRows(rows);

  return {
    scaledIngredients: rows,
    totals,
    baseTotals: computeTotalsFromRows(baseRows.map((ri) => ({ ...ri, scaled_grams: Number(ri.default_grams) || 0 }))),
    notes,
  };
}

/** ---------------------------
 *  Day-level balancing pass
 *  --------------------------
 *  Input: array of meals already scaled to per-meal targets
 *  Output: adjust levers across meals to hit day totals within ±2–3g
 */

export function balanceDayTotals(mealsScaled, dayTargetMacros, opts = {}) {
  const tol = Number(opts.tolerance_g ?? 2.5);
  const maxIters = Number(opts.maxIterations ?? 400);

  // Clone meals so we don't mutate callers
  let meals = (mealsScaled ?? []).map((m) => ({
    ...m,
    scaledIngredients: combineDuplicateIngredients(m.scaledIngredients ?? m.ingredients ?? []),
  }));

  const getDayTotals = () => {
    const t = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
    for (const meal of meals) {
      const mt = computeTotalsFromRows(meal.scaledIngredients);
      t.calories += mt.calories;
      t.protein_g += mt.protein_g;
      t.carbs_g += mt.carbs_g;
      t.fats_g += mt.fats_g;
    }
    return t;
  };

  const getDayResiduals = () => residuals(getDayTotals(), dayTargetMacros);

  const isSolved = (r) => withinTolerance(r, tol);

  // Helper: find best lever anywhere in the day for a given macro
  function findBestLeverForMacro(macroKey, direction /* +1 add, -1 remove */) {
    let best = null;

    for (let mi = 0; mi < meals.length; mi++) {
      const meal = meals[mi];
      const rows = meal.scaledIngredients;

      for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri];
        if (normalizeRole(row) !== "lever") continue;

        const ing = row.ingredient || {};
        const perGram =
          macroKey === "protein_g"
            ? Number(ing.protein_g_per_gram) || 0
            : macroKey === "carbs_g"
            ? Number(ing.carbs_g_per_gram) || 0
            : Number(ing.fat_g_per_gram) || 0;

        if (perGram <= EPS) continue;

        const { min, max } = getMinMax(row);
        const current = getCurrentGrams(row);

        // Check room in desired direction
        const hasRoom =
          direction > 0
            ? !Number.isFinite(max) || current + getEffectiveStep(row) <= max + EPS
            : !Number.isFinite(min) || current - getEffectiveStep(row) >= min - EPS;

        if (!hasRoom) continue;

        // Score: high perGram macro, low side effects (sum of other macros per gram)
        const p = Number(ing.protein_g_per_gram) || 0;
        const c = Number(ing.carbs_g_per_gram) || 0;
        const f = Number(ing.fat_g_per_gram) || 0;

        const targetPer = perGram;
        const side =
          macroKey === "protein_g"
            ? c + f
            : macroKey === "carbs_g"
            ? p + f
            : p + c;

        const score = targetPer / (side + 0.02); // 0.02 to avoid huge blow-ups
        if (!best || score > best.score) {
          best = { mi, ri, score, perGram };
        }
      }
    }

    return best; // { mi, ri, score, perGram }
  }

  let notes = [];
  let res = getDayResiduals();

  if (isSolved(res)) {
    notes.push("Day already within tolerance.");
    return { meals, dayTotals: getDayTotals(), notes };
  }

  for (let iter = 0; iter < maxIters; iter++) {
    res = getDayResiduals();
    if (isSolved(res)) {
      notes.push(`Day balanced within ±${tol}g in ${iter} iterations.`);
      break;
    }

    // Work biggest miss first
    const macroOrder = [
      { k: "protein_g", v: Math.abs(res.protein_g) },
      { k: "carbs_g", v: Math.abs(res.carbs_g) },
      { k: "fats_g", v: Math.abs(res.fats_g) },
    ]
      .sort((a, b) => b.v - a.v)
      .map((x) => x.k);

    let moved = false;

    for (const macroKey of macroOrder) {
      const need = res[macroKey];
      if (Math.abs(need) <= tol) continue;

      const direction = need > 0 ? +1 : -1;

      const best = findBestLeverForMacro(macroKey, direction);
      if (!best) continue;

      const row = meals[best.mi].scaledIngredients[best.ri];
      const step = getEffectiveStep(row);

      // Nudge by one step at a time for tight accuracy
      const updated = applyDeltaToRow(row, direction * step);

      if (getCurrentGrams(updated) !== getCurrentGrams(row)) {
        meals[best.mi].scaledIngredients[best.ri] = {
          ...updated,
          macros: computeIngredientMacros(getCurrentGrams(updated), updated.ingredient),
        };
        moved = true;
        break;
      }
    }

    if (!moved) {
      notes.push("Day balancing stopped: no remaining lever room across meals.");
      break;
    }
  }

  return { meals, dayTotals: getDayTotals(), notes };
}

/** ---------------------------
 *  Fetch
 *  --------------------------*/

// Fetch a recipe with its ingredients + ingredient nutrition.
export async function getRecipeWithIngredients(recipeId) {
  const { data: recipe, error: recipeErr } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .maybeSingle();

  if (recipeErr) {
    console.error("[Recipe] fetch recipe error", recipeErr);
    return { ok: false, error: recipeErr.message };
  }

  const { data: recipeIngredients, error: ingErr } = await supabase
    .from("recipe_ingredients")
    .select(
      `
        id,
        recipe_id,
        ingredient_id,
        default_grams,
        min_grams,
        max_grams,
        step_grams,
        scaling_role,
        is_starchy,
        ingredient:ingredients (
          id,
          name,
          category,
          kcal_per_gram,
          protein_g_per_gram,
          carbs_g_per_gram,
          fat_g_per_gram,
          grams_per_unit,
          unit_label
        )
      `
    )
    .eq("recipe_id", recipeId);

  if (ingErr) {
    console.error("[Recipe] fetch recipe_ingredients error", ingErr);
    return { ok: false, error: ingErr.message };
  }

  const data = { ...recipe, ingredients: recipeIngredients || [] };
  return { ok: true, data };
}