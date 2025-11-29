import styles from "./FieldRow.module.css";
function FieldRow({ children, cols = 2 }) {
  return (
    <div
      className={styles.row}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {children}
    </div>
  );
}
export default FieldRow;