import { getPublishedProducts } from "../lib/supabase";

const BASE = "https://migamart.com";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const products = await getPublishedProducts();
  const categories = new Map();
  for (const product of products) {
    if (!product.category) continue;
    if (!categories.has(product.category)) categories.set(product.category, new Set());
    if (product.subcategory) categories.get(product.category).add(product.subcategory);
  }

  const pages = [{ url: BASE, changeFrequency: "daily", priority: 1 }];
  for (const [category, subcategories] of categories) {
    pages.push({
      url: `${BASE}/category/${encodeURIComponent(category)}`,
      changeFrequency: "weekly",
      priority: 0.8
    });
    for (const subcategory of subcategories) {
      pages.push({
        url: `${BASE}/category/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}`,
        changeFrequency: "weekly",
        priority: 0.7
      });
    }
  }
  for (const product of products) {
    if (!product.slug) continue;
    const timestamp = product.updated_at || product.created_at;
    const modified = timestamp ? new Date(timestamp) : null;
    pages.push({
      url: `${BASE}/products/${encodeURIComponent(product.slug)}`,
      ...(modified && !Number.isNaN(modified.getTime()) ? { lastModified: modified } : {}),
      changeFrequency: "weekly",
      priority: 0.7
    });
  }
  return pages;
}
