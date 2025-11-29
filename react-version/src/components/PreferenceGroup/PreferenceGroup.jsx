// src/components/PreferenceGroup/PreferenceGroup.jsx
import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

import styles from "./PreferenceGroup.module.css";
import OptionPill from "@/components/OptionPill/OptionPill";

function PreferenceGroup({
  title,
  description,
  options = [], // [{ value, label }]
  selectedValues = [], // ["vegan", "pescatarian", ...]
  onChange = () => {},
  allowMultiple = true,
  pillSize = "md",
  defaultOpen,
}) {
  const initialOpen =
    typeof defaultOpen === "boolean"
      ? defaultOpen
      : (selectedValues && selectedValues.length > 0);

  const [open, setOpen] = useState(initialOpen);
  const selectedCount = selectedValues?.length ?? 0;

  function handleToggle(value) {
    if (allowMultiple) {
      const isSelected = selectedValues.includes(value);
      const next = isSelected
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(next);
    } else {
      // single select – tap again to clear
      const next = selectedValues[0] === value ? [] : [value];
      onChange(next);
    }
  }

  return (
    <section className={styles.group}>
      {/* Header row (title + count + chevron) */}
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className={styles.headerText}>
          <div className={styles.titleRow}>
            <h2 className="h4">{title}</h2>
            <span className={styles.count}>
              {selectedCount} selected
            </span>
          </div>
          {description && (
            <p className={`caption ${styles.description}`}>{description}</p>
          )}
        </div>

        <FiChevronDown
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
        />
      </button>

      {/* Collapsible body */}
      <div
        className={`${styles.body} ${
          open ? styles.bodyOpen : styles.bodyClosed
        }`}
      >
        <div className={styles.pills}>
          {options.map((opt) => (
            <OptionPill
              key={opt.value}
              label={opt.label}
              size={pillSize}
              selected={selectedValues.includes(opt.value)}
              onToggle={() => handleToggle(opt.value)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PreferenceGroup;