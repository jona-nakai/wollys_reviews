import { useState, useCallback } from "react";
import {
  collection, query, where, getDocs,
  serverTimestamp, doc, setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { SANDWICHES } from "../constants/sandwiches";

export function useRatings(user) {
  const [ratings, setRatings] = useState({});
  const [saved,   setSaved]   = useState({});
  const [cr,      setCr]      = useState({});  // community ratings
  const [saving,  setSaving]  = useState(false);

  const loadUserRatings = useCallback(async (uid) => {
    const snap = await getDocs(
      query(collection(db, "ratings"), where("userId", "==", uid))
    );
    const loaded = {};
    snap.forEach(d => { loaded[d.data().sandwichId] = d.data().taste; });
    setSaved(loaded);
    setRatings(loaded);
  }, []);

  const loadCommunityRatings = useCallback(async (activeCategory) => {
    const items = Object.keys(SANDWICHES[activeCategory].items);
    const result = {};
    await Promise.all(items.map(async id => {
      const snap = await getDocs(
        query(collection(db, "ratings"), where("sandwichId", "==", id))
      );
      const scores = snap.docs.map(d => d.data().taste).filter(Boolean);
      if (scores.length) result[id] = {
        avg:   (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        count: scores.length,
      };
    }));
    setCr(result);
  }, []);

  const saveRatings = useCallback(async (activeCategory) => {
    if (!user) return;
    setSaving(true);
    for (const [id, taste] of Object.entries(ratings)) {
      if (taste === saved[id]) continue;
      await setDoc(doc(db, "ratings", `${user.uid}_${id}`), {
        userId:      user.uid,
        displayName: user.displayName,
        sandwichId:  id,
        taste,
        updatedAt:   serverTimestamp(),
      });
    }
    setSaved({ ...ratings });
    setSaving(false);
    await loadCommunityRatings(activeCategory);
  }, [user, ratings, saved, loadCommunityRatings]);

  const updateRating = useCallback((id, val) => {
    setRatings(r => ({ ...r, [id]: val }));
  }, []);

  const unsaved = Object.entries(ratings).some(([id, v]) => v !== saved[id]);

  return {
    ratings, saved, cr, saving, unsaved,
    loadUserRatings, loadCommunityRatings, saveRatings, updateRating,
  };
}