const SUPABASE_URL = "https://dchbrrnywealudwripwq.supabase.co";
const SUPABASE_KEY = "sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";

async function rest(path, params = "") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    },
    next: { revalidate: 300 }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getPublishedProducts() {
  return rest("tmbty_products", "?select=id,slug,title,description,meta_description,category,subcategory,retail_price,images,video_url,reviews,rating,seo_keywords,created_at&status=eq.published&order=created_at.desc");
}

export async function getProductBySlug(slug) {
  const rows = await rest("tmbty_products", `?select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0] || null;
}

export async function getProductsByCategory(category) {
  return rest("tmbty_products", `?select=id,slug,title,description,category,subcategory,retail_price,images,rating,seo_keywords&status=eq.published&category=eq.${encodeURIComponent(category)}&order=created_at.desc`);
}

export { SUPABASE_URL, SUPABASE_KEY };