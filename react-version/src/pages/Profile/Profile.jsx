// src/pages/Profile/Profile.jsx
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Profile.module.css";
import { FiChevronRight } from "react-icons/fi";
import { use, useEffect, useState } from "react";
import { getAuthProfileSummary, getCurrentUserProfile } from "@/lib/userApi";
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

  // 🔹 Full profile details
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    // refetch profile when returning to this page
  }, [location.key]);

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

  useEffect(() => {
    let mounted = true;

    (async () => {
      setProfileLoading(true);

      const res = await getCurrentUserProfile();
      if (!mounted) return;

      if (res.ok) {
        setProfile(res.data);
      } else {
        console.warn("[Profile] getCurrentUserProfile failed:", res.error);
        setProfile(null);
      }

      setProfileLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[Auth] signOut error", error);
      alert("Sorry, something went wrong logging out. Please try again.");
      return;
    }

    navigate("/");
  }

  // 🔹 Use auth data for display name/email/initial
  const fullName = headerInfo.displayName || "MacroMunch user";
  const email = headerInfo.email || "demo@macromunch.com";
  const initials = headerInfo.initial || "MM";

  // ✅ Derived profile values (AFTER profile is declared)
  const goalLabel =
    profile?.goal === "lose"
      ? "Lose body fat"
      : profile?.goal === "gain"
      ? "Build muscle & strength"
      : "Maintain weight";

  const activityLabel = profile?.activity_level
    ? profile.activity_level
    : "Set your activity";

  const mealsPerDay = profile?.meals_per_day ?? "—";

  // Age (since you store dob)
  const age = (() => {
    if (!profile?.dob) return "—";
    const dob = new Date(profile.dob);
    if (Number.isNaN(dob.getTime())) return "—";

    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) years--;
    return years;
  })();

  // Height display
  const heightDisplay = (() => {
    const cm = profile?.height_cm;
    if (!cm) return "—";
    const totalIn = cm / 2.54;
    const feet = Math.floor(totalIn / 12);
    const inches = Math.round(totalIn % 12);
    return `${feet}' ${inches}"`;
  })();

  // Weight display (convert kg -> lb)
  const weightDisplay = (() => {
    const kg = profile?.weight_kg;
    if (!kg) return "—";
    const lb = Math.round(kg * 2.20462);
    return `${lb} lb`;
  })();

  // Dietary chips (normalize to flat strings)
  const dietaryFlags = [
    ...(Array.isArray(profile?.diet_preferences) ? profile.diet_preferences : []),
    ...(Array.isArray(profile?.diet_allergies) ? profile.diet_allergies : []),
    ...(Array.isArray(profile?.diet_eating_styles) ? profile.diet_eating_styles : []),
    ...(Array.isArray(profile?.diet_flavor_profiles) ? profile.diet_flavor_profiles : []),
  ]
    .flat() // just in case any of those arrays contain arrays
    .map((v) => (typeof v === "string" ? v.trim() : String(v)))
    .filter(Boolean);

  const maxDietaryChips = 4;
  const visibleDietaryFlags = dietaryFlags.slice(0, maxDietaryChips);
  const extraCount = dietaryFlags.length - visibleDietaryFlags.length;

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
                <span className="body-text value">{profileLoading ? "Loading…" : goalLabel}</span>
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
                  {profileLoading ? "Loading…" : activityLabel || "Set your activity"}
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
                <span className="body-text value">{profileLoading ? "Loading…" : mealsPerDay}</span>
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
                <span className="body-text value">{profileLoading ? "Loading…" : age}</span>
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
                <span className="body-text value">{profileLoading ? "Loading…" : heightDisplay}</span>
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
                <span className="body-text value">{profileLoading ? "Loading…" : weightDisplay}</span>
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
            {dietaryFlags.length ? (
              <ul className={styles.tagList}>
                {visibleDietaryFlags.map((flag, idx) => (
                  <li key={`${flag}-${idx}`} className={styles.tag}>
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