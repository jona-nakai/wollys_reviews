import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { SANDWICHES } from "../constants/sandwiches";
import { useAuth } from "../context/AuthContext";
import { fetchCachedPredictions, recomputePredictions } from "../services/predictions";
import SandwichRow from "../components/SandwichRow";
import NotificationBell from "../components/NotificationBell";
import styles from "./RatingsPage.module.css";

const ALL_ITEMS = Object.values(SANDWICHES).flatMap(cat => Object.entries(cat.items));
const CATEGORY_KEYS = Object.keys(SANDWICHES);
const ALL_COUNT = ALL_ITEMS.length;

const SORTS = [
  { key: "avgDesc",      label: "Avg rating ↓" },
  { key: "avgAsc",       label: "Avg rating ↑" },
  { key: "predDesc",     label: "Predicted ↓" },
  { key: "predAsc",      label: "Predicted ↑" },
  { key: "myDesc",       label: "My rating ↓" },
  { key: "myAsc",        label: "My rating ↑" },
  { key: "alpha",        label: "Alphabetical" },
];

export default function RatingsPage({
  ratingsState,
  username,
  notifications,
  unreadCount,
  onMarkAllRead,
  onFollowBack,
  followingIds,
  onOpenFriends,
}) {
  const { user } = useAuth();
  const {
    ratings, saved, communityRatings, saving, unsaved, error,
    totalRated, loading, updateRating, saveRatings, loadCommunityRatings,
  } = ratingsState;

  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("avgDesc");
  const [toast, setToast]       = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // load all categories' community ratings up front since we now show everything
  useEffect(() => {
    CATEGORY_KEYS.forEach(loadCommunityRatings);
  }, [loadCommunityRatings]);

  // flip to loading as soon as a save begins so rows show ↻
  useEffect(() => {
    if (saving) setPredictionsLoading(true);
  }, [saving]);

  const savedCount = useMemo(
    () => Object.values(saved || {}).filter(Boolean).length,
    [saved]
  );
  const hasSavedRatings = savedCount > 0;

  // One-time bootstrap after the user's ratings load. Read the precomputed
  // predictions doc from Firestore (1 read). If it doesn't exist yet but the
  // user has saved ratings, trigger a server recompute to populate it.
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (!user) return;
    if (loading) return;                 // wait for saved to load
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    let cancelled = false;
    (async () => {
      setPredictionsLoading(true);
      try {
        const cached = await fetchCachedPredictions(user.uid);
        if (cancelled) return;
        if (cached) {
          setPredictions(cached.predictions);
        } else if (hasSavedRatings) {
          const result = await recomputePredictions(user.uid);
          if (!cancelled) setPredictions(result.predictions);
        } else {
          setPredictions({});
        }
      } catch {
        if (!cancelled) setPredictions({});
      } finally {
        if (!cancelled) setPredictionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading, hasSavedRatings]);

  // Refresh predictions from the server and update the cached Firestore doc.
  // Called explicitly after the user saves ratings.
  const refreshPredictions = useCallback(async () => {
    if (!user) return;
    setPredictionsLoading(true);
    try {
      const result = await recomputePredictions(user.uid);
      setPredictions(result.predictions);
    } catch {
      setPredictions({});
    } finally {
      setPredictionsLoading(false);
    }
  }, [user]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, []);

  async function handleSave() {
    await saveRatings();
    showToast("Saved! Go Huskies 🐾");
    refreshPredictions();
  }

  const progress = Math.round((totalRated / ALL_COUNT) * 100);

  const visible = useMemo(() => {
    let entries = ALL_ITEMS;

    if (search.trim()) {
      const s = search.toLowerCase();
      entries = entries.filter(([, name]) => name.toLowerCase().includes(s));
    }

    const sorted = [...entries];
    switch (sortBy) {
      case "alpha":
        sorted.sort(([, a], [, b]) => a.localeCompare(b));
        break;
      case "avgDesc":
        sorted.sort(([idA], [idB]) => {
          const a = communityRatings[idA] ? parseFloat(communityRatings[idA].avg) : null;
          const b = communityRatings[idB] ? parseFloat(communityRatings[idB].avg) : null;
          if (a == null && b == null) return 0;
          if (a == null) return 1;
          if (b == null) return -1;
          return b - a;
        });
        break;
      case "avgAsc":
        sorted.sort(([idA], [idB]) => {
          const a = communityRatings[idA] ? parseFloat(communityRatings[idA].avg) : null;
          const b = communityRatings[idB] ? parseFloat(communityRatings[idB].avg) : null;
          if (a == null && b == null) return 0;
          if (a == null) return 1;
          if (b == null) return -1;
          return a - b;
        });
        break;
      case "myDesc":
        sorted.sort(([idA], [idB]) => (ratings[idB] || 0) - (ratings[idA] || 0));
        break;
      case "myAsc":
        // unrated (0) at the bottom
        sorted.sort(([idA], [idB]) => {
          const a = ratings[idA] || Infinity;
          const b = ratings[idB] || Infinity;
          return a - b;
        });
        break;
      case "predDesc":
        sorted.sort(([idA], [idB]) => {
          const a = predictions[idA];
          const b = predictions[idB];
          if (a == null && b == null) return 0;
          if (a == null) return 1;
          if (b == null) return -1;
          return b - a;
        });
        break;
      case "predAsc":
        sorted.sort(([idA], [idB]) => {
          const a = predictions[idA];
          const b = predictions[idB];
          if (a == null && b == null) return 0;
          if (a == null) return 1;
          if (b == null) return -1;
          return a - b;
        });
        break;
    }

    return sorted;
  }, [search, sortBy, ratings, predictions, communityRatings]);

  return (
    <div className={styles.page}>

      {toast && <div className={styles.toast}>{toast}</div>}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.firstName}>@{username}</span>
        </div>
        <span className={styles.headerTitle}>Wolly ML</span>
        <div className={styles.headerRight}>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
            onFollowBack={onFollowBack}
            followingIds={followingIds}
          />

          <button className={`${styles.friendsBtn} ${styles.desktopOnly}`} onClick={onOpenFriends}>
            Friends
          </button>
          <button className={`${styles.signOutBtn} ${styles.desktopOnly}`} onClick={() => signOut(auth)}>
            Sign out
          </button>

          <div className={`${styles.menuWrap} ${styles.mobileOnly}`} ref={menuRef}>
            <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)}>
              ☰
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <button className={styles.dropItem} onClick={() => { onOpenFriends(); setMenuOpen(false); }}>
                  👥 Friends
                </button>
                <button className={styles.dropItem} onClick={() => signOut(auth)}>
                  ↪ Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.progressSection}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressLabel}>{totalRated} / {ALL_COUNT} rated</span>
        </div>
        <p className={styles.engineLabel}>ML Recommendation Engine · Khoury College</p>

        {!hasSavedRatings && !loading && (
          <div className={styles.infoBanner}>
            Rate some sandwiches to unlock your personalized predictions 🥪
          </div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.controlsRow}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder="Search the menu…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORTS.map(s => (
              <option key={s.key} value={s.key}>Sort: {s.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.loadingWrap}>
              <div className={styles.spinner} />
            </div>
          ) : visible.length === 0 ? (
            <div className={styles.empty}>Nothing found for "{search}"</div>
          ) : (
            visible.map(([id, name], i) => (
              <SandwichRow
                key={id}
                id={id}
                name={name}
                myRating={ratings[id] || 0}
                communityR={communityRatings[id]}
                predicted={predictions[id]}
                predictionsLoading={predictionsLoading}
                isSaved={!!saved?.[id]}
                isLast={i === visible.length - 1}
                onChange={updateRating}
              />
            ))
          )}
        </div>
      </main>

      <footer className={styles.saveBar}>
        <div className={styles.saveBarInner}>
          <span className={styles.saveStatus}>
            {unsaved
              ? <span className={styles.unsavedText}>Unsaved changes</span>
              : totalRated > 0 && <span className={styles.savedText}>All ratings saved ✓</span>
            }
          </span>
          <button
            className={`${styles.saveBtn} ${unsaved ? styles.saveBtnActive : ""}`}
            onClick={handleSave}
            disabled={!unsaved || saving}
          >
            {saving ? "Saving…" : "Save ratings"}
          </button>
        </div>
      </footer>
    </div>
  );
}
