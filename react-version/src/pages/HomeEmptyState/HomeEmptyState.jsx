// src/pages/HomeEmptyState/HomeEmptyState.jsx
import { useNavigate } from "react-router-dom";
import styles from "./HomeEmptyState.module.css";

import AppHeader from "@/components/AppHeader/AppHeader";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";

function HomeEmptyState({ firstName = "there" }) {
  const navigate = useNavigate();
  const safeName = firstName?.trim() || "there";

  function handleGenerate() {
    // Kick off onboarding flow (Step 1: Goal)
    navigate("/onboarding/goal");
  }

  return (
    <main className={styles.screen}>
      <AppHeader
        firstName={safeName}
        onProfileClick={() => navigate("/profile")}
        onNotificationsClick={() => {
          // You can wire this up later when you have notifications
          alert("Notifications coming soon");
        }}
      />

      <section className={styles.content}>
        <div className={styles.plateWrapper}>
          <div className={styles.plateOuter}>
            <div className={styles.plateInner}>
              <div className={styles.plateAccentTop} />
              <div className={styles.plateAccentBottom} />
            </div>
          </div>
        </div>

        <h1 className={styles.title}>
          Hi, {safeName}, you haven&apos;t created a meal plan yet!
        </h1>

        <p className={`body-text ${styles.subtitle}`}>
          Tap below to create your first MacroMunch meal plan tailored to your goals.
        </p>

        <div className={styles.actions}>
          <PrimaryButton
            type="button"
            label="Create my meal plan"
            onClick={handleGenerate}
          />
        </div>
      </section>
    </main>
  );
}

export default HomeEmptyState;
