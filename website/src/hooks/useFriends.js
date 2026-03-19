import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection, query, where, getDocs,
  doc, setDoc, deleteDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";

export function useFriends(user, username, createFollowNotification) {
  const [friends,       setFriends]       = useState([]);
  const [friendRatings, setFriendRatings] = useState({});
  const [loading,       setLoading]       = useState(false);
  const [searching,     setSearching]     = useState(false);
  const [error,         setError]         = useState(null);
  const [searchResult,  setSearchResult]  = useState(null);

  // Ref-based cache guard — avoids stale closure issues on friendRatings state
  const loadedUids = useRef(new Set());

  // ── Load current user's friends list
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "friends"), where("followerId", "==", user.uid))
        );
        if (cancelled) return;
        setFriends(snap.docs.map(d => d.data().following));
      } catch {
        if (!cancelled) setError("Failed to load friends.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  // Search by username
  const searchByUsername = useCallback(async (handle) => {
    const cleaned = handle.trim().toLowerCase().replace(/^@/, "");
    if (!cleaned) return;
    setSearching(true);
    setSearchResult(null);
    setError(null);
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("username", "==", cleaned))
      );
      if (snap.empty) {
        setSearchResult("not_found");
      } else {
        const data = snap.docs[0].data();
        if (data.uid === user.uid) {
          setSearchResult("self");
        } else if (friends.some(f => f.uid === data.uid)) {
          setSearchResult("already_following");
        } else {
          setSearchResult(data);
        }
      }
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }, [user, friends]);

  // Follow a user + fire notification
  const followUser = useCallback(async (targetUser) => {
    if (!user) return;
    try {
      const following = {
        uid:      targetUser.uid,
        username: targetUser.username ?? "",
        email:    targetUser.email    ?? "",
        photoURL: targetUser.photoURL ?? "",
      };
      await setDoc(doc(db, "friends", `${user.uid}_${targetUser.uid}`), {
        followerId: user.uid,
        following,
        createdAt:  new Date().toISOString(),
      });
      await createFollowNotification(
        {
          uid:      user.uid,
          username: username ?? "",
          photoURL: user.photoURL ?? "",
          email:    user.email    ?? "",
        },
        targetUser.uid
      );
      setFriends(prev => [...prev, following]);
      setSearchResult(null);
    } catch {
      setError("Failed to follow. Please try again.");
    }
  }, [user, username, createFollowNotification]);

  // Unfollow a user
  const unfollowUser = useCallback(async (targetUid) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "friends", `${user.uid}_${targetUid}`));
      setFriends(prev => prev.filter(f => f.uid !== targetUid));
      setFriendRatings(prev => {
        const next = { ...prev };
        delete next[targetUid];
        return next;
      });
      loadedUids.current.delete(targetUid);
    } catch {
      setError("Failed to unfollow. Please try again.");
    }
  }, [user]);

  // Load a specific friend's ratings 
  // Uses a ref-based Set to guard against duplicate fetches across renders
  const loadFriendRatings = useCallback(async (friendUid) => {
    if (loadedUids.current.has(friendUid)) return;
    loadedUids.current.add(friendUid);

    try {
      const snap = await getDocs(
        query(collection(db, "ratings"), where("userId", "==", friendUid))
      );
      const sorted = snap.docs
        .map(d => ({
          sandwichId: d.data().sandwichId,
          taste:      d.data().taste,
          updatedAt:  d.data().updatedAt?.seconds ?? 0,
        }))
        .filter(r => r.taste > 0)
        .sort((a, b) => b.updatedAt - a.updatedAt);

      const loaded = {};
      sorted.forEach(r => {
        loaded[r.sandwichId] = { taste: r.taste, updatedAt: r.updatedAt };
      });
      setFriendRatings(prev => ({ ...prev, [friendUid]: loaded }));
    } catch {
      loadedUids.current.delete(friendUid); // allow retry on error
      setError("Failed to load friend's ratings.");
    }
  }, []); // no dependencies needed — ref is stable

  const followingIds = friends.map(f => f.uid);

  return {
    friends, friendRatings, loading, searching, error, searchResult, followingIds,
    searchByUsername, followUser, unfollowUser, loadFriendRatings,
    clearSearch: () => setSearchResult(null),
    clearError:  () => setError(null),
  };
}