// src/pages/Recipe/Recipe.jsx
import AppHeader from "@/components/AppHeader/AppHeader";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./Recipe.module.css";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useEffect, useState } from "react";
import { getMealWithIngredients, getMealPlanItemDetails, getCurrentUserProfile } from "@/lib/userApi";

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

function Recipe() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { mealPlanItemId } = useParams();

  // ✅ persisted meal state (starts from navigation state if present)
  const [meal, setMeal] = useState(state?.meal || null);

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
  const displayImage = displayMeal.image || displayMeal.image_url || fallbackMeal.image;
  const displayTitle = displayMeal.name || displayMeal.title || "Meal";
  const displayLabel = displayMeal.slot || displayMeal.label || "Meal";
  const displayReady =
    displayMeal.readyIn ||
    (displayMeal.ready_in_minutes ? `${displayMeal.ready_in_minutes} min` : "— min");


  const [profile, setProfile] = useState(null);
  const safeName = profile?.first_name?.trim() || "there";
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [spicesOpen, setSpicesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scaledData, setScaledData] = useState(null);

  const displayDescription =
    displayMeal.description || displayMeal.mealDescription || "Balanced for energy and satiety.";

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

  console.log("[Recipe] headerMacros", headerMacros);

  useEffect(() => {
  let mounted = true;

  async function loadProfile() {
    const res = await getCurrentUserProfile();
    if (!mounted) return;

    if (res.ok) setProfile(res.data);
    else setProfile(null);
  }

  loadProfile();
  return () => {
    mounted = false;
  };
}, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        console.log("[Recipe] mealPlanItemId param:", mealPlanItemId);

        // If no param, we're on /recipe without persistence
        if (!mealPlanItemId) {
          console.warn("[Recipe] Missing mealPlanItemId. Showing state meal or fallback.");
          setScaledData(null);
          return;
        }

        // Fetch the “meal-shaped” object for this meal plan item
        const itemRes = await getMealPlanItemDetails(mealPlanItemId);

        console.log("[Recipe] getMealPlanItemDetails ok?", itemRes.ok);
        console.log("[Recipe] getMealPlanItemDetails error", itemRes.error);

        if (!itemRes.ok) {
          setError(itemRes.error || "Could not load this meal.");
          setScaledData(null);
          return;
        }

        const fetchedMeal = itemRes.data;
        setMeal(fetchedMeal);

        const mealId = fetchedMeal?.id || null;
        if (!mealId) {
          setError("Meal id missing on fetched meal.");
          setScaledData(null);
          return;
        }

        const mealRes = await getMealWithIngredients(mealId);

        console.log("[Recipe] getMealWithIngredients ok?", mealRes.ok);
        console.log("[Recipe] mealRes.error", mealRes.error);
        console.log("[Recipe] meal ingredient rows len", mealRes.data?.length);

        if (!mealRes.ok) {
          setError(mealRes.error || "Could not load meal ingredients.");
          setScaledData(null);
          return;
        }

        const target = fetchedMeal?.target_macros || null;

        const scaled = scaleMealLinesToTarget(mealRes.data || [], target);

        setScaledData({
          scaledIngredients: scaled.scaledIngredients,
          totals: scaled.totals,
          notes: scaled.notes,
        });
      } catch (err) {
        console.error("[Recipe] load error", err);
        setError(err.message || "Could not load meal.");
        setScaledData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [mealPlanItemId]);

  const instructionsList = (() => {
    const raw = displayMeal.instructions || "";
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return null;
  })();

  console.log("[Recipe] instructions preview", displayMeal.instructions);

  const rows = scaledData?.scaledIngredients || [];

  const isSpice = (row) =>
    String(row?.ingredient?.category || "").trim().toLowerCase() === "spice";

  const mainIngredients = rows.filter((r) => !isSpice(r));
  const spices = rows.filter((r) => isSpice(r));

  function clamp(g, minG, maxG) {
  let out = Number(g) || 0;
  const min = minG == null ? null : Number(minG);
  const max = maxG == null ? null : Number(maxG);
  if (Number.isFinite(min)) out = Math.max(out, min);
  if (Number.isFinite(max) && max > 0) out = Math.min(out, max);
  return out;
}

function totalsFrom(rows) {
  return rows.reduce(
    (acc, r) => {
      const g = Number(r.scaled_grams ?? r.grams ?? r.default_grams) || 0;
      const ing = r.ingredient || {};
      acc.calories += g * (Number(ing.kcal_per_gram) || 0);
      acc.protein_g += g * (Number(ing.protein_g_per_gram) || 0);
      acc.carbs_g += g * (Number(ing.carbs_g_per_gram) || 0);
      acc.fats_g += g * (Number(ing.fat_g_per_gram) || 0);
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }
  );
}

/**
 * Scale only protein/carb/fat categories to match target macros.
 * Keep veg/spice fixed.
 */
