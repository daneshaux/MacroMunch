// src/pages/Recipe/Recipe.jsx
import AppHeader from "@/components/AppHeader/AppHeader";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Recipe.module.css";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useEffect, useState } from "react";
import { getMealWithIngredients } from "@/lib/userApi";


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
  

  const safeName = firstName?.trim() || "there";

  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [spicesOpen, setSpicesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scaledData, setScaledData] = useState(null);

  const displayDescription =
    displayMeal.description ||
    displayMeal.mealDescription ||
    "Balanced for energy and satiety.";


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
  async function load() {
    setLoading(true);
    setError(null);

    try {
      const mealId = meal?.id || null;

      console.log("[Recipe] meal keys", Object.keys(meal || {}));
      console.log("[Recipe] mealId resolved to", mealId);

      if (!mealId) {
        setScaledData(null);
        return;
      }

      const mealRes = await getMealWithIngredients(mealId);

      console.log("[Recipe] getMealWithIngredients ok?", mealRes.ok);
      console.log("[Recipe] mealRes.error", mealRes.error);
      console.log("[Recipe] meal ingredient rows len", mealRes.data?.length);
      console.log("[Recipe] first row", mealRes.data?.[0]);

      if (!mealRes.ok) {
        setError(mealRes.error || "Could not load meal ingredients.");
        setScaledData(null);
        return;
      }

      // Use the rows directly for the UI (grams come from row.grams)
      setScaledData({
        scaledIngredients: mealRes.data || [],
        totals: null, // header should fall back to displayMeal.macros
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
}, [meal]);

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
  String(row?.ingredient?.category || "")
    .trim()
    .toLowerCase() === "spice";

const mainIngredients = rows.filter((r) => !isSpice(r));
const spices = rows.filter((r) => isSpice(r));


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
                  {mainIngredients.map((ri, index) => {
                    const name =
                      ri.ingredient?.name ||
                      ri.ingredient_id ||
                      `Ingredient ${index + 1}`;
                    const grams = Math.round(ri.grams ?? ri.default_grams ?? 0);
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
                  {spices.length > 0 ? (
                    spices.map((ri, index) => {
                      const name =
                        ri.ingredient?.name ||
                        ri.ingredient_id ||
                        `Spice ${index + 1}`;

                      const grams = Math.round(ri.grams ?? ri.default_grams ?? 0);

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
                    <p className={styles.instructionText}>Spices coming soon 💚</p>
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
