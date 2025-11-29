import { useState } from "react";
import styles from "./PasswordInput.module.css";
import { FiEye, FiEyeOff } from "react-icons/fi";

function PasswordInput({ id, label = "Password", value, onChange, placeholder = "Enter your password" }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className="body-text">{label}</label>

      <div className={styles.inputWrap}>
        <input
          id={id}
          className={`${styles.input} body-text`}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
}

export default PasswordInput;