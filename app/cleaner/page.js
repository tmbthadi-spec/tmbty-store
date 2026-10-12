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


// Conservative automatic suggestions only: do not guess missing supplier choices.
function safeSuggestions(product) {
  const changes = [];
  for (const v of Array.isArray(product.variants) ? product.variants : []) {
    const before = String(v?.name || "");
    const after = before.trim().replace(/(\\d)inches\\b/gi, "$1 in").replace(/(\\d)inch\\b/gi, "$1 in").replace(/(\\d)pcs\\b/gi, "$1 pieces").replace(/\\s{2,}/g, " ");
    if (before !== after) changes.push({from:before,to:after,reason:"Formatting only; original option remains available"});
  }
  return changes;
}

export default async function CleanerPage({ searchParams }) {
  const params = await searchParams;
  const filter = ["all","options","images","labels"].includes(params?.filter) ? params.filter : "all";
  let products = [];
  let error = "";
  try {
    const url = SUPABASE_URL + "/rest/v1/tmbty_products?select=id,slug,title,status,images,variants,source_product_id&status=eq.published&order=created_at.desc&limit=500";
    const response = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }, cache: "no-store" });
    if (!response.ok) throw new Error("Unable to read product catalog");
    products = await response.json();
  } catch (e) { error = e.message; }
  const flagged = products.map(p => ({ ...p, issues: inspect(p) })).filter(p => p.issues.length);
  const report = flagged.map(p => ({ product_id:p.id, title:p.title, product_url:"/products/"+p.slug, supplier_id:p.source_product_id, issues:p.issues, original_variants:p.variants, safe_formatting_suggestions:safeSuggestions(p) }));
  const suggestionCount = report.reduce((n,p)=>n+p.safe_formatting_suggestions.length,0);
  const visible = flagged.filter(p => filter === "all" || (filter === "options" && p.issues.some(i => /saved option|junk|duplicate|ambiguous option|repeated capacity|blank option/i.test(i))) || (filter === "images" && p.issues.some(i => /image|photo/i.test(i))) || (filter === "labels" && safeSuggestions(p).length > 0));
  const reportUrl = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify({generated_at:new Date().toISOString(),total_products:products.length,flagged_products:report.length,products:report},null,2));
  const corrections = report.flatMap(p => p.safe_formatting_suggestions.map(change => ({product_id:p.product_id,supplier_id:p.supplier_id,original_name:change.from,suggested_name:change.to,reason:change.reason,approved:false})));
  const correctionsUrl = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify({mode:"REVIEW_ONLY",note:"These are proposals only. No changes have been applied.",corrections},null,2));
  const missingOptions = flagged.filter(p => p.issues.some(i => i.includes("saved option"))).length;
  const imageIssues = flagged.filter(p => p.issues.some(i => i.toLowerCase().includes("image") || i.toLowerCase().includes("photo"))).length;
  const suspiciousOptions = flagged.filter(p => p.issues.some(i => /junk|duplicate|repeated capacity|blank option|ambiguous option/i.test(i))).length;
  return <main style={{maxWidth:1050,margin:"40px auto",padding:"0 20px"}}>
    <h1>Product Cleaner — Safety Audit</h1>
    <p style={{padding:12,border:"1px solid #ccc",borderRadius:8}}><strong>Protected workflow:</strong> A catalog snapshot is stored separately in the database. Proposed corrections remain review-only. No automatic writes to product records are enabled.</p>
    <p>Read-only checks. This page never deletes options, photos, products, or changes prices. Supplier verification is required before repairing missing options.</p>
    {error ? <p role="alert">{error}</p> : <>
      <p><strong>{products.length}</strong> published products checked · <strong>{flagged.length}</strong> need review</p>
      <p><strong>{suggestionCount}</strong> safe option-label formatting suggestions generated automatically. They are included in the audit download for review; no supplier choices are removed.</p>
      <p style={{display:"flex",gap:12,flexWrap:"wrap"}}><a href={reportUrl} download="miga-mart-product-audit.json" style={{display:"inline-block",padding:"10px 16px",border:"1px solid currentColor",borderRadius:8}}>Download full audit and original saved options</a><a href={correctionsUrl} download="miga-mart-proposed-corrections.json" style={{display:"inline-block",padding:"10px 16px",border:"1px solid currentColor",borderRadius:8}}>Download proposed corrections for review</a></p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>{[["Missing or single options",missingOptions],["Image issues",imageIssues],["Suspicious options",suspiciousOptions]].map(([label,count])=><div key={label} style={{border:"1px solid #ddd",borderRadius:10,padding:16,minWidth:180}}><strong style={{fontSize:28}}>{count}</strong><div>{label}</div></div>)}</div>
      <nav aria-label="Filter product issues" style={{display:"flex",flexWrap:"wrap",gap:12,margin:"20px 0"}}>{[["all","All flagged"],["options","Option problems"],["images","Image problems"],["labels","Safe label suggestions"]].map(([value,label])=><a key={value} href={"/cleaner?filter="+value} aria-current={filter===value?"page":undefined} style={{padding:"8px 12px",border:"1px solid #bbb",borderRadius:8,fontWeight:filter===value?700:400}}>{label}</a>)}</nav>
      {visible.length === 0 ? <p>No products match this filter.</p> : visible.map(p => <section key={p.id} style={{border:"1px solid #ddd",borderRadius:12,padding:16,margin:"14px 0"}}>
        <h2 style={{fontSize:18,margin:"0 0 8px"}}><a href={"/products/"+encodeURIComponent(p.slug)}>{p.title}</a></h2>
        <p style={{fontSize:13}}>Supplier ID: {p.source_product_id || "Not available"} {/^\\d{12,18}$/.test(String(p.source_product_id||"")) ? <a href={"https://www.aliexpress.com/item/"+p.source_product_id+".html"} target="_blank" rel="noopener noreferrer" style={{marginLeft:12}}>Check original supplier options ↗</a> : null}</p>
        <ul>{p.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>
        {safeSuggestions(p).length > 0 ? <details><summary>Automatic safe formatting suggestions ({safeSuggestions(p).length})</summary><ul>{safeSuggestions(p).map((change,i)=><li key={i}>{change.from} → {change.to}</li>)}</ul></details> : null}
      </section>)}
    </>}
  </main>;
}
