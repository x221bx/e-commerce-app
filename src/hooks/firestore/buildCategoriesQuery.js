import { collection, query, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase"; // adjust path

/**
 * Server-side sort only (createdAt + asc/desc).
 * We keep pagination on client.
 * (Optional: if you add a name_lc field later, you can enable server prefix search too.)
 */
export function buildCategoriesQuery({ dir = "desc" }) {
  const col = collection(db, "categories");
  return query(col, orderBy("createdAt", dir));
}
