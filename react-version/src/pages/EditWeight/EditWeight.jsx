// src/pages/EditWeight/EditWeight.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./EditWeight.module.css";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { getCurrentUserProfile, updateWeightKg } from "@/lib/userApi";
import { lbsToKg, kgToLbs } from "@/lib/conversions";

const MIN_WEIGHT = 60;
const MAX_WEIGHT = 400;

function clampWeight(value) {
  if (Number.isNaN(value)) return MIN_WEIGHT;
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, value));
}

function EditWeight() {
  const navigate = useNavigate();

  const [initialWeight, setInitialWeight] = useState(null); // in lbs
  const [weight, setWeight] = useState(MIN_WEIGHT);
  const [inputWeight, setInputWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isDirty =
    initialWeight !== null && weight !== initialWeight;

  // Load from Supabase the first time
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      const res = await getCurrentUserProfile();
      if (!isMounted) return;

      if (res.ok && res.data) {
        const profile = res.data;
        const kg = profile.weight_kg ?? 0;

        // If we have something stored, convert to lbs; else fallback.
        const lbsRaw = kg ? kgToLbs(kg) : 165;
        const lbs = clampWeight(Math.round(lbsRaw || 165));

        setInitialWeight(lbs);
        setWeight(lbs);
        setInputWeight(String(lbs));
      } else {
        console.warn("Could not load profile:", res.error);
        // Fallback to your old 165 default
        const fallback = 165;
        setInitialWeight(fallback);
        setWeight(fallback);
        setInputWeight(String(fallback));
      }

      setLoading(false);
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

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
    setError("");

    const newKg = lbsToKg(weight);

    const res = await updateWeightKg(newKg);

    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Could not update weight.");
      return;
    }

    navigate("/profile");
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
        {loading ? (
          <p className="caption">Loading your weight…</p>
        ) : (
          <>
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

            {error && (
              <p className={`caption ${styles.error}`}>{error}</p>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <PrimaryButton
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving || loading}
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
          </>
        )}
      </section>
    </main>
  );
}

export default EditWeight;