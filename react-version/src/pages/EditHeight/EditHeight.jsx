// src/pages/EditHeight/EditHeight.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./EditHeight.module.css";
import Select from "@/components/Select/Select";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import { getCurrentUserProfile, updateHeightCm } from "@/lib/userApi";
import { ftInToCm, cmToFtIn } from "@/lib/conversions";

const FEET_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const feet = i + 3; // 3–8 ft
  return { value: String(feet), label: `${feet} ft` };
});

const INCH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: `${i} in`,
}));

function EditHeightPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Initial from navigation state (fallback)
  const [initialFeet, setInitialFeet] = useState(
    String(location.state?.feet ?? 5)
  );
  const [initialInches, setInitialInches] = useState(
    String(location.state?.inches ?? 5)
  );

  const [feet, setFeet] = useState(initialFeet);
  const [inches, setInches] = useState(initialInches);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDirty = feet !== initialFeet || inches !== initialInches;

  // Load current height from Supabase if available
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      const res = await getCurrentUserProfile();
      if (!isMounted) return;

      if (res.ok && res.data && res.data.height_cm) {
        const { feet: f, inches: i } = cmToFtIn(res.data.height_cm);
        const fStr = String(f || 5);
        const iStr = String(i || 5);

        setInitialFeet(fStr);
        setInitialInches(iStr);
        setFeet(fStr);
        setInches(iStr);
      } else {
        console.warn("Could not load height:", res.error);
        // we already have sensible defaults from location.state
      }

      setLoading(false);
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave() {
    if (!isDirty) {
      navigate(-1);
      return;
    }

    setSaving(true);
    setError("");

    const cm = ftInToCm(feet, inches);

    const res = await updateHeightCm(cm);

    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Could not update height.");
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
        <h1 className="h1">Height</h1>
        <p className="caption">
          Update your height for accurate macro tracking.
        </p>
      </header>

      <section className={styles.content}>
        {loading ? (
          <p className="caption">Loading your height…</p>
        ) : (
          <>
            <div className={styles.card}>
              <div className={styles.inputRow}>
                <Select
                  id="feet"
                  label="Feet"
                  value={feet}
                  onChange={setFeet}
                  options={FEET_OPTIONS}
                />

                <Select
                  id="inches"
                  label="Inches"
                  value={inches}
                  onChange={setInches}
                  options={INCH_OPTIONS}
                />
              </div>

              <p className="caption">
                Used only to calculate your energy needs — not shown publicly.
              </p>
            </div>

            {error && (
              <p className={`caption ${styles.error}`}>{error}</p>
            )}

            <div className={styles.actions}>
              <PrimaryButton
                type="button"
                label={isDirty ? (saving ? "Saving…" : "Save changes") : "Saved"}
                disabled={!isDirty || saving || loading}
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

export default EditHeightPage;