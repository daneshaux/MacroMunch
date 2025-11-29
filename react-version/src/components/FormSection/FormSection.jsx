import styles from "./FormSection.module.css";

function FormSection({ title, children }) {
  return (
    <section className={styles.section}>
      <h3 className={`body-text ${styles.title}`}>{title}</h3>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
export default FormSection;