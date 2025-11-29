// src/pages/Profile/Profile.jsx
import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import { FiChevronRight } from "react-icons/fi";

function Profile() {
  const navigate = useNavigate();

  // For now: mocked user data (later we'll wire to API)
  const user = {
    firstName: "Neesh",
    lastName: "Williams",
    email: "demo+1@macromunch.com",
    goalLabel: "Maintain weight",
    activityLabel: "Lightly active",
    mealsPerDay: 3,
    age: 29,
    heightFeet: 5,
    heightInches: 5,
    heightDisplay: `5' 5"`,
    weightDisplay: "165 lb",
    dietaryFlags: ["Pescatarian", "Dairy free"],
  };

  const fullName = `${user.firstName} ${user.lastName}`;

  const maxDietaryChips = 3;
  const visibleDietaryFlags = user.dietaryFlags.slice(0, maxDietaryChips);
  const extraCount = user.dietaryFlags.length - visibleDietaryFlags.length;

  return (
    <main className={styles.screen}>
      {/* Header / hero */}
      <header className={styles.header}>
        <div className={styles.avatar}>
          <span className="h4">
            {user.firstName[0]}
            {user.lastName[0]}
          </span>
        </div>

        <div className={styles.headerText}>
          <h1 className="h3">{fullName}</h1>
          <p className="caption">Your MacroMunch settings &amp; preferences.</p>
          <p className={`caption ${styles.email}`}>{user.email}</p>
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

              {/* ACTIVITY ROW → tap to edit */}
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

                {/* MEALS PER DAY → tap to edit */}
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
            {/* Age → tappable row */}
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

            {/* Height → tappable row */}
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

            {/* Weight → tappable row */}
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
              onClick={() => alert("Future: sign out")}
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