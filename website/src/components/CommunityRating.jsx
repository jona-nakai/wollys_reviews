import styles from "./CommunityRating.module.css";

export default function CommunityRating({ avg, count }) {
  if (!avg) return null;
  return (
    <div className={styles.row}>
      <span className={styles.star}>★</span>
      <span className={styles.avg}>{avg}</span>
      <span className={styles.count}>({count} ratings)</span>
    </div>
  );
}