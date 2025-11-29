// src/components/TextInput/TextInput.jsx
import styles from "./TextInput.module.css";

/**
 * A reusable text input field with an optional label.
 * Props:
 * - label: text shown above the input (optional)
 * - type: input type ("text", "email", "number", etc.)
 * - placeholder: placeholder text
 * - value: controlled input value
 * - onChange: callback to update value
 */
function TextInput({ id, label, type = "text", placeholder, value, onChange }) {
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className="body-text">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${styles.input} body-text`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default TextInput;