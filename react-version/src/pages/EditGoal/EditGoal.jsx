// src/pages/EditGoal/EditGoal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../EditMeals/EditMeals.module.css"; // reuse the same layout styles
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { getCurrentUserProfile, updateGoal } from "@/lib/userApi";

const GOAL_OPTIONS = [
  {
    value: "maintain",
    title: "Maintain weight",
    subtitle: "Keep things steady while hitting your macros",
  },
  {
    value: "lose",
    title: "Lose body fat",
    subtitle: "Gentle calorie deficit with high-protein meals",
  },
  {
    value: "gain",
    title: "Build muscle & strength",
    subtitle: "Slight surplus to support muscle growth",
  },
];

function EditGoalPage() {
  const navigate = useNavigate();

  const [currentGoal, setCurrentGoal] = useState("maintain");
  const [goal, setGoal] = useState("maintain");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load current profile so we can show the real goal
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      const res = await getCurrentUserProfile();
      if (!isMounted) return;

      if (res.ok && res.data) {
        const user = res.data;
        const apiGoal = user.goal || "maintain";
        setCurrentGoal(apiGoal);
        setGoal(apiGoal);
      } else {
        // fallback if we can't fetch
        setCurrentGoal("maintain");
        setGoal("maintain");
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
    // nothing changed → just go back
    if (goal === currentGoal) {
      navigate(-1);
      return;
    }

    setSaving(true);
    setError("");

    const res = await updateGoal(goal);

    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Could not update goal.");
      return;
    }

    // success → back to Profile
    navigate("/profile");
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        {/* You already removed the tiny back link on Meals; same layout here */}
        <h1 className="h1">Goal</h1>
        <p className="caption">
          Choose your current focus. This helps us shape your macros.
        </p>
      </header>

      <section className={styles.content}>
        {loading ? (
          <p className="caption">Loading your profile…</p>
        ) : (
          <>
            <div className={styles.options}>
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.option} ${
                    goal === opt.value ? styles.selected : ""
                  }`}
                  onClick={() => setGoal(opt.value)}
                >
                  <span className="h4">{opt.title}</span>
                  <span className="caption">{opt.subtitle}</span>
                </button>
              ))}
            </div>

            {error && <p className={`caption ${styles.error}`}>{error}</p>}

            <div className={styles.actions}>
              <PrimaryButton
                type="button"
                label={saving ? "Saving…" : "Save changes"}
                disabled={saving || loading || goal === currentGoal}
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

export default EditGoalPage;