import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { fetchArticlesByIds } from "../services/articlesService";

export const useUserFavoriteArticles = (userId, { locale = "en" } = {}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setArticles([]);
      setLoading(false);
      return () => {};
    }
    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      const favIds = snapshot.data()?.favoriteArticles || [];
      if (!favIds.length) {
        setArticles([]);
        setLoading(false);
        return;
      }
      const fetched = await fetchArticlesByIds(favIds, locale);
      setArticles(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [locale, userId]);

  return { articles, loading };
};

export default useUserFavoriteArticles;
