// src/components/RecipeCard/RecipeCard.jsx
import { FiHeart, FiClock } from "react-icons/fi";
import styles from "./RecipeCard.module.css";

function RecipeCard({
  title,
  imageUrl,
  dietTag,
  timeMinutes,
  rating = 4.8,
  isFavorite = false,
}) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={imageUrl} alt={title} className={styles.image} />

        {/* Diet tag pill */}
        {dietTag && (
          <span className={styles.dietTag}>
            {dietTag}
          </span>
        )}

        {/* Heart */}
        <button
          type="button"
          className={`${styles.heartButton} ${isFavorite ? styles.heartActive : ""}`}
          onClick={(e) => {
            e.preventDefault();
            // 🧠 Future: toggle favorite
          }}
        >
          <FiHeart />
        </button>
      </div>

      <div className={styles.info}>
        <h3 className={`${styles.title} body-text`}>{title}</h3>

        <div className={styles.metaRow}>
        <div className={styles.ratingGroup}>
          <span className={styles.stars}>★</span>
          <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
        </div>

        <div className={styles.timeGroup}>
          <FiClock className={styles.timeIcon} />
          <span className={styles.timeValue}>{timeMinutes} min</span>
        </div>
      </div>
      </div>
    </article>
  );
}

export default RecipeCard;