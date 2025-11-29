// src/pages/EditAge/EditAge.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./EditAge.module.css";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";

const MIN_AGE = 13;
const MAX_AGE = 100;

function EditAgePage() {
  const navigate = useNavigate();

  // TODO: replace with real profile value later
  const initialAge = 29;

  const [age, setAge] = useState(initialAge);
  const [inputAge, setInputAge] = useState(String(initialAge));
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  function clampAge(n) {
    if (Number.isNaN(n)) return initialAge;
    if (n < MIN_AGE) return MIN_AGE;
    if (n > MAX_AGE) return MAX_AGE;
    return n;
  }

  function syncFromInput() {
    const raw = inputAge.trim();
    const n = Number(raw);
    const clamped = clampAge(n);

    setAge(clamped);
    setInputAge(String(clamped));
  }

  function handleInputChange(e) {
    setInputAge(e.target.value);
    setIsDirty(true);
  }

  function handleMinus() {
    setIsDirty(true);
    setAge((prev) => {
      const next = clampAge(prev - 1);
      setInputAge(String(next));
      return next;
    });
  }

  function handlePlus() {
    setIsDirty(true);
    setAge((prev) => {
      const next = clampAge(prev + 1);
      setInputAge(String(next));
      return next;
    });
  }

  function handleCancel() {
    navigate(-1);
  }

  async function handleSave() {
    // later: call updateAge API here
    setSaving(true);

    // fake tiny delay so the “Saved” state feels real
    await new Promise((r) => setTimeout(r, 400));

    setSaving(false);
    setIsDirty(false);
    navigate(-1);
  }

  const primaryLabel =
    saving ? "Saving…" : isDirty ? "Save changes" : "Saved";

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Age</h1>
        <p className="body-text">
          Update your age so your macros stay accurate over time.
        </p>
      </header>

      <section className={styles.content}>
        {/* Big number */}
        <div className={styles.ageDisplay}>
          <span className={styles.ageNumber}>{age}</span>
          <span className={styles.ageUnit}>years</span>
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
          <p className="body-text">Or type your age</p>
          <input
            type="number"
            inputMode="numeric"
            className={styles.input}
            value={inputAge}
            onChange={handleInputChange}
            onBlur={syncFromInput}
          />
          <p className="caption">
            Ages must be between {MIN_AGE} and {MAX_AGE}. You can always
            refine this later.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <PrimaryButton
            type="button"
            label={primaryLabel}
            disabled={saving || !isDirty}
            onClick={handleSave}
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

export default EditAgePage;