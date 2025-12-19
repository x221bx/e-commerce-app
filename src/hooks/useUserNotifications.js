import { useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../services/firebase";

const toMillis = (value) => {
  if (!value) return Date.now();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return Date.now();
};

export function useUserNotifications(uid) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const notificationsQuery = query(collection(db, "notifications"), where("uid", "==", uid));

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const docs = snapshot.docs
          .map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            timestamp: toMillis(docSnapshot.data().createdAt),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Notifications error:", err);
        setError("Failed to load notifications");
        setLoading(false);
      }
    );

    unsubRef.current = unsubscribe;
    return () => unsubscribe();
  }, [uid]);

  const markRead = async (id) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead(n.id)));
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
  };
}
