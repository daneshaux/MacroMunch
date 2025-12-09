// src/pages/EditAge/EditAge.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./EditAge.module.css";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { getCurrentUserProfile, updateDob } from "@/lib/userApi";

const MIN_AGE = 13;
const MAX_AGE = 100;

function EditAgePage() {
  const navigate = useNavigate();

  const [initialAge, setInitialAge] = useState(null);
  const [age, setAge] = useState(29);
  const [inputAge, setInputAge] = useState("29");
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [existingDob, setExistingDob] = useState(null); // "YYYY-MM-DD" or null

  function clampAge(n) {
    if (Number.isNaN(n)) return initialAge ?? 29;
    if (n < MIN_AGE) return MIN_AGE;
    if (n > MAX_AGE) return MAX_AGE;
    return n;
  }

  // Load DOB from Supabase and convert to age
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      const res = await getCurrentUserProfile();
      if (!isMounted) return;

      if (res.ok && res.data && res.data.dob) {
        const dob = res.data.dob; // "YYYY-MM-DD"
        setExistingDob(dob);

        const [y, m, d] = dob.split("-");
        const year = Number(y);
        const month = Number(m);
        const day = Number(d);

        const today = new Date();
        let ageYears = today.getFullYear() - year;

        const birthdayThisYear = new Date(
          today.getFullYear(),
          month - 1,
          day
        );
        if (today < birthdayThisYear) {
          ageYears -= 1;
        }

        const clamped = clampAge(ageYears);
        setInitialAge(clamped);
        setAge(clamped);
        setInputAge(String(clamped));
        setIsDirty(false);
      } else {
        console.warn("Could not load DOB:", res.error);
        // Fallback: keep default 29
        setInitialAge(29);
        setAge(29);
        setInputAge("29");
      }

      setLoading(false);
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  function syncFromInput() {
    const raw = inputAge.trim();
    const n = Number(raw);
    const clamped = clampAge(n);

    setAge(clamped);
    setInputAge(String(clamped));

    if (initialAge !== null && clamped !== initialAge) {
      setIsDirty(true);
    }
  }

  function handleInputChange(e) {
    setInputAge(e.target.value);
    // dirty will be set on blur via syncFromInput
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
    if (!isDirty) {
      navigate(-1);
      return;
    }

    setSaving(true);
    setError("");

    const today = new Date();
    const targetYear = today.getFullYear() - age;

    // Reuse existing month/day if we have them, else default to Jan 1
    let month = "01";
    let day = "01";

    if (existingDob) {
      const [y, m, d] = existingDob.split("-");
      month = m;
      day = d;
    }

    const res = await updateDob({
      year: String(targetYear),
      month,
      day,
    });

    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Could not update your age.");
      return;
    }

    setIsDirty(false);
    navigate("/profile");
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
        {loading ? (
          <p className="caption">Loading your profile…</p>
        ) : (
          <>
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

            {error && (
              <p className={`caption ${styles.error}`}>{error}</p>
            )}

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
          </>
        )}
      </section>
    </main>
  );
}

export default EditAgePage;