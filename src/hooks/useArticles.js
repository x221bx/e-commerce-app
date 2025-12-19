import { useEffect, useState } from "react";
import { subscribeToArticles } from "../services/articlesService";

export const useArticles = (options) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToArticles(options || {}, (records) => {
      setArticles(records);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [options?.featureHome, options?.featureAccount]);

  return { articles, loading };
};

export default useArticles;
