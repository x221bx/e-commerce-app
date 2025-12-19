import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { aiSearchProducts } from "./useAIProductSearch";
import { getEnv } from "../utils/env";

const TOXIC = ["fuck", "shit", "suicide", "kill myself"];

const normalize = (t = "") =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const detectUserLang = (text) => (/[\u0600-\u06FF]/.test(text) ? "ar" : "en");

const detectIntent = (msg) => {
  const t = normalize(msg);

  const greet = ["hello", "hi", "hey", "مرحبا", "اهلا", "سلام"];
  if (greet.some((x) => t.includes(x))) return { type: "chat" };

  const priceKeywords = ["price", "between", "under", "less", "more", "range", "budget", "سعر", "اقل", "اقل من", "اكبر", "اكتر", "بين", "ميزانية"];
  if (priceKeywords.some((x) => t.includes(x))) return { type: "priceRange" };

  const rec = ["recommend", "suggest", "رشح", "اقترح", "تنصح", "اختار لي"];
  if (rec.some((w) => t.includes(w))) return { type: "recommend" };

  const items = ["product", "item", "seed", "seeds", "fertilizer", "pesticide", "search", "بذور", "سماد", "مبيد", "منتج", "منتجات", "شتلة", "زراعة"];
  if (items.some((w) => t.includes(w))) return { type: "search" };

  return { type: "chat" };
};

const extractPriceRange = (text) => {
  const t = normalize(text);
  const nums = t.match(/\d+/g);
  if (!nums) return null;
  if (nums.length === 1) {
    const value = Number(nums[0]);
    if (t.includes("under") || t.includes("below") || t.includes("اقل") || t.includes("اقل من")) return { min: 0, max: value };
    if (t.includes("above") || t.includes("more") || t.includes("اكبر") || t.includes("اكتر")) return { min: value, max: Infinity };
  }
  if (nums.length >= 2) {
    const a = Number(nums[0]);
    const b = Number(nums[1]);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  return null;
};

const fmtContextLine = (p) =>
  `- id:${p.id} | title:${p.titleAr || p.title || p.name || ""} | tag:${p.tag || ""} | price:${p.price ?? ""} | desc:${(p.descriptionAr || p.description || "").slice(0, 180)}`;

const buildCards = (items) => items.map((p) => `<productcard id="${p.id}"></productcard>`).join("\n");

const sanitizeText = (val) => {
  if (typeof val !== "string") return val;
  return val
    .replace(/\[respond in [^\]]+\]\s*/gi, "")
    .replace(/\[.*respond.*?\]/gi, "")
    .replace(/respond in (arabic|english)[:\s]*/gi, "")
    .trim();
};

