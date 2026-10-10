import styles from './StatRow.module.css';

/** Three stat cards that always stay in one row, scaling their text with the row's width. */
export function StatRow({ items }: Readonly<{ items: [React.ReactNode, string][] }>) {
  return (
    <div className={styles.row}>
      {items.map(([value, label]) => (
        <div key={label} className={styles.card}>
          <div className={styles.value}>{value}</div>
          <div className={styles.label}>{label}</div>
        </div>
      ))}
    </div>
  );
}
