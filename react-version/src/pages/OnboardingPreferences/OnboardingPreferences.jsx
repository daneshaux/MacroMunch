// src/pages/OnboardingPreferences/OnboardingPreferences.jsx
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import OnboardingOptionCard from "@/components/OnboardingOptionCard/OnboardingOptionCard";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import vegetarianBg from "@/assets/onboarding/preferences/vegetarian.webp";
import veganBg from "@/assets/onboarding/preferences/vegan.webp";
import pescatarianBg from "@/assets/onboarding/preferences/pescatarian.webp";
import pescaveganBg from "@/assets/onboarding/preferences/pescavegan.webp";
import ketoBg from "@/assets/onboarding/preferences/keto.webp";
import plantbasedBg from "@/assets/onboarding/preferences/plantbased.webp";
import paleoBg from "@/assets/onboarding/preferences/paleo.webp";
import mediterraneanBg from "@/assets/onboarding/preferences/mediterranean.webp";
import glutenfreeBg from "@/assets/onboarding/preferences/glutenfree.webp";
import dairyfreeBg from "@/assets/onboarding/preferences/dairyfree.webp";
import styles from "./OnboardingPreferences.module.css";

const DIET_OPTIONS = [
  {
    value: "vegetarian",
    label: "Vegetarian",
    backgroundImage: vegetarianBg,
  },
  {
    value: "vegan",
    label: "Vegan",
    backgroundImage: veganBg,
  },
  {
    value: "pescatarian",
    label: "Pescatarian",
    backgroundImage: pescatarianBg,
  },
  {
    value: "pescavegan",
    label: "Pescavegan",
    backgroundImage: pescaveganBg,
  },
  {
    value: "keto",
    label: "Keto",
    backgroundImage: ketoBg,
  },
  {
    value: "plant-based-ish",
    label: "Plant-Based-ish",
    backgroundImage: plantbasedBg,
  },
  {
    value: "paleo",
    label: "Paleo",
    backgroundImage: paleoBg,
  },
  {
    value: "mediterranean",
    label: "Mediterranean",
    backgroundImage: mediterraneanBg,
  },
  {
    value: "gluten-free",
    label: "Gluten-Free",
    backgroundImage: glutenfreeBg,
  },
  {
    value: "dairy-free",
    label: "Dairy-Free",
    backgroundImage: dairyfreeBg,
  },
];

function OnboardingPreferences() {
  const navigate = useNavigate();
  const { state, setDietaryPreferences } = useOnboarding();

  const selected = state.dietaryPreferences || [];

  function handleBack() {
    navigate(-1);
  }

  function togglePreference(value) {
    if (selected.includes(value)) {
      setDietaryPreferences(selected.filter((pref) => pref !== value));
    } else {
      setDietaryPreferences([...selected, value]);
    }
  }

  function goNext() {
    navigate("/onboarding/allergies");
  }

  function handleSkip() {
    setDietaryPreferences([]);
    goNext();
  }

  function handleContinue() {
    goNext();
  }

  return (
    <main className={styles.screen}>
      <OnboardingHeader
        currentStep={3}
        totalSteps={7}
        onBack={handleBack}
      />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>Any dietary preferences?</h1>
          <p className={styles.helper}>Select as many as you like (optional).</p>
        </div>

        <div className={styles.optionsGrid}>
          {DIET_OPTIONS.map((option) => (
            <OnboardingOptionCard
              key={option.value}
              label={option.label}
              backgroundImage={option.backgroundImage}
              selected={selected.includes(option.value)}
              onClick={() => togglePreference(option.value)}
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

export default OnboardingPreferences;
