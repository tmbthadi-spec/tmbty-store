import { SUPABASE_URL, SUPABASE_KEY } from "../../lib/supabase";

export const dynamic = "force-dynamic";

function inspect(product) {
  const issues = [];
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const images = Array.isArray(product.images) ? product.images : [];
  if (!images[0]) issues.push("Missing main product photo");
  if (!variants.length) issues.push("No saved options — verify whether supplier has choices");
  if (variants.length === 1) issues.push("Only one saved option — verify supplier choices");
  const seen = new Set();
  for (const v of variants) {
    const name = String(v?.name || "").trim();
    if (!name) issues.push("Blank option label");
    if (/^(?:\d(?:\.0)?|\+\d+|all ratings|sort by default)$/i.test(name)) issues.push("Possible imported junk: " + name);
    if (/^(?:[a-z]{1,2}|\d+(?:\.\d+)?)$/i.test(name)) issues.push("Ambiguous option label — compare with supplier: " + name);
    if (/^(?:\d+ml){2,}$/i.test(name) || /(?:<\d+ml){2,}/i.test(name)) issues.push("Repeated capacity label: " + name);
    if (name && seen.has(name.toLowerCase())) issues.push("Duplicate option: " + name);
    seen.add(name.toLowerCase());
    if (!v?.image && variants.length > 1) issues.push("Option needs image verification: " + name);
  }
  if (/^(mug|coffee set|plate|fruit mug)$/i.test(String(product.title || "").trim())) issues.push("Generic product title");
  return [...new Set(issues)];
}

export default async function CleanerPage() {
  let products = [];
  let error = "";
  try {
    const url = SUPABASE_URL + "/rest/v1/tmbty_products?select=id,slug,title,status,images,variants,source_product_id&status=eq.published&order=created_at.desc&limit=500";
    const response = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }, cache: "no-store" });
    if (!response.ok) throw new Error("Unable to read product catalog");
    products = await response.json();
  } catch (e) { error = e.message; }
  const flagged = products.map(p => ({ ...p, issues: inspect(p) })).filter(p => p.issues.length);
  const missingOptions = flagged.filter(p => p.issues.some(i => i.includes("saved option"))).length;
  const imageIssues = flagged.filter(p => p.issues.some(i => i.toLowerCase().includes("image") || i.toLowerCase().includes("photo"))).length;
  const suspiciousOptions = flagged.filter(p => p.issues.some(i => /junk|duplicate|repeated capacity|blank option|ambiguous option/i.test(i))).length;
  return <main style={{maxWidth:1050,margin:"40px auto",padding:"0 20px"}}>
    <h1>Product Cleaner — Safety Audit</h1>
    <p>Read-only checks. This page never deletes options, photos, products, or changes prices. Supplier verification is required before repairing missing options.</p>
    {error ? <p role="alert">{error}</p> : <>
      <p><strong>{products.length}</strong> published products checked · <strong>{flagged.length}</strong> need review</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>{[["Missing or single options",missingOptions],["Image issues",imageIssues],["Suspicious options",suspiciousOptions]].map(([label,count])=><div key={label} style={{border:"1px solid #ddd",borderRadius:10,padding:16,minWidth:180}}><strong style={{fontSize:28}}>{count}</strong><div>{label}</div></div>)}</div>
      {flagged.length === 0 ? <p>No issues detected by these basic checks.</p> : flagged.map(p => <section key={p.id} style={{border:"1px solid #ddd",borderRadius:12,padding:16,margin:"14px 0"}}>
        <h2 style={{fontSize:18,margin:"0 0 8px"}}><a href={"/products/"+encodeURIComponent(p.slug)}>{p.title}</a></h2>
        <p style={{fontSize:13}}>Supplier ID: {p.source_product_id || "Not available"} {/^\\d{12,18}$/.test(String(p.source_product_id||"")) ? <a href={"https://www.aliexpress.com/item/"+p.source_product_id+".html"} target="_blank" rel="noopener noreferrer" style={{marginLeft:12}}>Check original supplier options ↗</a> : null}</p>
        <ul>{p.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>
      </section>)}
    </>}
  </main>;
}
