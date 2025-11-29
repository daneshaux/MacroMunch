// src/pages/EditHeight/EditHeight.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./EditHeight.module.css";
import Select from "@/components/Select/Select";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";

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

  const startFeet = String(location.state?.feet ?? 5);
  const startInches = String(location.state?.inches ?? 5);

  const [feet, setFeet] = useState(startFeet);
  const [inches, setInches] = useState(startInches);

  const isDirty = feet !== startFeet || inches !== startInches;

  function handleSave() {
    // 🔮 future: backend update
    navigate(-1);
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Height</h1>
        <p className="caption">Update your height for accurate macro tracking.</p>
      </header>

      <section className={styles.content}>
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

        <div className={styles.actions}>
          <PrimaryButton
            type="button"
            label={isDirty ? "Save changes" : "Saved"}
            disabled={!isDirty}
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

export default EditHeightPage;