// src/pages/HomeMealPlan/HomeMealPlan.jsx
import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";
import { getLatestSavedMealPlanForCurrentUser } from "@/lib/userApi";
import styles from "./HomeMealPlan.module.css";

const DAILY_MACROS = [
  { key: "Protein", value: "135 g" },
  { key: "Carbs", value: "210 g" },
  { key: "Fats", value: "68 g" },
];

const MEAL_PLAN = [
  {
    id: "breakfast",
    label: "Breakfast",
    title: "Sunrise Protein Oats",
    readyIn: "10 min",
    description: "Cinnamon oats, flax, almond butter, fresh berries.",
    macros: { calories: 420, protein: 32, carbs: 48, fats: 14 },
    image:
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "lunch",
    label: "Lunch",
    title: "Ginger Miso Bowl",
    readyIn: "18 min",
    description:
      "Seared salmon, sesame greens, pickled cabbage, jasmine rice.",
    macros: { calories: 560, protein: 42, carbs: 52, fats: 20 },
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "snack",
    label: "Snack",
    title: "Citrus Crunch Yogurt",
    readyIn: "5 min",
    description: "Greek yogurt, tangerine, cacao nibs, pistachio dust.",
    macros: { calories: 250, protein: 18, carbs: 22, fats: 9 },
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "dinner",
    label: "Dinner",
    title: "Chimichurri Steak & Roots",
    readyIn: "25 min",
    description:
      "Grass-fed sirloin, roasted sweet potato, charred broccolini.",
    macros: { calories: 680, protein: 45, carbs: 56, fats: 26 },
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60",
  },
];

function HomeMealPlan({ firstName = "there" }) {
  const navigate = useNavigate();
  const safeName = firstName?.trim() || "there";

  // 🔹 New state for live meal plan
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planMeals, setPlanMeals] = useState([]);

  // 🔹 Load latest saved plan on mount
  useEffect(() => {
    async function loadPlan() {
      setLoading(true);
      setError(null);

      try {
        const res = await getLatestSavedMealPlanForCurrentUser();
        console.log("▶️ Latest saved meal plan:", res);

        if (!res.ok) {
          setError(res.error || "Could not load your meal plan.");
          setPlanMeals([]);
          return;
        }

        const { meals } = res.data;
        setPlanMeals(meals || []);
      } catch (err) {
        console.error("[HomeMealPlan] loadPlan error", err);
        setError(err.message || "Unknown error while loading plan.");
        setPlanMeals([]);
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, []);

  // If we have a real saved plan, use it; otherwise fallback to static MEAL_PLAN
  const displayMeals =
    planMeals && planMeals.length > 0 ? planMeals : MEAL_PLAN;

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
        <p className={styles.greeting}>Meal plan ready</p>
        <h1 className={styles.title}>
          Here&apos;s today&apos;s MacroMunch lineup.
        </h1>
        <p className={styles.subtitle}>
          Balanced for energy, satiety, and your smart macro targets.
        </p>
      </section>

      <section className={styles.macrosCard}>
        <div className={styles.macrosHeader}>
          <p className={styles.macrosLabel}>Today&apos;s macros</p>
          <span className={styles.macrosGoal}>Target · 2050 kcal</span>
        </div>

        <div className={styles.macrosGrid}>
          {DAILY_MACROS.map((macro) => (
            <div key={macro.key} className={styles.macroBlock}>
              <span className={styles.macroLabel}>{macro.key}</span>
              <span className={styles.macroValue}>{macro.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.planSection}>
        <div className={styles.planHeader}>
          <h2 className={styles.planTitle}>Meals dialed in for you</h2>
          <p className={styles.planHint}>
            Tap any card to view details and swaps.
          </p>
        </div>

        <div className={styles.planList}>
          {loading && (
            <p className={styles.loadingText}>Loading your lineup…</p>
          )}

          {!loading && error && (
            <p className={styles.errorText}>
              We couldn&apos;t load your latest plan yet. Showing a sample day
              instead.
            </p>
          )}

          {!loading &&
            displayMeals.map((meal, index) => {
              // Normalize fields between live data and fallback static data
              const label = meal.slot || meal.label || "Meal";
              const title =
                meal.name || meal.title || "Delicious macro-friendly meal";
              const description =
                meal.description ||
                meal.mealDescription ||
                "Balanced for energy and satiety.";

              // For now, images are static/fallback — live meals reuse the first image
              const image =
                meal.image ||
                (MEAL_PLAN[0] && MEAL_PLAN[0].image) ||
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60";

              const readyIn = meal.readyIn || "— min";
              const hasMacros = !!meal.macros;

              return (
                <article key={meal.id || index} className={styles.mealCard}>
                  <div className={styles.mealMedia}>
                    <img src={image} alt={title} />
                  </div>

                  <div className={styles.mealBody}>
                    <div className={styles.mealTopRow}>
                      <span className={styles.mealLabel}>{label}</span>
                      <span className={styles.readyIn}>{readyIn}</span>
                    </div>

                    <h3 className={styles.mealName}>{title}</h3>
                    <p className={styles.mealDescription}>{description}</p>

                    {/* Macros only exist on the static fallback for now */}
                    {hasMacros && (
                      <div className={styles.mealMacros}>
                        {Object.entries(meal.macros).map(([macro, amount]) => (
                          <span
                            key={macro}
                            className={styles.mealMacroItem}
                          >
                            {macro.charAt(0).toUpperCase() + macro.slice(1)}:{" "}
                            <strong>{amount}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </section>
    </main>
  );
}

export default HomeMealPlan;