export function useAIChat() {
  const [messages, setMessages] = useState([]);

  const API_KEY = getEnv(["EXPO_PUBLIC_OR_KEY", "EXPO_PUBLIC_OPENAI_KEY"]);
  const hasApi = Boolean(API_KEY);

  const update = (id, content) => {
    const clean = sanitizeText(content);
    setMessages((p) => p.map((m) => (m.id === id ? { ...m, content: clean } : m)));
  };

  const loadAllProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  const searchByKeywords = async (raw, intent) => {
    const words = normalize(raw)
      .split(" ")
      .filter((w) => w.length > 1);

    // Primary search with full query
    const viaHook = await aiSearchProducts({ keyword: raw, intent });

    // Also per-word to catch single-token hits
    for (const w of words) {
      const r = await aiSearchProducts({ keyword: w, intent });
      r.forEach((p) => {
        if (!viaHook.find((x) => x.id === p.id)) viaHook.push(p);
      });
    }

    // Fallback fuzzy scan over all products to recover from typos
    const allProducts = await loadAllProducts();
    const fuzzyMatch = (term = "", target = "") => {
      if (!term || !target) return false;
      const t = term.toLowerCase();
      const tgt = target.toLowerCase();
      if (tgt.includes(t)) return true;
      if (t.length <= 3) return false;
      let mismatches = 0;
      let i = 0;
      let j = 0;
      while (i < t.length && j < tgt.length && mismatches <= 2) {
        if (t[i] === tgt[j]) {
          i++;
          j++;
        } else {
          mismatches++;
          if (t.length > tgt.length) {
            i++;
          } else if (t.length < tgt.length) {
            j++;
          } else {
            i++;
            j++;
          }
        }
      }
      return mismatches <= 2;
    };

    const fallback = [];
    for (const p of allProducts) {
      const blob = normalize(
        `${p.title || ""} ${p.titleAr || ""} ${p.title_ar || ""} ${p.name || ""} ${p.nameAr || ""} ${p.name_ar || ""} ${p.description || ""} ${p.descriptionAr || ""} ${p.description_ar || ""} ${p.categoryName || ""} ${p.category || ""} ${p.tag || ""} ${(p.tags || []).join(" ")}`
      );
      if (!blob) continue;
      if (words.some((w) => blob.includes(w) || fuzzyMatch(w, blob))) {
        if (!viaHook.find((x) => x.id === p.id) && !fallback.find((x) => x.id === p.id)) {
          fallback.push(p);
        }
      }
    }

    return [...viaHook, ...fallback];
  };

  const searchByPrice = async (min, max) => {
    const all = await loadAllProducts();
    return all.filter((p) => Number(p.price ?? 0) >= min && Number(p.price ?? 0) <= max);
  };

  const aiCall = async ({ userLang, msg, productContext }) => {
    const contextBlock = productContext?.length
      ? `Product context (use only these):\n${productContext.map(fmtContextLine).join("\n")}`
      : "";

    const system = `You are a helpful shopping assistant for V Shop. Reply in ${
      userLang === "ar" ? "Arabic" : "English"
    }. Be concise (<80 words), truthful, and avoid fake scores. If suggesting products, rely ONLY on provided context and include <productcard id="..."></productcard> tags for matches. If there is no product context, clearly say you have no matching products and do not invent any.`;

    if (!hasApi) {
      return userLang === "ar"
        ? "رجاء ضبط متغير EXPO_PUBLIC_OR_KEY أو EXPO_PUBLIC_OPENAI_KEY لتفعيل المساعد."
        : "Set EXPO_PUBLIC_OR_KEY or EXPO_PUBLIC_OPENAI_KEY to enable the AI assistant.";
    }

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "X-Title": "V Shop AI Chat",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            ...(contextBlock ? [{ role: "system", content: contextBlock }] : []),
            { role: "user", content: msg },
          ],
        }),
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || (userLang === "ar" ? "الخدمة غير متاحة الآن." : "AI is unavailable now.");
    } catch {
      return userLang === "ar" ? "الخدمة غير متاحة الآن." : "AI is unavailable now.";
    }
  };

  const localRecommend = (userLang, top) => {
    if (!top?.length) {
      return userLang === "ar" ? "لا توجد منتجات مطابقة." : "No matching products found.";
    }
    const intro =
      userLang === "ar"
        ? "وجدت هذه المنتجات في الكتالوج:"
        : "I found these products from your catalog:";
    return `${intro}\n${top.map((p) => `- ${p.name || p.title || p.id} (${p.price ?? ""} EGP)`).join("\n")}`;
  };

  const sendMessage = async (text) => {
    const msg = text.trim();
    if (!msg) return;
    if (TOXIC.some((w) => normalize(msg).includes(w))) {
      setMessages((p) => [
        ...p,
        { role: "user", content: sanitizeText(msg) },
        { role: "assistant", content: "Please keep messages respectful." },
      ]);
      return;
    }

    setMessages((p) => [...p, { role: "user", content: sanitizeText(msg) }]);
    const id = Date.now();
    setMessages((p) => [...p, { id, role: "assistant", content: "..." }]);

    const intent = detectIntent(msg);
    const userLang = detectUserLang(msg);

    if (intent.type === "chat") {
      update(id, await aiCall({ userLang, msg }));
      return;
    }

    if (intent.type === "priceRange") {
      const range = extractPriceRange(msg) || { min: 0, max: Infinity };
      const results = await searchByPrice(range.min, range.max);
      const top = results.slice(0, 3);
      if (!top.length) {
        update(id, userLang === "ar" ? "لا توجد منتجات في هذا السعر." : "No products found in that price range.");
        return;
      }
      const reply = hasApi ? await aiCall({ userLang, msg, productContext: top }) : localRecommend(userLang, top);
      update(id, `${sanitizeText(reply)}\n\n${buildCards(top)}`);
      return;
    }

    if (intent.type === "recommend") {
      const results = await searchByKeywords(msg, intent);
      const top = results.slice(0, 3);
      if (!top.length) {
        update(id, userLang === "ar" ? "لا توجد منتجات مطابقة." : "No products found for that request.");
        return;
      }
      const reply = hasApi ? await aiCall({ userLang, msg, productContext: top }) : localRecommend(userLang, top);
      update(id, `${sanitizeText(reply)}\n\n${buildCards(top)}`);
      return;
    }

    if (intent.type === "search") {
      const results = await searchByKeywords(msg, intent);
      if (!results.length) {
        update(id, userLang === "ar" ? "لم أجد منتجات مطابقة." : "No matching product found.");
        return;
      }
      const top = results.slice(0, 3);
      const reply = hasApi ? await aiCall({ userLang, msg, productContext: top }) : localRecommend(userLang, top);
      update(id, `${sanitizeText(reply)}\n\n${buildCards(top)}`);
      return;
    }
  };

  return { messages, sendMessage, setMessages };
}
