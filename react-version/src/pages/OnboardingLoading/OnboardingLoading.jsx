// src/pages/OnboardingLoading/OnboardingLoading.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import { updateDietSettings, markOnboardingComplete, generateMealPlanForCurrentUser } from "@/lib/userApi";
import styles from "./OnboardingLoading.module.css";

const MIN_ANIMATION_MS = 2600;

function OnboardingLoading() {
  const navigate = useNavigate();
  const { state, setPlanReady } = useOnboarding();
  const [error, setError] = useState("");

  const didNavigateRef = useRef(false);
  const latestRunIdRef = useRef(0);

   const payloadRef = useRef(null);
    if (!payloadRef.current) {
      payloadRef.current = {
        dietaryPreferences: state.dietaryPreferences,
        allergies: state.allergies,
        eatingStyles: state.eatingStyles,
        spiceLevel: state.spiceLevel,
        numericSpice: state.spiceLevel,
        flavorProfiles: state.flavorProfiles || [],
      };
    }

  useEffect(() => {
    let cancelled = false;
    const runId = ++latestRunIdRef.current;

    const run = async () => {
      const startedAt = Date.now();

      try {
        console.log("[OnboardingLoading] ✅ run START", { runId });

        // 1) Save diet settings first (if that's part of onboarding)
        const dietRes = await updateDietSettings(payloadRef.current);
        console.log("[OnboardingLoading] updateDietSettings result", { runId, dietRes });

        if (!dietRes?.ok) {
          throw new Error(dietRes?.error || "Failed to save diet settings.");
        }

        // 2) Generate plan
        const genRes = await generateMealPlanForCurrentUser();
        console.log("[OnboardingLoading] generateMealPlan result", { runId, genRes });

        if (!genRes?.ok) {
          throw new Error(genRes?.error || "Failed to generate meal plan.");
        }

        // 3) Mark onboarding complete
        const completeRes = await markOnboardingComplete();
        console.log("[OnboardingLoading] markOnboardingComplete result", { runId, completeRes });

        if (!completeRes?.ok) {
          throw new Error(completeRes?.error || "Failed to mark onboarding complete.");
        }

        // 4) Ensure the animation shows for at least MIN_ANIMATION_MS
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_ANIMATION_MS - elapsed);
        console.log("[OnboardingLoading] elapsed/remaining", { runId, elapsed, remaining });
        if (remaining > 0) {
          await new Promise((r) => setTimeout(r, remaining));
        }

        // ✅ Guards RIGHT BEFORE redirect
        if (cancelled) {
          console.log("[OnboardingLoading] cancelled — skipping redirect", { runId });
          return;
        }
        if (runId !== latestRunIdRef.current) {
          console.log("[OnboardingLoading] stale run — skipping redirect", { runId });
          return;
        }
        if (didNavigateRef.current) {
          console.log("[OnboardingLoading] already navigated — skipping", { runId });
          return;
        }

        didNavigateRef.current = true;

        // optional: mark plan ready in context if you use it
        setPlanReady?.(true);

        console.log("[OnboardingLoading] ✅ redirecting to /home", { runId });
        navigate("/home", { replace: true });
      } catch (err) {
        console.error("[OnboardingLoading] run error", err);
        setError(err?.message || "Something went wrong. Please try again.");
      } finally {
        console.log("[OnboardingLoading] ✅ run FINALLY", { runId });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate, setPlanReady]);

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
          We're portioning this just for you — dialing in macros, meals, and the perfect vibe.
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