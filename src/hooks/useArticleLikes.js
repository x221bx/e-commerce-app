import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addArticleLike,
  addArticleDislike,
  removeArticleLike,
  removeArticleDislike,
} from "../services/articlesService";

const likedKey = (uid) => `likedArticles_${uid}`;
const dislikedKey = (uid) => `dislikedArticles_${uid}`;

const useArticleLikes = (articleId, currentUserId) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!articleId || !currentUserId) {
        setIsLiked(false);
        setIsDisliked(false);
        return;
      }
      try {
        const liked = JSON.parse((await AsyncStorage.getItem(likedKey(currentUserId))) || "[]");
        const disliked = JSON.parse((await AsyncStorage.getItem(dislikedKey(currentUserId))) || "[]");
        setIsLiked(liked.includes(articleId));
        setIsDisliked(disliked.includes(articleId));
      } catch (e) {
        console.warn("load likes error", e);
      }
    };

    load();
  }, [articleId, currentUserId]);

  const updateStorage = async (likedArr, dislikedArr) => {
    if (!currentUserId) return;
    await AsyncStorage.setItem(likedKey(currentUserId), JSON.stringify(likedArr));
    await AsyncStorage.setItem(dislikedKey(currentUserId), JSON.stringify(dislikedArr));
  };

  const handleLike = async () => {
    if (!articleId || !currentUserId || loading) return;
    setLoading(true);
    try {
      const liked = JSON.parse((await AsyncStorage.getItem(likedKey(currentUserId))) || "[]");
      const disliked = JSON.parse((await AsyncStorage.getItem(dislikedKey(currentUserId))) || "[]");

      if (isLiked) {
        await removeArticleLike(currentUserId, articleId);
        const newLiked = liked.filter((id) => id !== articleId);
        await updateStorage(newLiked, disliked);
        setIsLiked(false);
      } else {
        await addArticleLike(currentUserId, articleId);
        const newLiked = [...liked.filter((id) => id !== articleId), articleId];
        const newDisliked = disliked.filter((id) => id !== articleId);
        await updateStorage(newLiked, newDisliked);
        setIsLiked(true);
        setIsDisliked(false);
      }
    } catch (error) {
      console.error("Error handling like:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!articleId || !currentUserId || loading) return;
    setLoading(true);
    try {
      const liked = JSON.parse((await AsyncStorage.getItem(likedKey(currentUserId))) || "[]");
      const disliked = JSON.parse((await AsyncStorage.getItem(dislikedKey(currentUserId))) || "[]");

      if (isDisliked) {
        await removeArticleDislike(currentUserId, articleId);
        const newDisliked = disliked.filter((id) => id !== articleId);
        await updateStorage(liked, newDisliked);
        setIsDisliked(false);
      } else {
        await addArticleDislike(currentUserId, articleId);
        const newDisliked = [...disliked.filter((id) => id !== articleId), articleId];
        const newLiked = liked.filter((id) => id !== articleId);
        await updateStorage(newLiked, newDisliked);
        setIsDisliked(true);
        setIsLiked(false);
      }
    } catch (error) {
      console.error("Error handling dislike:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isLiked,
    isDisliked,
    handleLike,
    handleDislike,
    canInteract: !!currentUserId,
    loading,
  };
};

export default useArticleLikes;
