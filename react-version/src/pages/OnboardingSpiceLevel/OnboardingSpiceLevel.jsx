// src/pages/OnboardingSpiceLevel/OnboardingSpiceLevel.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import styles from "./OnboardingSpiceLevel.module.css";

const SPICE_MARKS = [
  { value: 0, label: "Mild" },
  { value: 50, label: "Medium" },
  { value: 100, label: "Spicy" },
];

function clamp(value) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function OnboardingSpiceLevel() {
  const navigate = useNavigate();
  const { state, setSpiceLevel } = useOnboarding();

  const sliderValue = clamp(state.spiceLevel ?? 50);

  function handleBack() {
    navigate(-1);
  }

  function handleSkip() {
    setSpiceLevel(null);
    goNext();
  }

  function goNext() {
    navigate("/onboarding/flavors");
  }

  function handleChange(event) {
    const nextValue = clamp(Number(event.target.value));
    setSpiceLevel(nextValue);
  }

  const positionLabel = useMemo(() => {
    if (sliderValue <= 25) return "Mild";
    if (sliderValue >= 75) return "Spicy";
    return "Medium";
  }, [sliderValue]);

  return (
    <main className={styles.screen}>
      <OnboardingHeader currentStep={6} totalSteps={7} onBack={handleBack} />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>How spicy should we keep it?</h1>
          <p className={styles.helper}>
            Slide to set your heat preference. We’ll tune recipes accordingly.
          </p>
        </div>

        <div className={styles.sliderCard}>
          <div className={styles.scaleHeader}>
            <span className={styles.scaleLabel}>Preferred spice level</span>
            <span className={styles.activeLabel}>{positionLabel}</span>
          </div>

          <div className={styles.sliderWrapper}>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderValue}
              onChange={handleChange}
              className={styles.slider}
            />

            <div className={styles.marks}>
              {SPICE_MARKS.map((mark) => (
                <div
                  key={mark.value}
                  className={`${styles.mark} ${
                    sliderValue >= mark.value ? styles.markActive : ""
                  }`}
                  style={{ left: `${mark.value}%` }}
                >
                  <span className={styles.markDot} />
                  <span className={styles.markLabel}>{mark.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.footer}>
        <PrimaryButton label="Continue" onClick={goNext} />
        <button type="button" className={styles.skipButton} onClick={handleSkip}>
          Skip for now
        </button>
      </div>
    </main>
  );
}

export default OnboardingSpiceLevel;
