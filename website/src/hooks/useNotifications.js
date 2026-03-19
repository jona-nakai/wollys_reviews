import { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  // Real-time listener on this user's notifications
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid)
    );

    const unsub = onSnapshot(q, snap => {
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length);
    }, err => {
      console.error("Notifications listener error:", err);
    });

    return () => unsub();
  }, [user]);

  // Mark all notifications as read
  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(
      unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }))
    );
  }, [notifications]);

  // Create a follow notification
  const createFollowNotification = useCallback(async (fromUser, toUid) => {
    try {
      await addDoc(collection(db, "notifications"), {
        type:         "follow",
        toUid,
        fromUid:      fromUser.uid,
        fromUsername: fromUser.username ?? "",
        fromPhoto:    fromUser.photoURL  ?? "",
        fromEmail:    fromUser.email     ?? "",
        read:         false,
        createdAt:    serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to create notification:", e);
    }
  }, []);

  return {
    notifications, unreadCount,
    markAllRead, createFollowNotification,
  };
}