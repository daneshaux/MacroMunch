import styles from "./ActivityLevel.module.css";

const PRESETS = [
  { id: "sedentary", title: "Sedentary", desc: "Desk job, little exercise" },
  { id: "light",     title: "Light",     desc: "1–3 workouts/week" },
  { id: "moderate",  title: "Moderate",  desc: "3–5 workouts/week" },
  { id: "very",      title: "Very",      desc: "6–7 workouts/week or active job" },
];

function ActivityLevel({ value, onChange }) {
  return (
    <fieldset className={styles.group} aria-label="Activity Level">
      <div className={styles.grid}>
        {PRESETS.map(opt => {
          const checked = value === opt.id;
          return (
            <label key={opt.id} className={`${styles.card} ${checked ? styles.cardChecked : ""}`}>
              <input
                type="radio"
                name="activityLevel"
                value={opt.id}
                checked={checked}
                onChange={(e) => onChange(e.target.value)}
                className={styles.input}
              />
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <span className="h5">{opt.title}</span>
                  <span className={styles.dot} aria-hidden="true" />
                </div>
                <p className={`caption ${styles.desc}`}>{opt.desc}</p>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default ActivityLevel;