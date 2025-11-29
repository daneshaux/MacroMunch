// src/components/PrimaryButton/PrimaryButton.jsx
import styles from "./PrimaryButton.module.css";

/**
 * A reusable primary action button for the MacroMunch app.
 * Props:
 * - label: text to display on the button
 * - type: "button" | "submit" (default: "button")
 * - onClick: function to run when clicked
 * - disabled: optional boolean
 */
function PrimaryButton({ label, type = "button", onClick, disabled = false, loading = false }) {
  return (
    <button
      type={type}
      className={`${styles.primaryButton} h4`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? "Loading..." : label}
    </button>
  );
}

export default PrimaryButton;