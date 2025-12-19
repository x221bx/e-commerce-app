import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

export const useUserFavoriteIds = (userId) => {
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    if (!userId) {
      setFavoriteIds([]);
      return () => {};
    }
    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      setFavoriteIds(snapshot.data()?.favoriteArticles || []);
    });
    return () => unsubscribe();
  }, [userId]);

  return favoriteIds;
};

export default useUserFavoriteIds;
