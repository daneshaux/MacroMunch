// src/components/SocialButton/SocialButton.jsx
import styles from "./SocialButton.module.css";

/**
 * A reusable circular social icon button.
 * Props:
 * - icon: React element (e.g., <FaGoogle />)
 * - label: accessible label for screen readers
 * - bgColor: background color (string)
 * - iconColor: color for the icon (string)
 * - borderColor: border color (string)
 * - onClick: callback
 */
function SocialButton({ icon, label, bgColor, iconColor, borderColor, onClick }) {
  const buttonStyle = {
    backgroundColor: bgColor,
    borderColor: borderColor,
    color: iconColor,
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={styles.socialButton}
      style={buttonStyle}
    >
      {icon}
    </button>
  );
}

export default SocialButton;