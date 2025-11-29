// src/components/OptionPill/OptionPill.jsx
import styles from "./OptionPill.module.css";

function OptionPill({
  label,
  selected = false,
  onToggle = () => {},
  size = "md", // "sm" | "md" | "lg"
}) {
  return (
    <button
      type="button"
      className={[
        styles.pill,
        styles[size] || "",
        selected ? styles.selected : "",
      ].join(" ")}
      onClick={onToggle}
    >
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default OptionPill;