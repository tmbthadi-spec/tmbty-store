import CleanerReview from "./CleanerReview";
import { SUPABASE_URL, SUPABASE_KEY } from "../../lib/supabase";

export const dynamic = "force-dynamic";

function inspect(product) {
  const issues = [];
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const images = Array.isArray(product.images) ? product.images : [];
  if (!images[0]) issues.push("Missing main product photo");
  const isPlaceholder = url => /\/144x144\.(png|jpg|jpeg)|placeholder|no.?image|store.?logo/i.test(String(url||""));
  if (images.some(isPlaceholder)) issues.push("Possible placeholder or supplier logo in product gallery");

  if (images.length > 1 && new Set(images.map(i => typeof i === "string" ? i.trim() : JSON.stringify(i))).size < images.length) issues.push("Duplicate saved product photos — review before removing");
  if (!product.source_product_id || !/^\\d{12,18}$/.test(String(product.source_product_id))) issues.push("Supplier product ID missing or invalid — cannot verify options");
  if (!variants.length) issues.push("No saved options — verify whether supplier has choices");
  if (variants.length === 1) issues.push("Only one saved option — verify supplier choices");
  const seen = new Set();
  for (const v of variants) {
    const name = String(v?.name || "").trim();
    if (!name) issues.push("Blank option label");
    if (/\b(?:sold|official store)\b/i.test(name) && /\d|^by/i.test(name)) issues.push("Supplier storefront text imported as option: " + name);
    if (isPlaceholder(v?.image)) issues.push("Possible placeholder image in option: " + name);
    if (/^(?:\d(?:\.0)?|\+\d+|all ratings|sort by default)$/i.test(name)) issues.push("Possible imported junk: " + name);
    if (/^(?:[a-z]{1,2}|\d+(?:\.\d+)?)$/i.test(name)) issues.push("Ambiguous option label — compare with supplier: " + name);
    if (/^(?:\d+ml){2,}$/i.test(name) || /(?:<\d+ml){2,}/i.test(name)) issues.push("Repeated capacity label: " + name);
    if (name && seen.has(name.toLowerCase())) issues.push("Duplicate option: " + name);
    seen.add(name.toLowerCase());
    if (!v?.image && variants.length > 1) issues.push("Option needs image verification: " + name);
  }
  const title = String(product.title || "").trim();
  if (/^(mug|coffee set|plate|fruit mug)$/i.test(title)) issues.push("Generic product title");
  if (/^(?:fruit|gold|luxury|elegant|modern|decorative|beautiful|home|kitchen|dining|accent|accessory|set|and|&|\\s|-)+$/i.test(title) || /\\b(?:kitchen accessory|home accessory|dining accessory|home item|household item)\\b/i.test(title)) issues.push("Vague product title — verify actual product type against supplier");
  if (title.length > 110) issues.push("Overlong product title — review for supplier noise");
  return [...new Set(issues)];
}


// Conservative automatic suggestions only: do not guess missing supplier choices.
function safeSuggestions(product) {
  const changes = [];
  for (const v of Array.isArray(product.variants) ? product.variants : []) {
    const before = String(v?.name || "");
    const after = before.trim().replace(/(\d)inches\b/gi, "$1 in").replace(/(\d)inch\b/gi, "$1 in").replace(/(\d)pcs\b/gi, "$1 pieces").replace(/\s{2,}/g, " ");
    if (before !== after) changes.push({from:before,to:after,reason:"Formatting only; original option remains available"});
  }
  return changes;
}

