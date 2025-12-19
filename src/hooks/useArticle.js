import { useEffect, useState } from "react";
import { subscribeToArticle, fetchArticleBySlug } from "../services/articlesService";

export const useArticle = (slugOrId) => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slugOrId) return;

    let unsub = null;
    let active = true;
    setLoading(true);
    setNotFound(false);

    fetchArticleBySlug(slugOrId)
      .then((doc) => {
        if (!active) return;

        if (!doc) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        unsub = subscribeToArticle(doc.id, (snap) => {
          if (!snap.exists()) {
            setNotFound(true);
            setArticle(null);
          } else {
            setArticle({ id: snap.id, ...snap.data() });
          }
          setLoading(false);
        });
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [slugOrId]);

  return { article, loading, notFound };
};
