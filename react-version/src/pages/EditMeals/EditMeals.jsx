// src/pages/EditMeals/EditMeals.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./EditMeals.module.css";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { updateMealsPerDay, getCurrentUserProfile } from "@/lib/userApi";

function EditMealsPage() {
  const navigate = useNavigate();

  const [currentMeals, setCurrentMeals] = useState(3);
  const [meals, setMeals] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Load current profile so we can show real value
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      const res = await getCurrentUserProfile();
      if (!isMounted) return;

      if (res.ok && res.data) {
        const user = res.data;
        // API returns "mealsperday" in the response example
        const apiMeals = user.mealsperday ?? user.mealsPerDay ?? 3;
        setCurrentMeals(apiMeals);
        setMeals(apiMeals);
      } else {
        // fallback to 3 if we can't fetch
        setCurrentMeals(3);
        setMeals(3);
        if (res.error) {
          console.warn("Could not load profile:", res.error);
        }
      }
      setLoading(false);
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave() {
    if (meals === currentMeals) {
      navigate(-1);
      return;
    }

    setSaving(true);
    setError("");

    const res = await updateMealsPerDay(meals);

    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Could not update meals per day.");
      return;
    }

    // You could show a toast here if you want
    navigate("/profile");
  }

  function handleCancel() {
    navigate(-1);
  }

  const options = [2, 3, 4, 5];

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
            <h1 className="h1">Meals per day</h1>
            <p className={`caption ${styles.subtitle}`}>
                Choose how many meals you prefer each day. You can change this any time.
            </p>
        </header>

      <section className={styles.content}>
        {loading ? (
          <p className="caption">Loading your preferences…</p>
        ) : (
          <>
            <div className={styles.options}>
              {options.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.option} ${
                    meals === n ? styles.selected : ""
                  }`}
                  onClick={() => setMeals(n)}
                >
                  <span className="h4">{n} meals</span>
                  <span className="caption">
                    {n === 2 && "Bigger meals, fewer times"}
                    {n === 3 && "Breakfast, lunch, dinner"}
                    {n === 4 && "Plus an extra snack"}
                    {n === 5 && "Smaller meals, more often"}
                  </span>
                </button>
              ))}
            </div>

            {error && <p className={`caption ${styles.error}`}>{error}</p>}

            <div className={styles.actions}>
              <PrimaryButton
                type="button"
                label={saving ? "Saving…" : "Save changes"}
                disabled={saving || loading || meals === currentMeals}
                onClick={handleSave}
              />
              <button
                type="button"
                className={`${styles.cancel} body-text`}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default EditMealsPage;