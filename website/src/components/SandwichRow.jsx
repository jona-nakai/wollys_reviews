import styles from "./SandwichRow.module.css";
import StarRating from "./StarRating";
import CommunityRating from "./CommunityRating";

export default function SandwichRow({
  id, name, myRating, communityR, predicted,
  predictionsLoading, isSaved, isLast, onChange,
}) {
  const showPrediction = !myRating && (predictionsLoading || predicted != null);

  return (
    <div className={`${styles.row} ${myRating ? styles.rated : ""} ${isLast ? styles.last : ""}`}>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <p className={styles.name}>{name}</p>
        </div>
        <div className={styles.meta}>
          {communityR
            ? <CommunityRating avg={communityR.avg} count={communityR.count} />
            : isSaved && <span className={styles.saved}>✓ saved</span>
          }
          {showPrediction && (
            <span className={styles.predicted}>
              {predictionsLoading
                ? <span className={styles.refreshing}>↻ updating</span>
                : `🥪 predicted ${predicted.toFixed(1)}`
              }
            </span>
          )}
        </div>
      </div>
      <StarRating value={myRating} onChange={val => onChange(id, val)} />
    </div>
  );
}
