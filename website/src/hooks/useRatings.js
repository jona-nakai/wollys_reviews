import { useState, useCallback, useEffect } from "react";
import {
  collection, query, where, getDocs,
  serverTimestamp, doc, setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { SANDWICHES } from "../constants/sandwiches";

// Firestore "in" queries are capped at 30 items per call
const BATCH_SIZE = 30;

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

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

  // Load community ratings for a category (batched)
  const loadCommunityRatings = useCallback(async (category) => {
    const ids = Object.keys(SANDWICHES[category].items);
    const result = {};

    try {
      await Promise.all(
        chunkArray(ids, BATCH_SIZE).map(async chunk => {
          const snap = await getDocs(
            query(collection(db, "ratings"), where("sandwichId", "in", chunk))
          );
          snap.forEach(d => {
            const { sandwichId, taste } = d.data();
            if (!taste) return;
            if (!result[sandwichId]) result[sandwichId] = { sum: 0, count: 0 };
            result[sandwichId].sum   += taste;
            result[sandwichId].count += 1;
          });
        })
      );

      const formatted = {};
      for (const [id, { sum, count }] of Object.entries(result)) {
        formatted[id] = { avg: (sum / count).toFixed(1), count };
      }
      setCommunityRatings(prev => ({ ...prev, ...formatted }));
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
        changed.map(([id, taste]) =>
          setDoc(doc(db, "ratings", `${user.uid}_${id}`), {
            userId:     user.uid,
            sandwichId: id,
            taste,
            updatedAt:  serverTimestamp(),
          })
        )
      );
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