"use client";
import { useState } from "react";

export default function CleanerAdminPage() {
  const [secret,setSecret] = useState("");
  const [proposalId,setProposalId] = useState("");
  const [busy,setBusy] = useState(false);
  const [result,setResult] = useState("");
  async function run(action) {
    const id = Number(proposalId);
    if (!Number.isSafeInteger(id) || id < 1) {setResult("Enter a valid proposal ID.");return;}
    if (!secret) {setResult("Administrator authorization is required.");return;}
    if (!window.confirm((action === "apply" ? "Apply" : "Roll back") + " proposal #" + id + "?")) return;
    setBusy(true);setResult("");
    try {
      const response = await fetch("/api/cleaner-actions", {
        method:"POST",headers:{"Content-Type":"application/json","x-miga-admin-secret":secret},
        body:JSON.stringify({proposalId:id,action}),cache:"no-store"
      });
      const data = await response.json();
      setResult(response.ok ? "Completed: " + action + " proposal #" + id : "Not applied: " + (data.error || "Request failed"));
    } catch {setResult("Request failed. No successful change was confirmed.");}
    finally {setBusy(false);}
  }
  return <main style={{maxWidth:650,margin:"48px auto",padding:20}}>
    <h1>Cleaner Administrator Controls</h1>
    <p>Only authorized store administrators may apply or reverse a saved proposal. These controls cannot create missing supplier options.</p>
    <p><strong>Safety:</strong> Changes are limited to saved proposal option-label formatting. Existing images, prices, slugs and option counts are protected by database checks.</p>
    <form onSubmit={e=>e.preventDefault()} style={{display:"grid",gap:14}}>
      <label>Administrator secret (not saved)<input type="password" autoComplete="off" value={secret} onChange={e=>setSecret(e.target.value)} style={{display:"block",width:"100%",padding:10,marginTop:5}} /></label>
      <label>Saved proposal ID<input type="number" min="1" step="1" value={proposalId} onChange={e=>setProposalId(e.target.value)} style={{display:"block",width:"100%",padding:10,marginTop:5}} /></label>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" disabled={busy} onClick={()=>run("apply")} style={{padding:"10px 18px"}}>Apply approved correction</button><button type="button" disabled={busy} onClick={()=>run("rollback")} style={{padding:"10px 18px"}}>Roll back correction</button></div>
    </form>
    {result && <p role="status" style={{padding:12,border:"1px solid #ddd",borderRadius:8}}>{result}</p>}
    <p style={{marginTop:24}}>Database write access must be configured server-side before these controls can work. Never enter your Supabase service-role key here.</p>
    <a href="/cleaner">Return to product audit</a>
  </main>;
}
