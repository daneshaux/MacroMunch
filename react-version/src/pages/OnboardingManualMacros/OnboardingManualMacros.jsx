// src/pages/OnboardingManualMacros/OnboardingManualMacros.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { updateMacroSettings } from "@/lib/userApi";
import styles from "./OnboardingManualMacros.module.css";

function OnboardingManualMacros() {
  const navigate = useNavigate();
  const { state, setManualMacros, setMacroMode, setPlanReady } = useOnboarding();

  const [protein, setProtein] = useState(state.manualMacros.protein || "");
  const [carbs, setCarbs] = useState(state.manualMacros.carbs || "");
  const [fats, setFats] = useState(state.manualMacros.fats || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleBack() {
    navigate(-1);
  }

  function parseMacro(value) {
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0) return null;
    return Math.round(n);
  }

  async function handleContinue() {
    setError("");

    const p = parseMacro(protein);
    const c = parseMacro(carbs);
    const f = parseMacro(fats);

    if (p == null || c == null || f == null) {
      setError("Please enter valid grams for protein, carbs, and fats.");
      return;
    }

    const goal = state.goal || "maintain";

    setSaving(true);

    const res = await updateMacroSettings({
      macroMode: "manual",
      goal,
      proteinG: p,
      carbsG: c,
      fatG: f,
    });

    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Could not save your macros. Please try again.");
      return;
    }

    // Keep onboarding context in sync
    setManualMacros({
      protein: String(p),
      carbs: String(c),
      fats: String(f),
    });
    setMacroMode("manual");
    setPlanReady(true);

    navigate("/onboarding/diet");
  }

  const disableButton = !protein || !carbs || !fats || saving;

  return (
    <main className={styles.screen}>
      <OnboardingHeader currentStep={3} totalSteps={7} onBack={handleBack} />

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

          {error && (
            <p className={`caption ${styles.error}`}>{error}</p>
          )}
        </form>
      </section>

      <div className={styles.footer}>
        <PrimaryButton
          label={saving ? "Saving…" : "Continue"}
          onClick={handleContinue}
          disabled={disableButton}
        />
      </div>
    </main>
  );
}

export default OnboardingManualMacros;