export default async function CleanerPage({ searchParams }) {
  const params = await searchParams;
  const filter = ["all","options","images","labels","titles","supplier"].includes(params?.filter) ? params.filter : "all";
  let products = [];
  let proposalsNote = "";
  let error = "";
  try {
    const url = SUPABASE_URL + "/rest/v1/tmbty_products?select=id,slug,title,status,images,variants,source_product_id,supplier_url,source&status=eq.published&order=created_at.desc&limit=500";
    const response = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }, cache: "no-store" });
    if (!response.ok) throw new Error("Unable to read product catalog");
    products = await response.json();
    // Proposal records are intentionally not public. Do not use an admin key in this page.
    proposalsNote = "The approval queue is protected. Open Cleaner Admin to view applied and pending corrections.";
  } catch (e) { error = e.message; }
  const flagged = products.map(p => ({ ...p, issues: inspect(p) })).filter(p => p.issues.length);
  const report = flagged.map(p => ({ product_id:p.id, title:p.title, product_url:"/products/"+p.slug, supplier_id:p.source_product_id, supplier_url: p.supplier_url || (/^\d{12,18}$/.test(String(p.source_product_id||"")) && /aliexpress/i.test(String(p.source||"")) ? "https://www.aliexpress.com/item/"+p.source_product_id+".html" : null), verification_status:"UNVERIFIED", verification_method:"Original supplier listing or authenticated supplier API required", issues:p.issues, original_variants:p.variants, original_images:p.images, safe_formatting_suggestions:safeSuggestions(p) }));
  const suggestionCount = report.reduce((n,p)=>n+p.safe_formatting_suggestions.length,0);
  const reviewPriority = p => p.issues.some(i => /Missing main product photo|No saved options|Possible imported junk|Supplier storefront|placeholder|Duplicate option|Supplier product ID missing/i.test(i)) ? "High" : p.issues.some(i => /Only one saved option|Ambiguous option|Generic product title|Vague product title|Overlong product title|Duplicate saved product photos/i.test(i)) ? "Medium" : "Low";
  const priorityCounts = {High:0,Medium:0,Low:0};
  flagged.forEach(p => { priorityCounts[reviewPriority(p)]++; });
  const visible = flagged.filter(p => filter === "all" || (filter === "options" && p.issues.some(i => /saved option|junk|supplier storefront|placeholder|duplicate|ambiguous option|repeated capacity|blank option/i.test(i))) || (filter === "images" && p.issues.some(i => /image|photo/i.test(i))) || (filter === "labels" && safeSuggestions(p).length > 0) || (filter === "titles" && p.issues.some(i => /product title/i.test(i))) || (filter === "supplier" && p.issues.some(i => /supplier|saved option|ambiguous option|option needs image verification/i.test(i))));
  const supplierReport = report.filter(p => p.issues.some(i => /supplier|saved option|ambiguous option|option needs image verification|product title/i.test(i))).map(p => ({...p,review_required:["Confirm original supplier product is the same listing","Compare all supplier option names and images","Verify title describes actual product","Do not remove any existing option without evidence"]}));
  const supplierCsv = [["product_id","title","supplier_id","supplier_url","verification_status","issue_count","saved_option_count","saved_image_count"],...supplierReport.map(p => [p.product_id,p.title,p.supplier_id||"",p.supplier_url||"",p.verification_status,p.issues.length,Array.isArray(p.original_variants)?p.original_variants.length:0,Array.isArray(p.original_images)?p.original_images.length:0])].map(row=>row.map(value=>'"'+String(value??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const supplierCsvUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(supplierCsv);
  const supplierUrl = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify({mode:"SUPPLIER_REVIEW_ONLY",generated_at:new Date().toISOString(),products:supplierReport},null,2));
  const reportUrl = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify({generated_at:new Date().toISOString(),total_products:products.length,flagged_products:report.length,products:report},null,2));
  const corrections = report.flatMap(p => p.safe_formatting_suggestions.map(change => ({product_id:p.product_id,supplier_id:p.supplier_id,original_name:change.from,suggested_name:change.to,reason:change.reason,approved:false})));
  const correctionsUrl = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify({mode:"REVIEW_ONLY",note:"These are proposals only. No changes have been applied.",corrections},null,2));
  const reviewable = report.filter(p => p.safe_formatting_suggestions.length).map(p => ({product_id:p.product_id,title:p.title,changes:p.safe_formatting_suggestions}));
  const missingOptions = flagged.filter(p => p.issues.some(i => i.includes("saved option"))).length;
  const imageIssues = flagged.filter(p => p.issues.some(i => i.toLowerCase().includes("image") || i.toLowerCase().includes("photo"))).length;
  const supplierVerificationCount = flagged.filter(p => p.issues.some(i => /supplier|saved option|ambiguous option|option needs image verification/i.test(i))).length;
  const titleIssues = flagged.filter(p => p.issues.some(i => /product title/i.test(i))).length;
  const suspiciousOptions = flagged.filter(p => p.issues.some(i => /junk|duplicate|repeated capacity|blank option|ambiguous option/i.test(i))).length;
  return <main style={{maxWidth:1050,margin:"40px auto",padding:"0 20px"}}>
    <h1>Product Cleaner — Safety Audit</h1>
    <p><a href="/api/cleaner-status" target="_blank" rel="noopener noreferrer">Check secure cleaner setup status ↗</a></p>
    <p style={{padding:12,border:"1px solid #ccc",borderRadius:8}}><strong>Protected workflow:</strong> A catalog snapshot is stored separately in the database. Suggestions on this page are read-only. Approved corrections can be applied separately in Cleaner Admin; no unattended product edits are enabled.</p>
    <section style={{padding:16,border:"1px solid #ddd",borderRadius:12,marginBottom:20}}><h2 style={{fontSize:20}}>Saved correction approval queue</h2><p><a href="/cleaner/admin" style={{display:"inline-block",padding:"10px 16px",border:"1px solid currentColor",borderRadius:8,fontWeight:700}}>Open Cleaner Admin →</a></p><p>{proposalsNote || "The protected approval queue is not available on this public page."}</p><p>Review and export suggestions below. Approval and application require the administrator secret; this public page cannot change store data.</p></section>
    <p>Read-only checks. This page never deletes options, photos, products, or changes prices. Supplier verification is required before repairing missing options.</p>
    {error ? <p role="alert">{error}</p> : <>
      <p><strong>{products.length}</strong> published products checked · <strong>{flagged.length}</strong> need review</p>
      <p><strong>{suggestionCount}</strong> safe option-label formatting suggestions generated automatically. They are included in the audit download for review; no supplier choices are removed.</p>
      <p style={{display:"flex",gap:12,flexWrap:"wrap"}}><a href={reportUrl} download="miga-mart-product-audit.json" style={{display:"inline-block",padding:"10px 16px",border:"1px solid currentColor",borderRadius:8}}>Download full audit and original saved options</a><a href={correctionsUrl} download="miga-mart-proposed-corrections.json" style={{display:"inline-block",padding:"10px 16px",border:"1px solid currentColor",borderRadius:8}}>Download proposed corrections for review</a></p>
      <p><a href={supplierUrl} download="miga-mart-supplier-verification.json" style={{display:"inline-block",padding:"10px 16px",border:"1px solid currentColor",borderRadius:8}}>Download supplier verification queue</a></p>
      <p><a href={supplierCsvUrl} download="miga-mart-supplier-review.csv" style={{display:"inline-block",padding:"10px 16px",border:"1px solid currentColor",borderRadius:8}}>Download supplier review spreadsheet (CSV)</a></p>
      <CleanerReview proposals={reviewable} />
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:18}}>{Object.entries(priorityCounts).map(([level,count])=><div key={level} style={{padding:12,border:"1px solid #ddd",borderRadius:10}}><strong>{count}</strong> {level} priority products</div>)}</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>{[["Missing or single options",missingOptions],["Image issues",imageIssues],["Suspicious options",suspiciousOptions],["Title review",titleIssues],["Supplier verification",supplierVerificationCount]].map(([label,count])=><div key={label} style={{border:"1px solid #ddd",borderRadius:10,padding:16,minWidth:180}}><strong style={{fontSize:28}}>{count}</strong><div>{label}</div></div>)}</div>
      <nav aria-label="Filter product issues" style={{display:"flex",flexWrap:"wrap",gap:12,margin:"20px 0"}}>{[["all","All flagged"],["options","Option problems"],["images","Image problems"],["labels","Safe label suggestions"],["titles","Title review"],["supplier","Supplier verification"]].map(([value,label])=><a key={value} href={"/cleaner?filter="+value} aria-current={filter===value?"page":undefined} style={{padding:"8px 12px",border:"1px solid #bbb",borderRadius:8,fontWeight:filter===value?700:400}}>{label}</a>)}</nav>
      {visible.length === 0 ? <p>No products match this filter.</p> : visible.map(p => <section key={p.id} style={{border:"1px solid #ddd",borderRadius:12,padding:16,margin:"14px 0"}}>
        <p style={{fontSize:12,fontWeight:700,marginBottom:6}}>Review priority: {reviewPriority(p)}</p>
        <h2 style={{fontSize:18,margin:"0 0 8px"}}><a href={"/products/"+encodeURIComponent(p.slug)}>{p.title}</a></h2>
        <p style={{fontSize:13}}>Supplier ID: {p.source_product_id || "Not available"} {/^\d{12,18}$/.test(String(p.source_product_id||"")) ? <a href={"https://www.aliexpress.com/item/"+p.source_product_id+".html"} target="_blank" rel="noopener noreferrer" style={{marginLeft:12}}>Check original supplier options ↗</a> : null}</p>
        {/^\\d{12,18}$/.test(String(p.source_product_id||"")) ? <p><a href={"https://www.aliexpress.com/item/"+encodeURIComponent(String(p.source_product_id))+".html"} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",padding:"8px 12px",border:"1px solid #bbb",borderRadius:8}}>Open exact supplier listing ↗</a></p> : <p style={{fontSize:13}}>Supplier link unavailable: missing or invalid source product ID.</p>}
        <ul>{p.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>
        <details style={{margin:"12px 0"}}><summary>Verify saved supplier details</summary><p style={{fontSize:13,fontWeight:700}}>Supplier verification: NOT CONFIRMED. AliExpress may block automated access. Never invent or replace variants based on a similar listing.</p><p style={{fontSize:13}}>Compare this product with the original supplier listing before changing titles, photos, or options. The saved data below is evidence, not proof that the supplier still offers these choices.</p><p><strong>Saved options ({Array.isArray(p.variants)?p.variants.length:0}):</strong></p><ul>{(Array.isArray(p.variants)?p.variants:[]).map((v,i)=><li key={i}>{String(v?.name||"(unnamed)")} {v?.source_name && v.source_name!==v.name ? "(supplier: "+String(v.source_name)+")" : ""} {v?.image ? "· option photo saved" : "· no option photo"}</li>)}</ul><p><strong>Saved product photos:</strong> {Array.isArray(p.images)?p.images.length:0}</p></details>
        {safeSuggestions(p).length > 0 ? <details><summary>Review proposed option-name changes ({safeSuggestions(p).length})</summary><table style={{width:"100%",textAlign:"left",borderCollapse:"collapse"}}><thead><tr><th>Current option</th><th>Proposed label</th></tr></thead><tbody>{safeSuggestions(p).map((change,i)=><tr key={i}><td style={{padding:8,borderBottom:"1px solid #ddd"}}>{change.from}</td><td style={{padding:8,borderBottom:"1px solid #ddd"}}>{change.to}</td></tr>)}</tbody></table><p>Preview only. Option images, counts, supplier names, prices, and product links are unchanged.</p></details> : null}
      </section>)}
    </>}
  </main>;
}
