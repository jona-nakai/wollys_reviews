import { useState, useRef, useEffect } from "react";
import styles from "./NotificationBell.module.css";

export default function NotificationBell({
  notifications = [],   // default to empty array so .map never throws
  unreadCount   = 0,
  onMarkAllRead,
  onFollowBack,
  followingIds  = [],   // default to empty array so .includes never throws
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen(o => !o);
    if (unreadCount > 0) onMarkAllRead();
  }

  function timeAgo(seconds) {
    if (!seconds) return "";
    const diff = Math.floor(Date.now() / 1000 - seconds);
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className={styles.wrap} ref={ref}>
      {/* Bell button */}
      <button className={styles.bellBtn} onClick={handleOpen} aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <span className={styles.dropTitle}>Notifications</span>
            {notifications.length > 0 && (
              <button className={styles.clearBtn} onClick={onMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>No notifications yet.</div>
          ) : (
            <ul className={styles.list}>
              {notifications.map(n => {
                const alreadyFollowing = followingIds.includes(n.fromUid);
                return (
                  <li key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ""}`}>
                    <div className={styles.content}>
                      <p className={styles.message}>
                        <strong>@{n.fromUsername}</strong> followed you.
                      </p>
                      <span className={styles.time}>{timeAgo(n.createdAt?.seconds)}</span>
                    </div>
                    {!alreadyFollowing && (
                      <button
                        className={styles.followBackBtn}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onFollowBack({
                            uid:      n.fromUid,
                            username: n.fromUsername,
                            photoURL: n.fromPhoto,
                            email:    n.fromEmail ?? "",
                          });
                        }}
                      >
                        Follow back
                      </button>
                    )}
                    {alreadyFollowing && (
                      <span className={styles.followingTag}>Following</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}