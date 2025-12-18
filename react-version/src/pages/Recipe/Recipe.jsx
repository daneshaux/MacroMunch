// src/pages/Recipe/Recipe.jsx
import AppHeader from "@/components/AppHeader/AppHeader";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Recipe.module.css";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useEffect, useState } from "react";
import { getCurrentUserProfile } from "@/lib/userApi";
import {
  computeRecipeTotals,
  scaleRecipeByCalories,
  getRecipeWithIngredients,
} from "@/lib/scaleRecipe";

const DAILY_MACROS = [
  { key: "Protein", value: "32 g" },
  { key: "Carbs", value: "420 g" },
  { key: "Fats", value: "14 g" },
];

const INGREDIENTS = [
  "1 cup rolled oats",
  "1 scoop vanilla protein powder",
  "1 tbsp chia seeds",
  "1 tbsp Greek yogurt",
  "1 banana",
];

const SPICES = [
  "1 tsp turmeric",
  "1 tsp ginger",
  "1 tsp cinnamon",
];

function Recipe({ firstName = "there" }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const meal = state?.meal || null;

  // Fallback (legacy static) if no meal was provided
  const fallbackMeal = {
    id: "fallback",
    label: "Meal",
    name: "Macro-friendly meal",
    title: "Macro-friendly meal",
    readyIn: "— min",
    description: "Balanced for energy and satiety.",
    macros: { calories: 420, protein: 32, carbs: 48, fats: 14 },
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
  };

  const displayMeal = meal || fallbackMeal;
  const displayMacros = displayMeal.macros || null;
  const displayImage =
    displayMeal.image ||
    displayMeal.image_url ||
    fallbackMeal.image;
  const displayTitle = displayMeal.name || displayMeal.title || "Meal";
  const displayLabel = displayMeal.slot || displayMeal.label || "Meal";
  const displayReady =
    displayMeal.readyIn ||
    (displayMeal.ready_in_minutes ? `${displayMeal.ready_in_minutes} min` : "— min");
  const displayDescription =
    displayMeal.description ||
    displayMeal.mealDescription ||
    recipeMeta?.description ||
    "Balanced for energy and satiety.";

  const safeName = firstName?.trim() || "there";

  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [spicesOpen, setSpicesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scaledData, setScaledData] = useState(null);
  const [recipeMeta, setRecipeMeta] = useState(null);

  const headerMacros = scaledData?.totals
    ? {
        protein: scaledData.totals.protein_g,
        carbs: scaledData.totals.carbs_g,
        fats: scaledData.totals.fats_g,
      }
    : displayMeal.macros
    ? {
        protein: displayMeal.macros.protein,
        carbs: displayMeal.macros.carbs,
        fats: displayMeal.macros.fats,
      }
    : null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const recipeId = meal?.recipe_id || meal?.id || null;
        let recipeResult = null;

        if (recipeId) {
          const recipeRes = await getRecipeWithIngredients(recipeId);
          if (recipeRes.ok) {
            recipeResult = recipeRes.data;
          } else {
            setError(recipeRes.error || "Could not load recipe.");
          }
        }

        const profileRes = await getCurrentUserProfile();
        const targetKcal =
          (profileRes.ok ? profileRes.data?.macros_kcal : null) ||
          meal?.macros?.calories ||
          null;

        const recipeForScaling =
          recipeResult &&
          Array.isArray(recipeResult.recipe_ingredients) &&
          recipeResult.recipe_ingredients.length > 0
            ? {
                ...recipeResult,
                ingredients: recipeResult.recipe_ingredients.map((ri) => ({
                  ...ri,
                  ingredient: ri.ingredient,
                })),
              }
            : null;

        const baseTotals = recipeForScaling
          ? computeRecipeTotals(recipeForScaling)
          : null;

        const scaled =
          recipeForScaling && (targetKcal || baseTotals?.calories)
            ? scaleRecipeByCalories(
                recipeForScaling,
                targetKcal || baseTotals?.calories
              )
            : null;

        if (recipeResult) setRecipeMeta(recipeResult);
        if (scaled) setScaledData(scaled);
        else setScaledData(null);
      } catch (err) {
        console.error("[Recipe] load error", err);
        setError(err.message || "Could not load recipe.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [meal]);

  const instructionsList = (() => {
    const raw = recipeMeta?.instructions || recipeMeta?.steps || "";
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }
    return null;
  })();

  return (
    <main className={styles.screen}>
      <div className={styles.headerWrapper}>
        <AppHeader
          firstName={safeName}
          onProfileClick={() => navigate("/profile")}
          onNotificationsClick={() => alert("Notifications coming soon")}
        />
      </div>

      <section className={styles.hero}>
        <h1 className={styles.title}>{displayTitle}</h1>
        <p className={styles.subtitle}>
          By <span className={styles.chef}>Gordon Ramsey</span>
        </p>
      </section>

      <section className={styles.macrosCard}>
        <div className={styles.macrosGrid}>
          {(headerMacros
            ? [
                { key: "Protein", value: `${Math.round(headerMacros.protein || 0)} g` },
                { key: "Carbs", value: `${Math.round(headerMacros.carbs || 0)} g` },
                { key: "Fats", value: `${Math.round(headerMacros.fats || 0)} g` },
              ]
            : DAILY_MACROS
          ).map((macro) => (
            <div key={macro.key} className={styles.macroBlock}>
              <span className={styles.macroLabel}>{macro.key}</span>
              <span className={styles.macroValue}>{macro.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.planSection}>
        <div className={styles.planList}>
          <article
            key={displayMeal.id}
            className={styles.mealCard}
          >
            <div className={styles.mealMedia}>
              <img src={displayImage} alt={displayTitle} />
            </div>

            {/* Ingredients */}
            <div className={styles.ingredients}>
              <div className={styles.ingredientSection}>
                <h3>Ingredients</h3>
                <h3>
                  {!ingredientsOpen && (
                    <IoIosArrowDown
                      onClick={() => setIngredientsOpen(true)}
                    />
                  )}
                  {ingredientsOpen && (
                    <IoIosArrowUp
                      onClick={() => setIngredientsOpen(false)}
                    />
                  )}
                </h3>
              </div>
              {ingredientsOpen && (
                <div className={styles.macropillContainer}>
                  {(scaledData?.scaledIngredients || []).map((ri, index) => {
                    const name =
                      ri.ingredient?.name ||
                      ri.ingredient_id ||
                      `Ingredient ${index + 1}`;
                    const grams = Math.round(ri.scaled_grams || 0);
                    return (
                      <div
                        key={`${name}-${index}`}
                        className={styles.macropill}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {grams ? `${grams} g · ${name}` : name}
                      </div>
                    );
                  })}

                  {(!scaledData || scaledData.scaledIngredients?.length === 0) &&
                    INGREDIENTS.map((item, index) => (
                      <div
                        key={item}
                        className={styles.macropill}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {item}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Spices */}
            <div className={styles.spices}>
              <div className={styles.spicesSection}>
                <h3>Spices & Seasoning</h3>
                <h3>
                  {!spicesOpen && (
                    <IoIosArrowDown onClick={() => setSpicesOpen(true)} />
                  )}
                  {spicesOpen && (
                    <IoIosArrowUp onClick={() => setSpicesOpen(false)} />
                  )}
                </h3>
              </div>
              {spicesOpen && (
                <div className={styles.macropillContainer}>
                  {SPICES.map((item, index) => (
                    <div
                      key={item}
                      className={styles.macropill}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className={styles.instruction}>
              <h3 className={styles.instructionTitle}>Instructions</h3>

              {instructionsList ? (
                <ol className={styles.instructionList}>
                  {instructionsList.map((step, idx) => (
                    <li key={idx} className={styles.instructionText}>
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.instructionText}>
                  <br />
                  <span>1. Cook the oats</span>
                  <br />
                  <br />
                  In a pot, cook ½ cup oats with 1 cup water or milk, a pinch of
                  salt, cinnamon, and optional turmeric/ginger until thick.
                  <br />
                  <br />
                  <span>2. Stir in the protein</span>
                  <br />
                  <br />
                  Remove from heat and mix in 1 scoop protein powder + 1 tbsp
                  chia or flax. Add a splash of milk if too thick.
                  <br />
                  <br />
                  <span>3. Add toppings</span>
                  <br />
                  <br />
                  Top with banana, berries, a drizzle of honey or maple syrup,
                  and a spoon of nut butter or granola.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Recipe;
