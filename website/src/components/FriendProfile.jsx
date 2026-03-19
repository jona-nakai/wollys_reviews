import { useEffect } from "react";
import { SANDWICHES } from "../constants/sandwiches";
import StarRating from "./StarRating";
import styles from "./FriendProfile.module.css";

// Flat map of all sandwich IDs → names, built once at module level
const ALL_ITEMS = Object.values(SANDWICHES)
  .flatMap(cat => Object.entries(cat.items))
  .reduce((acc, [id, name]) => { acc[id] = name; return acc; }, {});

export default function FriendProfile({ friend, myRatings, friendRatings, onLoad, onUnfollow }) {
  // onLoad is stable (useCallback with no deps) so this only fires when friend.uid changes
  useEffect(() => {
    onLoad(friend.uid);
  }, [friend.uid, onLoad]);

  const theirRatings = friendRatings[friend.uid] || {};

  // Top 3 most recently rated
  const top3 = Object.entries(theirRatings)
    .sort((a, b) => (b[1].updatedAt ?? 0) - (a[1].updatedAt ?? 0))
    .slice(0, 3);

  const totalRated = Object.keys(theirRatings).length;
  const avgRating  = totalRated
    ? (Object.values(theirRatings).reduce((s, r) => s + r.taste, 0) / totalRated).toFixed(1)
    : null;
  const inCommon = Object.keys(theirRatings).filter(id => myRatings[id]).length;

  return (
    <div className={styles.wrap}>

      {/* Friend header */}
      <div className={styles.profileHeader}>
        <div className={styles.nameBlock}>
          <p className={styles.name}>{friend.username ? `@${friend.username}` : friend.email}</p>
        </div>
        <button className={styles.unfollowBtn} onClick={() => onUnfollow(friend.uid)}>
          Unfollow
        </button>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statVal}>{totalRated}</span>
          <span className={styles.statLabel}>Rated</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statVal}>{avgRating ?? "—"}</span>
          <span className={styles.statLabel}>Avg</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statVal}>{inCommon}</span>
          <span className={styles.statLabel}>In common</span>
        </div>
      </div>

      {/* Top 3 recently rated */}
      <div className={styles.top3Header}>
        <span className={styles.top3Label}>Recently rated</span>
      </div>

      {top3.length === 0 ? (
        <p className={styles.empty}>
          @{friend.username || friend.email} hasn't rated anything yet.
        </p>
      ) : (
        <div className={styles.ratingsList}>
          {top3.map(([id, { taste }], i) => {
            const name    = ALL_ITEMS[id] ?? id;
            const myScore = myRatings[id] || 0;
            const isLast  = i === top3.length - 1;
            return (
              <div key={id} className={`${styles.row} ${isLast ? styles.last : ""}`}>
                <p className={styles.sandwichName}>{name}</p>
                <div className={styles.ratings}>
                  <div className={styles.ratingCol}>
                    <span className={styles.ratingOwner}>@{friend.username}</span>
                    <StarRating value={taste} readonly size={15} />
                  </div>
                  <div className={styles.ratingCol}>
                    <span className={styles.ratingOwner}>You</span>
                    {myScore > 0
                      ? <StarRating value={myScore} readonly size={15} />
                      : <span className={styles.noRating}>Not rated</span>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}