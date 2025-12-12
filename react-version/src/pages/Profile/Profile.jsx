// src/pages/Profile/Profile.jsx
import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import { FiChevronRight } from "react-icons/fi";
import { useEffect, useState } from "react";
import { getAuthProfileSummary } from "@/lib/userApi";
import { supabase } from "@/lib/supabaseClient";


function Profile() {
  const navigate = useNavigate();

  // 🔹 Live auth header info (name, email, initial)
  const [headerInfo, setHeaderInfo] = useState({
    displayName: "",
    email: "",
    initial: "",
  });
  const [headerLoading, setHeaderLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await getAuthProfileSummary();
      if (!mounted) return;

      if (res.ok && res.data) {
        setHeaderInfo(res.data);
      }
      setHeaderLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    // Optional: you could show a loading state / disable button here
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[Auth] signOut error", error);
      alert("Sorry, something went wrong logging out. Please try again.");
      return;
    }

    // After sign-out, send them back to the welcome / sign-in screen
    navigate("/");
  }

  // For now: mocked profile data for everything else
  const user = {
    goalLabel: "Maintain weight",
    activityLabel: "Lightly active",
    mealsPerDay: 4,
    age: 29,
    heightFeet: 5,
    heightInches: 5,
    heightDisplay: `5' 5"`,
    weightDisplay: "165 lb",
    dietaryFlags: ["Pescatarian", "Dairy free"],
  };

  // 🔹 Use auth data for display name/email/initial
  const fullName = headerInfo.displayName || "MacroMunch user";
  const email = headerInfo.email || "demo@macromunch.com";
  const initials = headerInfo.initial || "MM";

  const maxDietaryChips = 4;
  const visibleDietaryFlags = user.dietaryFlags.slice(0, maxDietaryChips);
  const extraCount = user.dietaryFlags.length - visibleDietaryFlags.length;

  return (
    <main className={styles.screen}>
      {/* Header / hero */}
      <header className={styles.header}>
        <div className={styles.avatar}>
          <span className="h4">
            {headerLoading ? "" : initials}
          </span>
        </div>

        <div className={styles.headerText}>
          <h1 className="h3">
            {headerLoading ? "Loading…" : fullName}
          </h1>
          <p className="caption">Your MacroMunch settings &amp; preferences.</p>
          <p className={`caption ${styles.email}`}>
            {headerLoading ? "" : email}
          </p>
        </div>
      </header>

      <section className={styles.sections}>
        {/* Goal & Activity */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className="h4">Goal & Activity</h2>
          </div>
          <div className={styles.cardBody}>
            <button
              type="button"
              className={`${styles.row} ${styles.rowButton}`}
              onClick={() => navigate("/goal")}
            >
              <span className="caption label">Goal</span>
              <div className={styles.rowRight}>
                <span className="body-text value">{user.goalLabel}</span>
                <FiChevronRight className={styles.chevron} />
              </div>
            </button>

            <button
              type="button"
              className={styles.rowButton}
              onClick={() => navigate("/activity")}
            >
              <span className="caption label">Activity level</span>
              <div className={styles.valueWithChevron}>
                <span className="body-text value">
                  {user.activityLabel || "Set your activity"}
                </span>
                <FiChevronRight className={styles.chevron} />
              </div>
            </button>

            <button
              type="button"
              className={styles.rowButton}
              onClick={() => navigate("/meals")}
            >
              <span className="caption label">Meals per day</span>
              <div className={styles.valueWithChevron}>
                <span className="body-text value">{user.mealsPerDay}</span>
                <FiChevronRight className={styles.chevron} />
              </div>
            </button>
          </div>
        </section>

        {/* Body & age */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className="h4">Body &amp; Age</h2>
          </div>
          <div className={styles.cardBody}>
            <button
              type="button"
              className={`${styles.row} ${styles.rowButton}`}
              onClick={() => navigate("/age")}
            >
              <span className="caption label">Age</span>
              <div className={styles.valueWithChevron}>
                <span className="body-text value">{user.age}</span>
                <FiChevronRight className={styles.chevron} />
              </div>
            </button>

            <button
              type="button"
              className={`${styles.row} ${styles.rowButton}`}
              onClick={() => navigate("/height")}
            >
              <span className="caption label">Height</span>
              <div className={styles.valueWithChevron}>
                <span className="body-text value">{user.heightDisplay}</span>
                <FiChevronRight className={styles.chevron} />
              </div>
            </button>

            <button
              type="button"
              className={`${styles.row} ${styles.rowButton}`}
              onClick={() => navigate("/weight")}
            >
              <span className="caption label">Weight</span>
              <div className={styles.valueWithChevron}>
                <span className="body-text value">{user.weightDisplay}</span>
                <FiChevronRight className={styles.chevron} />
              </div>
            </button>
          </div>
        </section>

        {/* Dietary preferences */}
        <section
          className={`${styles.card} ${styles.clickableCard}`}
          onClick={() => navigate("/preferences")}
          role="button"
        >
          <div className={styles.cardHeader}>
            <h2 className="h4">Dietary preferences</h2>
            <FiChevronRight className={styles.chevron} />
          </div>

          <div className={styles.cardBody}>
            {user.dietaryFlags.length ? (
              <ul className={styles.tagList}>
                {visibleDietaryFlags.map((flag) => (
                  <li key={flag} className={styles.tag}>
                    <span className="caption">{flag}</span>
                  </li>
                ))}

                {extraCount > 0 && (
                  <li className={styles.tag}>
                    <span className="caption">+{extraCount} more</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="caption">No dietary filters set yet.</p>
            )}
          </div>
        </section>

        {/* App settings (stub) */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className="h4">App &amp; account</h2>
          </div>
          <div className={styles.cardBody}>
            <button
              type="button"
              className={`${styles.linkRow} body-text`}
              onClick={() => alert("Future: notifications settings")}
            >
              Notifications
            </button>
            <button
              type="button"
              className={`${styles.linkRow} body-text`}
              onClick={() => alert("Future: support / contact us")}
            >
              Contact support
            </button>
            <button
              type="button"
              className={`${styles.linkRow} body-text ${styles.danger}`}
              onClick={handleLogout}
            >
              Log out
            </button>
              </div>
            </section>
          </section>
        </main>
      );
}

export default Profile;