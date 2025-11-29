import styles from "./BottomNav.module.css";
import { FaHome, FaUtensils, FaUser } from "react-icons/fa";

function BottomNav({ active = "home", onChange = () => {} }) {
  return (
    <nav className={styles.nav}>
      <button
        type="button"
        className={`${styles.item} ${active === "home" ? styles.active : ""}`}
        onClick={() => onChange("home")}
      >
        <FaHome className={styles.icon} />
        <span className="caption">Home</span>
      </button>

      <button
        type="button"
        className={`${styles.item} ${active === "recipes" ? styles.active : ""}`}
        onClick={() => onChange("recipes")}
      >
        <FaUtensils className={styles.icon} />
        <span className="caption">Recipes</span>
      </button>

      <button
        type="button"
        className={`${styles.item} ${active === "profile" ? styles.active : ""}`}
        onClick={() => onChange("profile")}
      >
        <FaUser className={styles.icon} />
        <span className="caption">Profile</span>
      </button>
    </nav>
  );
}

export default BottomNav;