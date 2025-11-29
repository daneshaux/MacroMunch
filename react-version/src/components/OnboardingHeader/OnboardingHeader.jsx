// src/components/OnboardingHeader/OnboardingHeader.jsx
import { FiChevronLeft } from "react-icons/fi";
import styles from "./OnboardingHeader.module.css";

function OnboardingHeader({
  currentStep,
  totalSteps,
  onBack,
  title, // optional, you picked "no title" but we keep this in case
}) {
  const stepLabel = `Step ${currentStep} of ${totalSteps}`;

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label="Go back"
        >
          <FiChevronLeft className={styles.backIcon} />
        </button>

        {title && (
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>{title}</h1>
          </div>
        )}

        {/* spacer to keep layout balanced */}
        <div className={styles.rightSpacer} />
      </div>

      <div className={styles.progressWrapper}>
        <div className={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            let className = styles.segment;
            if (isCompleted) className += ` ${styles.segmentCompleted}`;
            if (isCurrent) className += ` ${styles.segmentCurrent}`;

            return <div key={stepNumber} className={className} />;
          })}
        </div>
        <p className={styles.stepLabel}>{stepLabel}</p>
      </div>
    </header>
  );
}

export default OnboardingHeader;