// src/components/AppHeader/AppHeader.jsx
import { useEffect, useState } from "react";
import styles from "./AppHeader.module.css";
import { FaBell } from "react-icons/fa";
import { getAuthProfileSummary } from "@/lib/userApi";

function AppHeader({
  firstName = "",
  onProfileClick = () => {},
  onNotificationsClick = () => {},
}) {
  // Start with whatever parent gave us (or "M")
  const [initial, setInitial] = useState(
    firstName?.trim()?.charAt(0)?.toUpperCase() || "M"
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await getAuthProfileSummary();
      if (!mounted) return;

      if (res.ok && res.data?.initial) {
        setInitial(res.data.initial);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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