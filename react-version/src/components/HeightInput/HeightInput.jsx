import styles from "./HeightInput.module.css";

/**
 * HeightInput
 * Props:
 *  - feet (string/number)
 *  - inches (string/number)
 *  - onChange({ feet, inches, totalInches })
 */
function HeightInput({ feet = "", inches = "", onChange }) {
  function clamp(val, min, max) {
    const n = Number(val);
    if (Number.isNaN(n)) return "";
    return Math.min(Math.max(n, min), max);
  }

  function handleFeetChange(v) {
    const f = clamp(v, 0, 8);
    const i = inches === "" ? 0 : Number(inches);
    onChange?.({ feet: f, inches, totalInches: (Number(f) || 0) * 12 + i });
  }

  function handleInchesChange(v) {
    const i = clamp(v, 0, 11);
    const f = feet === "" ? 0 : Number(feet);
    onChange?.({ feet, inches: i, totalInches: f * 12 + (Number(i) || 0) });
  }

  return (
    <div className={styles.row}>
      <label className={styles.field}>
        <span className="body-text">Height (ft)</span>
        <input
          className={`${styles.input} body-text`}
          type="number"
          inputMode="numeric"
          min="0"
          max="8"
          value={feet}
          onChange={(e) => handleFeetChange(e.target.value)}
          placeholder="ft"
        />
      </label>

      <label className={styles.field}>
        <span className="body-text">Height (in)</span>
        <input
          className={`${styles.input} body-text`}
          type="number"
          inputMode="numeric"
          min="0"
          max="11"
          value={inches}
          onChange={(e) => handleInchesChange(e.target.value)}
          placeholder="in"
        />
      </label>
    </div>
  );
}

export default HeightInput;