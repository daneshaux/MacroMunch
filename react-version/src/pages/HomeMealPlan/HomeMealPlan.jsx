// src/pages/HomeMealPlan/HomeMealPlan.jsx
import AppHeader from "@/components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";
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
    image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "lunch",
    label: "Lunch",
    title: "Ginger Miso Bowl",
    readyIn: "18 min",
    description: "Seared salmon, sesame greens, pickled cabbage, jasmine rice.",
    macros: { calories: 560, protein: 42, carbs: 52, fats: 20 },
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "snack",
    label: "Snack",
    title: "Citrus Crunch Yogurt",
    readyIn: "5 min",
    description: "Greek yogurt, tangerine, cacao nibs, pistachio dust.",
    macros: { calories: 250, protein: 18, carbs: 22, fats: 9 },
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "dinner",
    label: "Dinner",
    title: "Chimichurri Steak & Roots",
    readyIn: "25 min",
    description: "Grass-fed sirloin, roasted sweet potato, charred broccolini.",
    macros: { calories: 680, protein: 45, carbs: 56, fats: 26 },
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60",
  },
];

function HomeMealPlan({ firstName = "there" }) {
  const navigate = useNavigate();
  const safeName = firstName?.trim() || "there";

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
        <h1 className={styles.title}>Here&apos;s today&apos;s MacroMunch lineup.</h1>
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
          <p className={styles.planHint}>Tap any card to view details and swaps.</p>
        </div>

        <div className={styles.planList}>
          {MEAL_PLAN.map((meal) => (
            <article key={meal.id} className={styles.mealCard}>
              <div className={styles.mealMedia}>
                <img src={meal.image} alt={meal.title} />
              </div>

              <div className={styles.mealBody}>
                <div className={styles.mealTopRow}>
                  <span className={styles.mealLabel}>{meal.label}</span>
                  <span className={styles.readyIn}>{meal.readyIn}</span>
                </div>

                <h3 className={styles.mealName}>{meal.title}</h3>
                <p className={styles.mealDescription}>{meal.description}</p>

                <div className={styles.mealMacros}>
                  {Object.entries(meal.macros).map(([macro, amount]) => (
                    <span key={macro} className={styles.mealMacroItem}>
                      {macro.charAt(0).toUpperCase() + macro.slice(1)}: <strong>{amount}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomeMealPlan;
