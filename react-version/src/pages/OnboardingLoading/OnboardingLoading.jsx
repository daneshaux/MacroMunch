// src/pages/OnboardingLoading/OnboardingLoading.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/context/OnboardingContext";
import styles from "./OnboardingLoading.module.css";

const ANIMATION_DURATION = 2600;

function OnboardingLoading() {
  const navigate = useNavigate();
  const { setPlanReady } = useOnboarding();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPlanReady(true);
      navigate("/home", { replace: true });
    }, ANIMATION_DURATION);

    return () => clearTimeout(timeout);
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
          We&apos;re portioning this just for you — dialing in macros, meals, and the
          perfect vibe.
        </p>
      </div>
    </main>
  );
}

export default OnboardingLoading;
