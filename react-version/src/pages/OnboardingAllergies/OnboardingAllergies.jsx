// src/pages/OnboardingAllergies/OnboardingAllergies.jsx
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import OnboardingOptionCard from "@/components/OnboardingOptionCard/OnboardingOptionCard";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import shellfishBg from "@/assets/onboarding/allergies/shellfish.webp";
import peanutsBg from "@/assets/onboarding/allergies/peanuts.webp";
import treenutsBg from "@/assets/onboarding/allergies/treenuts.webp";
import lactoseBg from "@/assets/onboarding/allergies/lactose.webp";
import glutenBg from "@/assets/onboarding/allergies/gluten.webp";
import eggsBg from "@/assets/onboarding/allergies/eggs.webp";
import fishBg from "@/assets/onboarding/allergies/fish.webp";
import soyBg from "@/assets/onboarding/allergies/soy.webp";
import styles from "./OnboardingAllergies.module.css";

const ALLERGY_OPTIONS = [
  {
    value: "shellfish",
    label: "Shellfish",
    backgroundImage: shellfishBg,
  },
  {
    value: "peanuts",
    label: "Peanuts",
    backgroundImage: peanutsBg,
  },
  {
    value: "treenuts",
    label: "Tree Nuts",
    backgroundImage: treenutsBg,
  },
  {
    value: "lactose",
    label: "Lactose",
    backgroundImage: lactoseBg,
  },
  {
    value: "gluten",
    label: "Gluten",
    backgroundImage: glutenBg,
  },
  {
    value: "eggs",
    label: "Eggs",
    backgroundImage: eggsBg,
  },
  {
    value: "fish",
    label: "Fish",
    backgroundImage: fishBg,
  },
  {
    value: "soy",
    label: "Soy",
    backgroundImage: soyBg,
  },
];

function OnboardingAllergies() {
  const navigate = useNavigate();
  const { state, setAllergies } = useOnboarding();

  const selected = state.allergies || [];

  function handleBack() {
    navigate(-1);
  }

  function toggleAllergy(value) {
    if (selected.includes(value)) {
      setAllergies(selected.filter((item) => item !== value));
    } else {
      setAllergies([...selected, value]);
    }
  }

  function goNext() {
    navigate("/onboarding/styles");
  }

  function handleSkip() {
    setAllergies([]);
    goNext();
  }

  function handleContinue() {
    goNext();
  }

  return (
    <main className={styles.screen}>
      <OnboardingHeader currentStep={4} totalSteps={7} onBack={handleBack} />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>Any allergies we should note?</h1>
          <p className={styles.helper}>
            Pick everything that&apos;s off-limits (optional).
          </p>
        </div>

        <div className={styles.optionsGrid}>
          {ALLERGY_OPTIONS.map((option) => (
            <OnboardingOptionCard
              key={option.value}
              label={option.label}
              backgroundImage={option.backgroundImage}
              selected={selected.includes(option.value)}
              onClick={() => toggleAllergy(option.value)}
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

export default OnboardingAllergies;