function scaleMealLinesToTarget(lines, target) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { scaledIngredients: [], totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }, notes: ["No ingredients to scale."] };
  }

  if (!target || typeof target !== "object") {
    // No target? return as-is.
    const passthrough = lines.map((l) => ({ ...l, scaled_grams: Number(l.grams ?? l.default_grams) || 0 }));
    return { scaledIngredients: passthrough, totals: totalsFrom(passthrough), notes: ["Missing target macros; showing default grams."] };
  }

  const notes = [];
  const PROTEIN_CATS = ["protein"];
  const CARB_CATS = ["carb"];
  const FAT_CATS = ["fat"];

  // Start with current grams as the base
  let working = lines.map((l) => ({
    ...l,
    scaled_grams: clamp(
      Number(l.grams ?? l.default_grams) || 0,
      l.min_grams,
      l.max_grams
    ),
    category: String(l.ingredient?.category || "").toLowerCase().trim(),
  }));

  const sumCategory = (cats, key) =>
    working
      .filter((l) => cats.includes(l.category))
      .reduce((acc, l) => {
        const g = Number(l.scaled_grams) || 0;
        const ing = l.ingredient || {};
        const perG = Number(ing[key]) || 0;
        return acc + g * perG;
      }, 0);

  // 2 passes helps when clamping prevents exact match
  for (let pass = 0; pass < 2; pass += 1) {
    // Protein
    const curP = sumCategory(PROTEIN_CATS, "protein_g_per_gram");
    const mp = curP > 0 ? Number(target.protein || target.protein_g || 0) / curP : 1;
    if (!Number.isFinite(mp) || mp <= 0) notes.push("Protein scaler skipped (missing/zero protein lines).");
    working = working.map((l) =>
      PROTEIN_CATS.includes(l.category)
        ? { ...l, scaled_grams: clamp(l.scaled_grams * (Number.isFinite(mp) ? mp : 1), l.min_grams, l.max_grams) }
        : l
    );

    // Carbs
    const curC = sumCategory(CARB_CATS, "carbs_g_per_gram");
    const mc = curC > 0 ? Number(target.carbs || target.carbs_g || 0) / curC : 1;
    if (!Number.isFinite(mc) || mc <= 0) notes.push("Carb scaler skipped (missing/zero carb lines).");
    working = working.map((l) =>
      CARB_CATS.includes(l.category)
        ? { ...l, scaled_grams: clamp(l.scaled_grams * (Number.isFinite(mc) ? mc : 1), l.min_grams, l.max_grams) }
        : l
    );

    // Fats
    const curF = sumCategory(FAT_CATS, "fat_g_per_gram");
    const mf = curF > 0 ? Number(target.fats || target.fat || target.fats_g || 0) / curF : 1;
    if (!Number.isFinite(mf) || mf <= 0) notes.push("Fat scaler skipped (missing/zero fat lines).");
    working = working.map((l) =>
      FAT_CATS.includes(l.category)
        ? { ...l, scaled_grams: clamp(l.scaled_grams * (Number.isFinite(mf) ? mf : 1), l.min_grams, l.max_grams) }
        : l
    );
  }

  const totals = totalsFrom(working);
  return { scaledIngredients: working, totals, notes };
}


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
            By <span className={styles.chef}>{displayMeal.author_name || "MacroMunch"}</span>
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
                    <IoIosArrowDown onClick={() => setIngredientsOpen(true)} />
                  )}
                  {ingredientsOpen && (
                    <IoIosArrowUp onClick={() => setIngredientsOpen(false)} />
                  )}
                </h3>
              </div>

              {ingredientsOpen && (
                <div className={styles.macropillContainer}>
                  {mainIngredients.map((ri, index) => {
                    const name =
                      ri.ingredient?.name || ri.ingredient_id || `Ingredient ${index + 1}`;
                    const grams = Math.round(ri.scaled_grams ?? ri.grams ?? ri.default_grams ?? 0);

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

                  {/* ✅ fallback should be based on mainIngredients since that's what we render */}
                  {mainIngredients.length === 0 &&
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
                  {spices.length > 0 ? (
                    spices.map((ri, index) => {
                      const name =
                        ri.ingredient?.name || ri.ingredient_id || `Spice ${index + 1}`;
                      const grams = Math.round(ri.scaled_grams ?? ri.grams ?? ri.default_grams ?? 0);

                      return (
                        <div
                          key={`${ri.id || ri.ingredient_id || name}-${index}`}
                          className={styles.macropill}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {grams ? `${grams} g · ${name}` : name}
                        </div>
                      );
                    })
                  ) : (
                    // ✅ optional: make this look like a pill for UI consistency
                    <div className={styles.macropill} style={{ animationDelay: `0s` }}>
                      Spices coming soon 💚
                    </div>
                  )}
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
                  Instructions coming soon 💚
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
