// src/pages/OnboardingGoal/OnboardingGoal.jsx
import { useNavigate } from "react-router-dom";
import OnboardingHeader from "@/components/OnboardingHeader/OnboardingHeader";
import OnboardingGoalCard from "@/components/OnboardingGoalCard/OnboardingGoalCard";
import { useOnboarding } from "@/context/OnboardingContext";
import styles from "./OnboardingGoal.module.css";
import loseIcon from "@/assets/onboarding/goal-lose-icon.svg";
import maintainIcon from "@/assets/onboarding/goal-maintain-icon.svg";
import gainIcon from "@/assets/onboarding/goal-gain-icon.svg";
import loseBg from "@/assets/onboarding/goal-lose-bg.svg";
import maintainBg from "@/assets/onboarding/goal-maintain-bg.svg";
import gainBg from "@/assets/onboarding/goal-gain-bg.svg";

const GOAL_OPTIONS = [
  {
    value: "lose",
    label: "Lose Weight",
    description: "Dial in a calorie deficit to burn fat.",
    iconSrc: loseIcon,
    backgroundImage: loseBg,
  },
  {
    value: "maintain",
    label: "Maintain Weight",
    description: "Stay steady while keeping energy high.",
    iconSrc: maintainIcon,
    backgroundImage: maintainBg,
  },
  {
    value: "gain",
    label: "Gain Weight",
    description: "Add lean muscle with a smart surplus.",
    iconSrc: gainIcon,
    backgroundImage: gainBg,
  },
];

function OnboardingGoal() {
  const navigate = useNavigate();
  const { state, setGoal, setMacroMode, resetOnboarding } = useOnboarding();

  function handleBack() {
    // Back from step 1 → cancel onboarding and return home
    resetOnboarding();
    navigate("/home");
  }

  function handleSelectGoal(value) {
    setMacroMode("auto");
    setGoal(value);
    // Auto-advance to dietary preferences with slight pause for feedback
    setTimeout(() => {
      navigate("/onboarding/diet");
    }, 400);
  }

  function handleManualMacros() {
    setMacroMode("manual");
    // Navigate to manual macros flow (you can change this route later)
    navigate("/onboarding/manual-macros");
  }

  return (
    <main className={styles.screen}>
      <OnboardingHeader
        currentStep={1}
        totalSteps={6}
        onBack={handleBack}
        // title={null} // you picked no title; we just omit it
      />

      <section className={styles.content}>
        <div className={styles.questionBlock}>
          <h1 className={styles.question}>What’s your goal?</h1>
          <p className={styles.helper}>
            We’ll build your MacroMunch plan around where you’re headed right
            now.
          </p>
        </div>

        <div className={styles.options}>
          {GOAL_OPTIONS.map((opt) => (
            <OnboardingGoalCard
              key={opt.value}
              label={opt.label}
              description={opt.description}
              iconSrc={opt.iconSrc}
              backgroundImage={opt.backgroundImage}
              selected={state.goal === opt.value}
              onClick={() => handleSelectGoal(opt.value)}
            />
          ))}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.manualLink}
            onClick={handleManualMacros}
          >
            Manually enter my macros
          </button>
        </div>
      </section>
    </main>
  );
}

export default OnboardingGoal;
