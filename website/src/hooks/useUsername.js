import { useState, useEffect, useCallback } from "react";
import {
  doc, getDoc, setDoc,
  collection, query, where, getDocs,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { Filter } from "bad-words";

const filter = new Filter();

export function useUsername(user) {
  const [username,   setUsername]   = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loaded,     setLoaded]     = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!user) {
      // Reset everything when user signs out
      setUsername(null);
      setNeedsSetup(false);
      setLoaded(false);
      setError(null);
      return;
    }

    // Reset loaded immediately when user changes so we never
    // show the wrong page while Firestore is still being read
    setLoaded(false);
    setNeedsSetup(false);
    setUsername(null);

    let cancelled = false;

    async function load() {
      try {
        const ref  = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (cancelled) return;

        const data     = snap.exists() ? snap.data() : {};
        const existing = typeof data.username === "string" && data.username.trim().length > 0
          ? data.username
          : null;

        // Sync profile fields regardless — merge so username is never overwritten
        await setDoc(ref, {
          uid:      user.uid,
          email:    user.email.toLowerCase(),
          photoURL: user.photoURL ?? "",
        }, { merge: true });

        if (cancelled) return;

        if (existing) {
          setUsername(existing);
          setNeedsSetup(false);
        } else {
          setNeedsSetup(true);
        }
      } catch (e) {
        console.error("Failed to load username:", e);
        if (!cancelled) setNeedsSetup(false);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  // Check if a username is already taken
  const checkAvailability = useCallback(async (handle) => {
    if (!handle.trim()) return null;
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("username", "==", handle.toLowerCase()))
      );
      return snap.empty ? "available" : "taken";
    } catch {
      return null;
    }
  }, []);

  // Save chosen username
  const saveUsername = useCallback(async (handle) => {
    if (!user || !handle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (filter.isProfane(handle)) {
        setError("That username is not allowed. Please choose another.");
        return;
      }
      // Final availability check right before saving
      const snap = await getDocs(
        query(collection(db, "users"), where("username", "==", handle.toLowerCase()))
      );
      if (!snap.empty) {
        setError("That username was just taken. Please choose another.");
        return;
      }
      await setDoc(doc(db, "users", user.uid), {
        username: handle.toLowerCase(),
      }, { merge: true });
      setUsername(handle.toLowerCase());
      setNeedsSetup(false);
    } catch {
      setError("Failed to save username. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [user]);

  return { username, needsSetup, loaded, saving, error, checkAvailability, saveUsername };
}