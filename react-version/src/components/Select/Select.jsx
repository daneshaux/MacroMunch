import styles from "./Select.module.css";

function Select({ id, label, value, onChange, options = [] }) {
  return (
    <div className={styles.field}>
      {label && <label className="body-text" htmlFor={id}>{label}</label>}
      <select
        id={id}
        className={`${styles.select} body-text`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Select;