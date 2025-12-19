const normalizeLang = (lng) => (lng || "en").split("-")[0];

const pickFirstString = (values) => values.find((v) => typeof v === "string" && v.trim());

const localizedValue = (product, langKey, fields, fallbacks = []) => {
  if (!product) return "";
  const upper = langKey.toUpperCase();
  const titleCase = langKey.charAt(0).toUpperCase() + langKey.slice(1);
  const translations = product.translations?.[langKey] || {};

  const candidates = [
    ...fields.map((f) => translations?.[f]),
    ...fields.map((f) => product?.[`${f}_${langKey}`]),
    ...fields.map((f) => product?.[`${f}${upper}`]),
    ...fields.map((f) => product?.[`${f}${titleCase}`]),
    ...fallbacks,
  ];

  return pickFirstString(candidates) || "";
};

export const getLangKey = (lng) => normalizeLang(lng);

export const getLocalizedName = (product, lng) => {
  const langKey = normalizeLang(lng);
  return (
    localizedValue(product, langKey, ["name", "title", "label"], [
      product?.name,
      product?.title,
      product?.label,
      product?.productName,
      product?.sku,
    ]) || "Product"
  );
};

export const getLocalizedDescription = (product, lng) => {
  const langKey = normalizeLang(lng);
  return (
    localizedValue(product, langKey, ["description", "summary", "details", "body"], [
      product?.description,
      product?.summary,
      product?.details,
      product?.body,
    ]) || ""
  );
};
