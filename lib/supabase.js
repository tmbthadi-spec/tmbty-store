const SUPABASE_URL = "https://dchbrrnywealudwripwq.supabase.co";
const SUPABASE_KEY = "sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";

async function rest(path, params = "") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    },
    cache: "no-store"
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
  return rest("tmbty_products", `?select=id,slug,title,description,category,subcategory,retail_price,images,reviews,rating,seo_keywords&status=eq.published&category=eq.${encodeURIComponent(category)}&order=created_at.desc`);
}

export async function getProductsBySubcategory(category, subcategory) {
  return rest("tmbty_products", `?select=id,slug,title,description,category,subcategory,retail_price,images,reviews,rating,seo_keywords&status=eq.published&category=eq.${encodeURIComponent(category)}&subcategory=eq.${encodeURIComponent(subcategory)}&order=created_at.desc`);
}

export async function getRelatedProducts(id, category, subcategory, limit = 8) {
  const base = "?select=id,slug,title,category,subcategory,retail_price,images,reviews,rating&status=eq.published";
  const sameSub = subcategory
    ? await rest("tmbty_products", `${base}&id=neq.${encodeURIComponent(id)}&subcategory=eq.${encodeURIComponent(subcategory)}&limit=${limit}`)
    : [];
  if (sameSub.length >= limit) return sameSub.slice(0,limit);

  const seen = new Set(sameSub.map(x=>x.id));
  const sameCat = category
    ? await rest("tmbty_products", `${base}&id=neq.${encodeURIComponent(id)}&category=eq.${encodeURIComponent(category)}&limit=${limit*2}`)
    : [];
  const merged = [...sameSub];
  for (const item of sameCat) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
    if (merged.length >= limit) break;
  }

  if (merged.length < limit) {
    const latest = await rest("tmbty_products", `${base}&id=neq.${encodeURIComponent(id)}&order=created_at.desc&limit=${limit*2}`);
    for (const item of latest) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
      if (merged.length >= limit) break;
    }
  }
  return merged.slice(0,limit);
}

export { SUPABASE_URL, SUPABASE_KEY };