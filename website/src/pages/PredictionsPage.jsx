import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { SANDWICHES } from "../constants/sandwiches";
import { fetchPredictions } from "../services/predictions";
import styles from "./PredictionsPage.module.css";

const SANDWICH_NAMES = Object.values(SANDWICHES).reduce((acc, cat) => {
  for (const [id, name] of Object.entries(cat.items)) acc[id] = name;
  return acc;
}, {});

export default function PredictionsPage({ onBack }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState(null);
  const [noRatings,   setNoRatings]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPredictions(user.uid)
      .then(({ predictions, noRatings }) => {
        if (cancelled) return;
        setPredictions(predictions);
        setNoRatings(noRatings);
      })
      .catch(()   => { if (!cancelled) setError("Couldn't load predictions. Please try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user]);

  const ranked = useMemo(() => {
    if (!predictions) return [];
    return Object.entries(predictions)
      .filter(([id]) => SANDWICH_NAMES[id])
      .sort(([, a], [, b]) => b - a);
  }, [predictions]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.headerTitle}>Try Next</span>
        <div style={{ minWidth: 80 }} />
      </header>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.centerWrap}>
            <p className={styles.muted}>Predicting your next favorite sandwich…</p>
          </div>
        ) : error ? (
          <div className={styles.centerWrap}>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : noRatings ? (
          <div className={styles.centerWrap}>
            <p className={styles.icon}>⭐</p>
            <h1 className={styles.title}>Rate some sandwiches first</h1>
            <p className={styles.body}>
              Wolly needs a few of your ratings before predicting what you'll like next.
            </p>
          </div>
        ) : ranked.length === 0 ? (
          <div className={styles.centerWrap}>
            <p className={styles.icon}>🥪</p>
            <h1 className={styles.title}>You've rated every sandwich!</h1>
            <p className={styles.body}>
              Wolly is impressed. Check back when the menu grows.
            </p>
          </div>
        ) : (
          <div className={styles.listWrap}>
            <p className={styles.engineLabel}>
              Ranked by predicted rating · CF + Bayesian
            </p>
            <ol className={styles.list}>
              {ranked.map(([id, score], i) => (
                <li key={id} className={styles.row}>
                  <span className={styles.rank}>{i + 1}</span>
                  <span className={styles.name}>{SANDWICH_NAMES[id]}</span>
                  <span className={styles.score}>{score.toFixed(2)} ★</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
