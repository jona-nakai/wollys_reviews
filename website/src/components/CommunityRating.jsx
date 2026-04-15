import styles from "./CommunityRating.module.css";

// Smooth hue gradient: 1 → red (0°), 3 → yellow (60°), 5 → green (120°)
function avgColor(avg) {
  const v = Math.max(1, Math.min(5, parseFloat(avg)));
  const hue = ((v - 1) / 4) * 120;
  return `hsl(${hue}, 75%, 45%)`;
}

export default function CommunityRating({ avg, count }) {
  if (!avg) return null;
  const color = avgColor(avg);
  return (
    <div className={styles.row}>
      <span className={styles.star} style={{ color }}>★</span>
      <span className={styles.avg}>{avg}</span>
      <span className={styles.count}>({count} ratings)</span>
    </div>
  );
}
