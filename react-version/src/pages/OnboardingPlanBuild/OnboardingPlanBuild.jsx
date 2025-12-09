// src/pages/OnboardingPlanBuild/OnboardingPlanBuild.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import OnboardingOptionCard from "@/components/OnboardingOptionCard/OnboardingOptionCard";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import styles from "./OnboardingPlanBuild.module.css";

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
  const [selectedMode, setSelectedMode] = useState(state.macroMode || "auto");

  function handleBack() {
    navigate(-1);
  }

  function handleSelect(mode) {
    setSelectedMode(mode);
    setMacroMode(mode);
  }

  function handleContinue() {
    if (selectedMode === "manual") {
      navigate("/onboarding/manual-macros");
      return;
    }

    navigate("/onboarding/diet");
  }

  const isSmartMacros = selectedMode === "auto";

  return (
    <main className={styles.screen}>
      <OnboardingHeader
        currentStep={2}
        totalSteps={7}
        onBack={handleBack}
      />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>How should we build your plan?</h1>
          <p className={styles.helper}>
            Choose whether MacroMunch calculates your macros or you use numbers from a coach or other app.
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
            <p className={styles.previewLabel}>Example plan preview</p>
            <div className={styles.previewValues}>
              <div className={styles.previewValue}>
                <span className={styles.amount}>140g</span>
                <span className={styles.unit}>protein</span>
              </div>
              <div className={styles.previewValue}>
                <span className={styles.amount}>210g</span>
                <span className={styles.unit}>carbs</span>
              </div>
              <div className={styles.previewValue}>
                <span className={styles.amount}>60g</span>
                <span className={styles.unit}>fats</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className={styles.footer}>
        <PrimaryButton label="Continue" onClick={handleContinue} />
      </div>
    </main>
  );
}

export default OnboardingPlanBuild;
