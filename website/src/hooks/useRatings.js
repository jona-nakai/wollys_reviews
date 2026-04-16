import { useState, useCallback, useEffect } from "react";
import {
  collection, query, where, getDocs, getDoc,
  serverTimestamp, doc, setDoc, deleteDoc, updateDoc, increment,
} from "firebase/firestore";
import { db } from "../services/firebase";

export function useRatings(user) {
  const [ratings,          setRatings]          = useState({});
  const [saved,            setSaved]            = useState({});
  const [communityRatings, setCommunityRatings] = useState({});
  const [loading,          setLoading]          = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState(null);

  // Load this user's ratings on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDocs(
          query(collection(db, "ratings"), where("userId", "==", user.uid))
        );
        if (cancelled) return;
        const loaded = {};
        snap.forEach(d => { loaded[d.data().sandwichId] = d.data().taste; });
        setSaved(loaded);
        setRatings(loaded);
      } catch {
        if (!cancelled) setError("Failed to load your ratings. Please refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  // Load community ratings from pre-aggregated doc (1 read)
  const loadCommunityRatings = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "community_stats", "all"));
      if (!snap.exists()) return;
      const data = snap.data();
      const formatted = {};
      for (const [id, { sum, count }] of Object.entries(data)) {
        if (count > 0) formatted[id] = { avg: (sum / count).toFixed(1), count };
      }
      setCommunityRatings(formatted);
    } catch (e) {
      console.error("Failed to load community ratings:", e);
    }
  }, []);

  // Update a single rating locally
  const updateRating = useCallback((id, val) => {
    setRatings(prev => ({ ...prev, [id]: val }));
  }, []);

  // Persist only changed ratings to Firestore
  const saveRatings = useCallback(async () => {
    if (!user) return;
    const changed = Object.entries(ratings).filter(([id, val]) => val !== saved[id]);
    if (!changed.length) return;

    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        changed.map(([id, taste]) => {
          const ref = doc(db, "ratings", `${user.uid}_${id}`);
          if (!taste) return deleteDoc(ref);
          return setDoc(ref, {
            userId:     user.uid,
            sandwichId: id,
            taste,
            updatedAt:  serverTimestamp(),
          });
        })
      );

      // Update aggregated community stats (1 write instead of re-reading all)
      const statsRef = doc(db, "community_stats", "all");
      const updates = {};
      for (const [id, newTaste] of changed) {
        const oldTaste = saved[id] || 0;
        if (newTaste && !oldTaste) {
          updates[`${id}.sum`] = increment(newTaste);
          updates[`${id}.count`] = increment(1);
        } else if (!newTaste && oldTaste) {
          updates[`${id}.sum`] = increment(-oldTaste);
          updates[`${id}.count`] = increment(-1);
        } else if (newTaste && oldTaste) {
          updates[`${id}.sum`] = increment(newTaste - oldTaste);
        }
      }
      if (Object.keys(updates).length) await updateDoc(statsRef, updates);

      setSaved({ ...ratings });
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [user, ratings, saved]);

  const unsaved    = Object.entries(ratings).some(([id, v]) => v !== saved[id]);
  const totalRated = Object.values(ratings).filter(Boolean).length;

  return {
    ratings,
    saved,
    communityRatings,
    loading,
    saving,
    error,
    unsaved,
    totalRated,
    updateRating,
    saveRatings,
    loadCommunityRatings,
  };
}