// src/pages/HomeMealPlan/HomeMealPlan.jsx
import AppHeader from "@/components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";
import styles from "./Recipe.module.css";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useState } from "react";

const DAILY_MACROS = [
  { key: "Protein", value: "32 g" },
  { key: "Carbs", value: "420 g" },
  { key: "Fats", value: "14 g" },
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
  const safeName = firstName?.trim() || "there";

  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [spicesOpen, setSpicesOpen] = useState(false);

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
        <h1 className={styles.title}>Sunrise Protein Oats</h1>
        <p className={styles.subtitle}>
          By <span className={styles.chef}>Gordon Ramsey</span>
        </p>
      </section>

      <section className={styles.macrosCard}>
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
        <div className={styles.planList}>
          {MEAL_PLAN.map((meal) => (
            <article
              key={meal.id}
              className={styles.mealCard}
            >
              <div className={styles.mealMedia}>
                <img src={meal.image} alt={meal.title} />
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
                    {INGREDIENTS.map((item, index) => (
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
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Recipe;
