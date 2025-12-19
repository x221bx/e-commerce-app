// src/hooks/useAIProductSearch.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { getLocalizedDescription, getLocalizedName } from "../utils/productLocalization";

function normalizeArabic(text = "") {
  return text
    .toLowerCase()
    // remove Arabic diacritics
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "")
    // keep Arabic, Latin, digits, and spaces
    .replace(/[^\u0600-\u06FF0-9a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a = "", b = "") {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(word, target) {
  if (!word || !target) return false;
  if (target.includes(word)) return true;
  if (word.length <= 3) return false;
  return levenshtein(word, target) <= 2;
}

export async function aiSearchProducts({ keyword, intent = {} }) {
  const snap = await getDocs(collection(db, "products"));

  const all = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  let kw = normalizeArabic(keyword || "");
  if (!kw) return [];

  const kwWords = kw.split(" ").filter((w) => w.length > 1);

  const extraWords = [];
  if (intent.crop) extraWords.push(normalizeArabic(intent.crop));
  if (intent.product_type) extraWords.push(normalizeArabic(intent.product_type));
  if (intent.problem) extraWords.push(normalizeArabic(intent.problem));
  if (intent.goal) extraWords.push(normalizeArabic(intent.goal));

  const intentWords = extraWords
    .join(" ")
    .split(" ")
    .filter((w) => w.length > 1);

  const allWords = [...kwWords, ...intentWords];
  if (!allWords.length) return [];

  const scored = all
    .map((p) => {
      // Pull localized fields if present
      const localizedNameAr = normalizeArabic(getLocalizedName(p, "ar"));
      const localizedNameEn = normalizeArabic(getLocalizedName(p, "en"));
      const localizedDescAr = normalizeArabic(getLocalizedDescription(p, "ar"));
      const localizedDescEn = normalizeArabic(getLocalizedDescription(p, "en"));

      // Raw fields (handle common naming variants)
      const title = normalizeArabic(
        p.titleAr ||
          p.title_ar ||
          p.titleEn ||
          p.title_en ||
          p.title ||
          p.nameAr ||
          p.name_ar ||
          p.nameEn ||
          p.name_en ||
          p.name_lc ||
          p.name ||
          ""
      );
      const desc = normalizeArabic(
        p.descriptionAr ||
          p.description_ar ||
          p.descriptionEn ||
          p.description_en ||
          p.description ||
          ""
      );
      const category = normalizeArabic(p.categoryName || p.categoryId || p.category || "");
      const tag = normalizeArabic(p.tag || p.tags?.join?.(" ") || "");

      const combined = `${title} ${desc} ${category} ${tag} ${localizedNameAr} ${localizedNameEn} ${localizedDescAr} ${localizedDescEn}`.trim();
      if (!combined) return null;

      let score = 0;
      for (const w of allWords) {
        if (!w) continue;
        if (combined.includes(w)) score += 3;
        else if (fuzzyMatch(w, combined)) score += 1.5;
      }
      for (const w of kwWords) {
        if (title.includes(w) || localizedNameAr.includes(w) || localizedNameEn.includes(w)) score += 2;
      }
      if (intent?.product_type) {
        const pt = normalizeArabic(intent.product_type);
        if (pt && (title.includes(pt) || combined.includes(pt))) score += 2;
      }
      if (score <= 0) return null;
      return { product: p, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.product);
}
