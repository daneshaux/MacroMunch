// src/pages/EditWeight/EditWeight.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./EditWeight.module.css";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";

const MIN_WEIGHT = 60;
const MAX_WEIGHT = 400;

function clampWeight(value) {
  if (Number.isNaN(value)) return MIN_WEIGHT;
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, value));
}

function EditWeight() {
  const navigate = useNavigate();

  // In the future this will come from the real profile
  const initialWeight = 165;

  const [weight, setWeight] = useState(initialWeight);
  const [inputWeight, setInputWeight] = useState(String(initialWeight));
  const [saving, setSaving] = useState(false);

  const isDirty = weight !== initialWeight;

  // Keep input in sync when weight changes from +/- buttons
  useEffect(() => {
    setInputWeight(String(weight));
  }, [weight]);

  function handleMinus() {
    setWeight((prev) => clampWeight(prev - 1));
  }

  function handlePlus() {
    setWeight((prev) => clampWeight(prev + 1));
  }

  // Let the user type freely, clamp only when they leave the field
  function handleInputChange(e) {
    setInputWeight(e.target.value);
  }

  function syncFromInput() {
    if (!inputWeight.trim()) {
      // If they delete everything, snap back to current weight
      setInputWeight(String(weight));
      return;
    }

    let next = parseFloat(inputWeight);
    next = clampWeight(Math.round(next));
    setWeight(next);
    setInputWeight(String(next));
  }

  async function handleSave() {
    if (!isDirty) {
      navigate(-1);
      return;
    }

    setSaving(true);
    // TODO: hook up to real API later
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    navigate(-1);
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Weight</h1>
        <p className="caption">
          Update your current weight. This helps keep your macros accurate.
        </p>
      </header>

      <section className={styles.content}>
        {/* Big number */}
        <div className={styles.weightDisplay}>
          <span className={styles.weightNumber}>{weight}</span>
          <span className={styles.weightUnit}>lb</span>
        </div>

        {/* +/- controls */}
        <div className={styles.adjustRow}>
          <button
            type="button"
            className={styles.adjustButton}
            onClick={handleMinus}
          >
            − 1
          </button>
          <button
            type="button"
            className={styles.adjustButton}
            onClick={handlePlus}
          >
            + 1
          </button>
        </div>

        {/* Input field */}
        <div className={styles.inputBlock}>
          <p className="body-text">Or type your weight</p>
          <input
            type="number"
            inputMode="decimal"
            className={styles.input}
            value={inputWeight}
            onChange={handleInputChange}
            onBlur={syncFromInput}
          />
          <p className="caption">
            You can always refine this later as your weight changes.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <PrimaryButton
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            label={
              isDirty
                ? saving
                  ? "Saving…"
                  : "Save changes"
                : "Saved"
            }
          />
          <button
            type="button"
            className={`${styles.cancel} body-text`}
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </section>
    </main>
  );
}

export default EditWeight;