// src/pages/OnboardingPlanBuild/OnboardingPlanBuild.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import OnboardingOptionCard from "@/components/OnboardingOptionCard/OnboardingOptionCard";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import styles from "./OnboardingPlanBuild.module.css";
import { generateSmartMacrosForCurrentUser } from "@/lib/userApi";

// 🧠 Tiny helper for now: pick an example macro split based on goal
function getExampleMacros(goal) {
  switch (goal) {
    case "lose":
      return { protein: 150, carbs: 170, fat: 55 };
    case "gain":
      return { protein: 160, carbs: 240, fat: 70 };
    case "maintain":
    default:
      return { protein: 140, carbs: 210, fat: 60 };
  }
}

const PLAN_OPTIONS = [
  {
    value: "auto",
    label: "Smart macros (recommended)",
    description:
      "We’ll calculate your calories & macros using your age, height, weight, activity, and goal.",
  },
  {
    value: "manual",
    label: "I’ll enter my own macros",
    description:
      "Use macros from your coach, another app, or your own plan.",
  },
];

function OnboardingPlanBuild() {
  const navigate = useNavigate();
  const { state, setMacroMode } = useOnboarding();

  // OnboardingGoal should have set state.goal = "lose" | "maintain" | "gain"
  const goal = state.goal || "maintain";

  // Keep Smart macros pre-selected unless the user already chose
  const [selectedMode, setSelectedMode] = useState(state.macroMode || "auto");

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSmartMacros = selectedMode === "auto";

  useEffect(() => {
    // Only show preview for Smart macros
    if (!isSmartMacros) {
      setPreview(null);
      setLoadingPreview(false);
      return;
    }

    // Simulate a tiny “thinking” moment so it feels alive
    setLoadingPreview(true);
    setPreview(null);

    const timer = setTimeout(() => {
      const macros = getExampleMacros(goal);
      setPreview(macros);
      setLoadingPreview(false);
    }, 450); // ~half a second feels snappy but intentional

    return () => clearTimeout(timer);
  }, [isSmartMacros, goal]);

  function handleBack() {
    navigate(-1);
  }

  function handleSelect(mode) {
    setSelectedMode(mode);
    setMacroMode(mode);
  }

  async function handleContinue() {
    if (!selectedMode) {
      setError("Please choose how we should build your plan.");
      return;
    }

    // Manual macro flow → go to manual entry screen
    if (selectedMode === "manual") {
      setMacroMode("manual");
      navigate("/onboarding/manual-macros");
      return;
    }

    // Smart macro flow → compute + save to Supabase
    setError("");
    setSaving(true);

    const res = await generateSmartMacrosForCurrentUser();

    setSaving(false);

    if (!res.ok) {
      setError(res.error || "We couldn’t calculate your macros. Please try again.");
      return;
    }

    setMacroMode("auto");
    navigate("/onboarding/diet");
  }

  return (
    <main className={styles.screen}>
      <OnboardingHeader currentStep={2} totalSteps={7} onBack={handleBack} />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>How should we build your plan?</h1>
          <p className={styles.helper}>
            Choose whether MacroMunch calculates your macros or you use numbers
            from a coach or other app.
          </p>
        </div>

        <div className={styles.options}>
          {PLAN_OPTIONS.map((option) => (
            <OnboardingOptionCard
              key={option.value}
              label={option.label}
              description={option.description}
              alignLeft
              selected={selectedMode === option.value}
              onClick={() => handleSelect(option.value)}
            />
          ))}
        </div>

        {isSmartMacros && (
          <div className={styles.preview}>
            <p className={styles.previewLabel}>
              {loadingPreview
                ? "Calculating example plan…"
                : "Example plan preview"}
            </p>

            {loadingPreview ? (
              // simple skeleton; you can make this fancy in CSS
              <div className={styles.previewSkeleton}>
                <div className={styles.previewSkeletonBar} />
              </div>
            ) : (
              preview && (
                <div className={styles.previewValues}>
                  <div className={styles.previewValue}>
                    <span className={styles.amount}>{preview.protein}g</span>
                    <span className={styles.unit}>protein</span>
                  </div>
                  <div className={styles.previewValue}>
                    <span className={styles.amount}>{preview.carbs}g</span>
                    <span className={styles.unit}>carbs</span>
                  </div>
                  <div className={styles.previewValue}>
                    <span className={styles.amount}>{preview.fat}g</span>
                    <span className={styles.unit}>fats</span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <div className={styles.footer}>
        <PrimaryButton
          label={saving ? "Setting up your plan…" : "Continue"}
          onClick={handleContinue}
          disabled={saving}
        />
        {error && (
          <p className={`caption ${styles.error}`}>{error}</p>
        )}
      </div>
    </main>
  );
}

export default OnboardingPlanBuild;