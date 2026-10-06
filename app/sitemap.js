import { getPublishedProducts } from "../lib/supabase";

const CATEGORIES = {
  "Tea & Coffee": ["Tea Set","Coffee Set","Cup & Saucer","Mug","Teapot"],
  "Dinnerware": ["Dinnerware Set","Plate","Bowl","Serving Set"],
  "Kitchen Storage": ["Canister Set","Storage Jar","Organizer"],
  "Kitchenware": ["Serving Tray","Cake Stand","Kitchen Accessory"],
  "Home Decor": ["Table Decor","Decorative Accent"]
};

export default async function sitemap() {
  const products = await getPublishedProducts();
  const base = "https://tmbty.com";
  const now = new Date();

  const fixed = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...Object.entries(CATEGORIES).flatMap(([category, subcategories]) => [
      {
        url: `${base}/category/${encodeURIComponent(category)}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9
      },
      ...subcategories.map(subcategory => ({
        url: `${base}/category/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8
      }))
    ])
  ];

  return [
    ...fixed,
    ...products.map(p => ({
      url: `${base}/products/${p.slug}`,
      lastModified: new Date(p.updated_at || p.created_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.7
    }))
  ];
}
