// src/pages/OnboardingManualMacros/OnboardingManualMacros.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import styles from "./OnboardingManualMacros.module.css";

function OnboardingManualMacros() {
  const navigate = useNavigate();
  const { state, setManualMacros, setMacroMode } = useOnboarding();

  const [protein, setProtein] = useState(state.manualMacros.protein || "");
  const [carbs, setCarbs] = useState(state.manualMacros.carbs || "");
  const [fats, setFats] = useState(state.manualMacros.fats || "");

  function handleBack() {
    navigate(-1);
  }

  function handleContinue() {
    setManualMacros({ protein, carbs, fats });
    setMacroMode("manual");
    navigate("/onboarding/diet");
  }

  const disableButton = !protein || !carbs || !fats;

  return (
    <main className={styles.screen}>
      <OnboardingHeader currentStep={1} totalSteps={6} onBack={handleBack} />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>Enter your macros</h1>
          <p className={styles.helper}>
            Plug in the grams you already follow. You can tweak them later.
          </p>
        </div>

        <form className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Protein (g)</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Carbs (g)</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fats (g)</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={fats}
              onChange={(e) => setFats(e.target.value)}
              placeholder="0"
            />
          </label>
        </form>
      </section>

      <div className={styles.footer}>
        <PrimaryButton
          label="Continue"
          onClick={handleContinue}
          disabled={disableButton}
        />
      </div>
    </main>
  );
}

export default OnboardingManualMacros;
