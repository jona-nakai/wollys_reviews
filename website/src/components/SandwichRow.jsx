import styles from "./SandwichRow.module.css";
import StarRating from "./StarRating";
import CommunityRating from "./CommunityRating";

export default function SandwichRow({ id, name, myRating, communityR, isSaved, isLast, onChange }) {
  const isFave = communityR && parseFloat(communityR.avg) >= 4.5;

  return (
    <div className={`${styles.row} ${myRating ? styles.rated : ""} ${isLast ? styles.last : ""}`}>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <p className={styles.name}>{name}</p>
          {isFave && <span className={styles.faveBadge}>Fave</span>}
        </div>
        <div className={styles.meta}>
          {communityR
            ? <CommunityRating avg={communityR.avg} count={communityR.count} />
            : isSaved && <span className={styles.saved}>✓ saved</span>
          }
        </div>
      </div>
      <StarRating value={myRating} onChange={val => onChange(id, val)} />
    </div>
  );
}