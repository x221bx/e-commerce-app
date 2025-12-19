import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

const ARTICLES_COLLECTION = "articles";

export const subscribeToArticles = (options = {}, callback) => {
  const ref = collection(db, ARTICLES_COLLECTION);
  const { featureHome, featureAccount } = options;

  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      const now = Date.now();

      const records = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => {
          const statusVal = (a.status || a.state || a.visibility || "").toLowerCase();
          const isDraft = a.isDraft || statusVal === "draft";

          const publishAt = a.publishedAt || a.publishDate;
          const ts = publishAt ? new Date(publishAt).getTime() : 0;
          const scheduled = ts && ts > now;

          const featureHomeOk =
            featureHome === undefined ? true : !!a.featureHome === !!featureHome;
          const featureAccountOk =
            featureAccount === undefined ? true : !!a.featureAccount === !!featureAccount;
          const statusOk = statusVal === "published" || statusVal === "live";

          return !isDraft && !scheduled && statusOk && featureHomeOk && featureAccountOk;
        });

      callback(records);
    },
    () => callback([])
  );

  return unsubscribe;
};

export const subscribeToArticle = (slug, callback) => {
  if (!slug) return () => {};
  const ref = doc(db, ARTICLES_COLLECTION, slug);

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    () => callback(null)
  );
};

export const fetchArticleBySlug = async (slug) => {
  if (!slug) return null;
  const snap = await getDoc(doc(db, ARTICLES_COLLECTION, slug));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const incrementArticleView = async (articleId) => {
  if (!articleId) return;
  try {
    await updateDoc(doc(db, ARTICLES_COLLECTION, articleId), {
      views: increment(1),
    });
  } catch (e) {
    console.warn("incrementArticleView error", e);
  }
};

export const updateArticleReactions = async ({
  articleId,
  userId,
  like = false,
  dislike = false,
  likeDelta = 0,
  dislikeDelta = 0,
}) => {
  if (!articleId || !userId) return;

  const ref = doc(db, ARTICLES_COLLECTION, articleId);
  const fields = {};
  if (likeDelta) fields.likes = increment(likeDelta);
  if (dislikeDelta) fields.dislikes = increment(dislikeDelta);

  if (like) {
    fields.likesBy = arrayUnion(userId);
    fields.dislikesBy = arrayRemove(userId);
  } else if (dislike) {
    fields.dislikesBy = arrayUnion(userId);
    fields.likesBy = arrayRemove(userId);
  } else {
    fields.likesBy = arrayRemove(userId);
    fields.dislikesBy = arrayRemove(userId);
  }

  return updateDoc(ref, fields);
};

export const addArticleLike = (userId, articleId) =>
  updateDoc(doc(db, ARTICLES_COLLECTION, articleId), { likesBy: arrayUnion(userId) });
export const removeArticleLike = (userId, articleId) =>
  updateDoc(doc(db, ARTICLES_COLLECTION, articleId), { likesBy: arrayRemove(userId) });
export const addArticleDislike = (userId, articleId) =>
  updateDoc(doc(db, ARTICLES_COLLECTION, articleId), { dislikesBy: arrayUnion(userId) });
export const removeArticleDislike = (userId, articleId) =>
  updateDoc(doc(db, ARTICLES_COLLECTION, articleId), { dislikesBy: arrayRemove(userId) });

export const addArticleComment = async (articleId, userId, comment, userName) => {
  const ref = doc(db, ARTICLES_COLLECTION, articleId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Article not found");

  const newComment = {
    id: `${Date.now()}-${userId}`,
    userId,
    userName: userName || "User",
    comment,
    createdAt: new Date().toISOString(),
  };

  const existing = snap.data()?.comments || [];
  const next = [...existing, newComment];
  await setDoc(ref, { comments: next }, { merge: true });
  return newComment;
};
