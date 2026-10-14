"use client";
import { useMemo, useState } from "react";

export default function CleanerReview({ proposals }) {
  const [selected, setSelected] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const chosen = useMemo(() => proposals.filter(p => selected.includes(p.product_id)), [proposals, selected]);
  function toggle(id) { setConfirmed(false); setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]); }
  function exportReview() {
    const payload = { mode: "MANUAL_APPROVAL_EXPORT_ONLY", generated_at: new Date().toISOString(), approved: true, note: "This file does not update the store. A secure server-side application step is required.", products: chosen };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "miga-mart-reviewed-cleaner-proposals.json"; a.click(); URL.revokeObjectURL(url);
  }
  return <section style={{padding:16,border:"1px solid #ddd",borderRadius:12,margin:"20px 0"}}>
    <h2 style={{fontSize:20}}>Review safe corrections</h2>
    <p>Select only corrections you have checked. Exporting a review file never edits products.</p>
    {proposals.length === 0 ? <p>No safe formatting proposals currently available.</p> : <>
      <p><button type="button" onClick={() => {setSelected(proposals.map(p => p.product_id));setConfirmed(false);}}>Select all</button>{" "}<button type="button" onClick={() => {setSelected([]);setConfirmed(false);}}>Clear</button></p>
      {proposals.map(p => <label key={p.product_id} style={{display:"block",padding:"12px 0",borderTop:"1px solid #ddd"}}>
        <input type="checkbox" checked={selected.includes(p.product_id)} onChange={() => toggle(p.product_id)} />{" "}<strong>{p.title}</strong> ({p.changes.length} label corrections)
        <div style={{marginLeft:24,fontSize:13}}>{p.changes.map((c,i)=><div key={i}>{c.from} → {c.to}</div>)}</div>
      </label>)}
      <p><label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I have reviewed the selected corrections.</label></p>
      <button type="button" disabled={!confirmed || !chosen.length} onClick={exportReview}>Export {chosen.length} reviewed product corrections</button>
      <p style={{fontSize:12}}>No changes to live product options, photos, prices, or URLs. Applying changes remains disabled until secure admin access is ready.</p>
    </>}
  </section>;
}
