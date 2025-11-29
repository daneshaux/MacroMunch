// src/pages/OnboardingEatingStyles/OnboardingEatingStyles.jsx
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import OnboardingOptionCard from "@/components/OnboardingOptionCard/OnboardingOptionCard";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import americanBg from "@/assets/onboarding/eatingStyles/american.webp";
import asianBg from "@/assets/onboarding/eatingStyles/asian.webp";
import halalBg from "@/assets/onboarding/eatingStyles/halal.webp";
import indianBg from "@/assets/onboarding/eatingStyles/indian.webp";
import islandBg from "@/assets/onboarding/eatingStyles/island.webp";
import italianBg from "@/assets/onboarding/eatingStyles/italian.webp";
import koreanBg from "@/assets/onboarding/eatingStyles/korean.webp";
import kosherBg from "@/assets/onboarding/eatingStyles/kosher.webp";
import latinBg from "@/assets/onboarding/eatingStyles/latin.webp";
import soulBg from "@/assets/onboarding/eatingStyles/soul.webp";
import styles from "./OnboardingEatingStyles.module.css";

const EATING_STYLE_OPTIONS = [
  {
    value: "halal",
    label: "Halal",
    backgroundImage: halalBg,
  },
  {
    value: "kosher",
    label: "Kosher",
    backgroundImage: kosherBg,
  },
  {
    value: "asian-inspired",
    label: "Asian-Inspired",
    backgroundImage: asianBg,
  },
  {
    value: "latin-american",
    label: "Latin-American",
    backgroundImage: latinBg,
  },
  {
    value: "italian",
    label: "Italian",
    backgroundImage: italianBg,
  },
  {
    value: "soul-food",
    label: "Soul Food",
    backgroundImage: soulBg,
  },
  {
    value: "indian",
    label: "Indian",
    backgroundImage: indianBg,
  },
  {
    value: "american",
    label: "American",
    backgroundImage: americanBg,
  },
  {
    value: "korean",
    label: "Korean",
    backgroundImage: koreanBg,
  },
  {
    value: "island-inspired",
    label: "Island-Inspired",
    backgroundImage: islandBg,
  },
];

function OnboardingEatingStyles() {
  const navigate = useNavigate();
  const { state, setEatingStyles } = useOnboarding();

  const selected = state.eatingStyles || [];

  function handleBack() {
    navigate(-1);
  }

  function toggleStyle(value) {
    if (selected.includes(value)) {
      setEatingStyles(selected.filter((item) => item !== value));
    } else {
      setEatingStyles([...selected, value]);
    }
  }

  function goNext() {
    navigate("/onboarding/spice");
  }

  function handleSkip() {
    setEatingStyles([]);
    goNext();
  }

  function handleContinue() {
    goNext();
  }

  return (
    <main className={styles.screen}>
      <OnboardingHeader currentStep={4} totalSteps={6} onBack={handleBack} />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>What eating styles inspire you?</h1>
          <p className={styles.helper}>Pick all that fit your vibe.</p>
        </div>

        <div className={styles.optionsGrid}>
          {EATING_STYLE_OPTIONS.map((option) => (
            <OnboardingOptionCard
              key={option.value}
              label={option.label}
              backgroundImage={option.backgroundImage}
              selected={selected.includes(option.value)}
              onClick={() => toggleStyle(option.value)}
            />
          ))}
        </div>
      </section>

      <div className={styles.footer}>
        <PrimaryButton label="Continue" onClick={handleContinue} />
        <button type="button" className={styles.skipButton} onClick={handleSkip}>
          Skip for now
        </button>
      </div>
    </main>
  );
}

export default OnboardingEatingStyles;
