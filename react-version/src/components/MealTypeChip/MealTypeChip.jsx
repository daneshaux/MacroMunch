// src/components/MealTypeChip/MealTypeChip.jsx
import styles from "./MealTypeChip.module.css";

function MealTypeChip({ label, imageUrl, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${isActive ? styles.active : ""}`}
      onClick={onClick}
    >
      <div className={styles.imageWrapper}>
        <img src={imageUrl} alt={label} className={styles.image} />
      </div>
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default MealTypeChip;