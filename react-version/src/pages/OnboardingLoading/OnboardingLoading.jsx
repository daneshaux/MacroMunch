// src/pages/OnboardingLoading/OnboardingLoading.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import {
  updateDietSettings,
  markOnboardingComplete,
  generateMealPlanForCurrentUser,
} from "@/lib/userApi";
import styles from "./OnboardingLoading.module.css";

const MIN_ANIMATION_MS = 2600;

function OnboardingLoading() {
  const navigate = useNavigate();
  const { state, setPlanReady } = useOnboarding();

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const start = Date.now();
      setError("");

      try {
        // 1) Build payload from onboarding state
        const payload = {
          dietaryPreferences: state.dietaryPreferences,
          allergies: state.allergies,
          eatingStyles: state.eatingStyles,
          spiceLevel: state.spiceLevel,
          numericSpice: state.spiceLevel,
          flavorProfiles: state.flavorProfiles || [],
        };

        // 2) Save diet settings
        const dietRes = await updateDietSettings(payload);
        if (!dietRes.ok) throw new Error(dietRes.error || "Failed to save diet settings.");

        // 3) Generate + save plan (this should clear plan_stale inside it)
        const planRes = await generateMealPlanForCurrentUser();
        if (!planRes.ok) throw new Error(planRes.error || "Failed to generate meal plan.");

        // 4) Mark onboarding complete
        const completeRes = await markOnboardingComplete();
        if (!completeRes.ok) {
          // non-fatal, but log it
          console.warn("[OnboardingLoading] markOnboardingComplete failed:", completeRes.error);
        }

        // 5) Ensure animation is visible long enough
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_ANIMATION_MS - elapsed);
        if (remaining) await new Promise((r) => setTimeout(r, remaining));

        if (cancelled) return;

        setPlanReady(true);
        navigate("/meal-plan", { replace: true }); // or "/home" if that's your plan screen
      } catch (e) {
        console.error("[OnboardingLoading] error", e);
        if (cancelled) return;

        setError(e?.message || "Something went wrong.");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate, setPlanReady, state]);

  return (
    <main className={styles.screen}>
      <div className={styles.animationWrapper}>
        <div className={styles.pulse} />
        <div className={styles.ring} />
        <div className={styles.icon}>🍽️</div>
      </div>

      <div className={styles.textBlock}>
        <p className={styles.lede}>Hold tight!</p>
        <p className={styles.helper}>
          We&apos;re portioning this just for you — dialing in macros, meals, and the perfect vibe.
        </p>

        {error && (
          <>
            <p className={styles.errorText}>{error}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default OnboardingLoading;