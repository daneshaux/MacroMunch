// src/pages/EditActivity/EditActivity.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./EditActivity.module.css";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import ActivityLevel from "@/components/ActivityLevel/ActivityLevel";
import { getCurrentUserProfile, updateActivityLevel } from "@/lib/userApi";

function EditActivityPage() {
  const navigate = useNavigate();

  const [currentActivity, setCurrentActivity] = useState("lightly_active");
  const [activity, setActivity] = useState("lightly_active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load current profile so we can show real value
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      const res = await getCurrentUserProfile();
      if (!isMounted) return;

      if (res.ok && res.data) {
        const user = res.data;
        // API examples use "activitylevel"; be defensive:
        const apiActivity =
          user.activitylevel ?? user.activityLevel ?? "lightly_active";

        setCurrentActivity(apiActivity);
        setActivity(apiActivity);
      } else {
        // fallback, but log what happened
        console.warn("Could not load profile:", res.error);
        setCurrentActivity("lightly_active");
        setActivity("lightly_active");
      }

      setLoading(false);
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave() {
    // If nothing changed, just go back
    if (activity === currentActivity) {
      navigate(-1);
      return;
    }

    setSaving(true);
    setError("");

    const res = await updateActivityLevel(activity);
    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Could not update activity level.");
      return;
    }

    navigate("/profile");
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Activity level</h1>
        <p className="caption">
          Tell us how active you are on most days. You can change this any time.
        </p>
      </header>

      <section className={styles.content}>
        {loading ? (
          <p className="caption">Loading your preferences…</p>
        ) : (
          <>
            {/* Re-use your pretty radio cards */}
            <ActivityLevel value={activity} onChange={setActivity} />

            {error && <p className={`caption ${styles.error}`}>{error}</p>}

            <div className={styles.actions}>
              <PrimaryButton
                type="button"
                label={saving ? "Saving…" : "Save changes"}
                disabled={saving || loading || activity === currentActivity}
                onClick={handleSave}
              />
              <button
                type="button"
                className={`${styles.cancel} body-text`}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default EditActivityPage;