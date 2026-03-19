import { useState, useEffect, useMemo, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { SANDWICHES } from "../constants/sandwiches";
import { useAuth } from "../context/AuthContext";
import { useRatings } from "../hooks/useRatings";
import SandwichRow from "../components/SandwichRow";
import styles from "./RatingsPage.module.css";

const ALL_COUNT = Object.values(SANDWICHES)
  .reduce((sum, cat) => sum + Object.keys(cat.items).length, 0);

export default function RatingsPage() {
  const { user } = useAuth();
  const {
    ratings, communityRatings, saving, unsaved, error,
    totalRated, loading, updateRating, saveRatings, loadCommunityRatings,
  } = useRatings(user);

  const [activeCategory, setCategory] = useState("breakfast");
  const [search, setSearch]           = useState("");
  const [toast, setToast]             = useState(null);

  useEffect(() => {
    loadCommunityRatings(activeCategory);
  }, [activeCategory, loadCommunityRatings]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, []);

  async function handleSave() {
    await saveRatings();
    showToast("Saved! Go Huskies 🐾");
  }

  function handleTabChange(key) {
    setCategory(key);
    setSearch("");
  }

  const category = SANDWICHES[activeCategory];
  const progress = Math.round((totalRated / ALL_COUNT) * 100);

  const filtered = useMemo(() => {
    const entries = Object.entries(category.items);
    if (!search.trim()) return entries;
    const s = search.toLowerCase();
    return entries.filter(([, name]) => name.toLowerCase().includes(s));
  }, [category, search]);

  return (
    <div className={styles.page}>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src={user.photoURL} alt={user.displayName} className={styles.avatar} />
          <span className={styles.firstName}>{user.displayName?.split(" ")[0]}</span>
        </div>
        <span className={styles.headerTitle}>Wally's Reviews</span>
        <div className={styles.headerRight}>
          <button className={styles.signOutBtn} onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className={styles.main}>

        {/* Progress bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressLabel}>{totalRated} / {ALL_COUNT} rated</span>
        </div>
        <p className={styles.engineLabel}>ML Recommendation Engine · Khoury College</p>

        {/* Error banner */}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Category tabs */}
        <div className={styles.tabs}>
          {Object.entries(SANDWICHES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`${styles.tab} ${activeCategory === key ? styles.tabActive : ""}`}
            >{cat.label}</button>
          ))}
        </div>

        {/* Search row */}
        <div className={styles.searchRow}>
          <div className={styles.sectionLabel}>
            {category.label.replace(/^\S+\s*/, "")} Menu
          </div>
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
          <span className={styles.faveHint}>★ = Husky fave</span>
        </div>

        {/* Column headers */}
        <div className={styles.colHeaders}>
          <span>Item</span>
          <span>Your rating</span>
        </div>

        {/* Sandwich list */}
        <div className={styles.list}>
          {loading ? (
            <div className={styles.loadingWrap}>
              <div className={styles.spinner} />
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>Nothing found for "{search}"</div>
          ) : (
            filtered.map(([id, name], i) => (
              <SandwichRow
                key={id}
                id={id}
                name={name}
                myRating={ratings[id] || 0}
                communityR={communityRatings[id]}
                isSaved={!!ratings[id] && ratings[id] === ratings[id]}
                isLast={i === filtered.length - 1}
                onChange={updateRating}
              />
            ))
          )}
        </div>
      </main>

      {/* Save bar */}
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