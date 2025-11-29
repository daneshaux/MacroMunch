// src/components/OnboardingOptionCard/OnboardingOptionCard.jsx
import styles from "./OnboardingOptionCard.module.css";

function OnboardingOptionCard({
  label,
  description,
  icon,
  iconSrc,
  iconAlt = "",
  backgroundImage,
  selected = false,
  className = "",
  disabled = false,
  children,
  style,
  ...props
}) {
  const rootClassName = [
    styles.card,
    selected && styles.selected,
    disabled && styles.disabled,
    backgroundImage && styles.withBackground,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const normalizedBackground =
    typeof backgroundImage === "string" && backgroundImage.trim().length > 0
      ? /^(linear-gradient|radial-gradient|conic-gradient|url\()/i.test(
          backgroundImage.trim()
        )
        ? backgroundImage
        : `url(${backgroundImage})`
      : null;

  const inlineStyle = {
    ...style,
    ...(normalizedBackground
      ? { "--card-background": normalizedBackground }
      : null),
  };

  const renderIcon = () => {
    if (iconSrc) {
      return (
        <span className={styles.icon}>
          <img
            src={iconSrc}
            alt={iconAlt || `${label} icon`}
            className={styles.iconImage}
          />
        </span>
      );
    }

    if (icon) {
      return <span className={styles.icon}>{icon}</span>;
    }

    return null;
  };

  return (
    <button
      type="button"
      className={rootClassName}
      disabled={disabled}
      style={inlineStyle}
      {...props}
    >
      <span className={styles.content}>
        {renderIcon()}
        <span className={styles.textContent}>
          <span className={`${styles.label} h5`}>{label}</span>
          {description && (
            <span className={styles.description}>{description}</span>
          )}
          {children}
        </span>
      </span>
    </button>
  );
}

export default OnboardingOptionCard;
