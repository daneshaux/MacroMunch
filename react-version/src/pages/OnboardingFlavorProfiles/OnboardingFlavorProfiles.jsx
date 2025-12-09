// src/pages/OnboardingFlavorProfiles/OnboardingFlavorProfiles.jsx
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import OnboardingOptionCard from "@/components/OnboardingOptionCard/OnboardingOptionCard";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { useOnboarding } from "@/context/OnboardingContext";
import creamyBg from "@/assets/onboarding/flavorProfiles/creamy.webp";
import savoryBg from "@/assets/onboarding/flavorProfiles/savory.webp";
import smokyBg from "@/assets/onboarding/flavorProfiles/smoky.webp";
import sweetBg from "@/assets/onboarding/flavorProfiles/sweet.webp";
import tangyBg from "@/assets/onboarding/flavorProfiles/tangy.webp";
import umamiBg from "@/assets/onboarding/flavorProfiles/umami.webp";
import spicyBg from "@/assets/onboarding/flavorProfiles/spicy.webp";
import earthyBg from "@/assets/onboarding/flavorProfiles/earthy.webp";
import styles from "./OnboardingFlavorProfiles.module.css";

const FLAVOR_OPTIONS = [
  {
    value: "sweet",
    label: "Sweet",
    backgroundImage: sweetBg,
  },
  {
    value: "savory",
    label: "Savory",
    backgroundImage: savoryBg,
  },
  {
    value: "spicy",
    label: "Spicy",
    backgroundImage: spicyBg,
  },
  {
    value: "tangy",
    label: "Tangy",
    backgroundImage: tangyBg,
  },
  {
    value: "umami",
    label: "Umami",
    backgroundImage: umamiBg,
  },
  {
    value: "smoky",
    label: "Smoky",
    backgroundImage: smokyBg,
  },
  {
    value: "creamy",
    label: "Creamy",
    backgroundImage: creamyBg,
  },
  {
    value: "earthy",
    label: "Earthy",
    backgroundImage: earthyBg,
  },
];

function OnboardingFlavorProfiles() {
  const navigate = useNavigate();
  const { state, setFlavorProfiles } = useOnboarding();

  const selected = state.flavorProfiles || [];

  function handleBack() {
    navigate(-1);
  }

  function toggleFlavor(value) {
    if (selected.includes(value)) {
      setFlavorProfiles(selected.filter((item) => item !== value));
    } else {
      setFlavorProfiles([...selected, value]);
    }
  }

  function goNext() {
    navigate("/onboarding/loading");
  }

  function handleSkip() {
    setFlavorProfiles([]);
    goNext();
  }

  function handleContinue() {
    goNext();
  }

  return (
    <main className={styles.screen}>
      <OnboardingHeader currentStep={7} totalSteps={7} onBack={handleBack} />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>What flavor profiles excite you?</h1>
          <p className={styles.helper}>Pick all the vibes that light you up.</p>
        </div>

        <div className={styles.optionsGrid}>
          {FLAVOR_OPTIONS.map((option) => (
            <OnboardingOptionCard
              key={option.value}
              label={option.label}
              backgroundImage={option.backgroundImage}
              selected={selected.includes(option.value)}
              onClick={() => toggleFlavor(option.value)}
            />
          ))}
        </div>
      </section>

      <div className={styles.footer}>
        <PrimaryButton label="Finish" onClick={handleContinue} />
        <button type="button" className={styles.skipButton} onClick={handleSkip}>
          Skip for now
        </button>
      </div>
    </main>
  );
}

export default OnboardingFlavorProfiles;
