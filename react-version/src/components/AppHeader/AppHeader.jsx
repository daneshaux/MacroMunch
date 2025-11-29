import styles from "./AppHeader.module.css";
import { FaBell } from "react-icons/fa";

function AppHeader({
  firstName = "",
  onProfileClick = () => {},
  onNotificationsClick = () => {},
}) {
  const initial = firstName?.trim()?.charAt(0)?.toUpperCase() || "M"; // M for MacroMunch / mystery

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.avatarButton}
        onClick={onProfileClick}
        aria-label="Profile"
      >
        <span className={styles.avatarInitial}>{initial}</span>
      </button>

      <div className={styles.spacer} />

      <button
        type="button"
        className={styles.iconButton}
        onClick={onNotificationsClick}
        aria-label="Notifications"
      >
        <FaBell className={styles.icon} />
      </button>
    </header>
  );
}

export default AppHeader;