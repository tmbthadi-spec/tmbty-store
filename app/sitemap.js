import { getPublishedProducts } from "../lib/supabase";

export default async function sitemap() {
  const products = await getPublishedProducts();
  const base = "https://tmbty.com";
  const fixed = [
    {url:base,lastModified:new Date(),changeFrequency:"daily",priority:1},
    ...["Handbags","Outfits","Accessories"].map(c=>({
      url:`${base}/category/${encodeURIComponent(c)}`,
      lastModified:new Date(),
      changeFrequency:"daily",
      priority:.8
    }))
  ];
  return [
    ...fixed,
    ...products.map(p=>({
      url:`${base}/products/${p.slug}`,
      lastModified:new Date(p.created_at||Date.now()),
      changeFrequency:"weekly",
      priority:.7
    }))
  ];
}