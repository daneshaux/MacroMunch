import { supabase } from "@/lib/supabaseClient";

// Compute macros for a single ingredient given grams and per-100g nutrient data.
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

// Sum macros across all recipe ingredients using their default_grams.
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

// Scale a recipe's ingredients to hit a target kcal.
export function scaleRecipeByCalories(recipeWithIngredients, targetKcal) {
  const notes = [];
  const baseTotals = computeRecipeTotals(recipeWithIngredients);

  let multiplier = 1;
  if (baseTotals.calories > 0 && Number.isFinite(targetKcal) && targetKcal > 0) {
    multiplier = targetKcal / baseTotals.calories;
  } else {
    notes.push("Base calories missing; kept default grams.");
  }

  const totals = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
  const scaledIngredients = [];

  for (const ri of recipeWithIngredients?.ingredients ?? []) {
    const baseGrams = Number(ri.default_grams) || 0;
    let scaledGrams = baseGrams * multiplier;

    const minG = ri.min_grams;
    const maxG = ri.max_grams;

    if (Number.isFinite(minG)) {
      scaledGrams = Math.max(scaledGrams, Number(minG));
    }
    if (Number.isFinite(maxG) && maxG > 0) {
      scaledGrams = Math.min(scaledGrams, Number(maxG));
    }

    const macros = computeIngredientMacros(scaledGrams, ri.ingredient);
    totals.calories += macros.calories;
    totals.protein_g += macros.protein_g;
    totals.carbs_g += macros.carbs_g;
    totals.fats_g += macros.fats_g;

    scaledIngredients.push({
      ...ri,
      scaled_grams: scaledGrams,
      macros,
    });
  }

  return {
    scaledIngredients,
    totals,
    baseTotals,
    multiplier,
    notes,
  };
}

// Fetch a recipe with its ingredients + ingredient nutrition.
export async function getRecipeWithIngredients(recipeId) {
  // 1) Fetch the recipe row
  const { data: recipe, error: recipeErr } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .maybeSingle();

  if (recipeErr) {
    console.error("[Recipe] fetch recipe error", recipeErr);
    return { ok: false, error: recipeErr.message };
  }

  // 2) Fetch ingredients for this recipe, joining ingredient nutrition
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
        ingredient:ingredients (
          id,
          name,
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

  const data = {
    ...recipe,
    recipe_ingredients: recipeIngredients || [],
  };

  console.log("[Recipe] fetched recipe shape", data);

  return { ok: true, data };
}
