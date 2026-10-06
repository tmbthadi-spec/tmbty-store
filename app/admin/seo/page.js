"use client";

import {useEffect,useMemo,useState} from "react";

const SUPABASE_URL="https://dchbrrnywealudwripwq.supabase.co";
const SUPABASE_KEY="sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";
const API=SUPABASE_URL+"/functions/v1/tmbty-seo-optimizer";

async function readJson(r){
  const t=await r.text();
  try{return JSON.parse(t);}catch{return {error:t||("HTTP "+r.status)};}
}
async function apiFetch(token,options={}){
  const r=await fetch(API,{
    ...options,
    headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+token,...(options.headers||{})}
  });
  const d=await readJson(r);
  if(!r.ok) throw new Error(d.message||d.error||("HTTP "+r.status));
  return d;
}

export default function SeoOptimizerAdmin(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");
  const [products,setProducts]=useState([]);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState("Connect your TMBTY admin account.");

  useEffect(()=>{
    const t=localStorage.getItem("tmbty-seo-admin-token")||"";
    const e=localStorage.getItem("tmbty-seo-admin-email")||"";
    if(e) setEmail(e);
    if(t){setToken(t);load(t);}
  },[]);

  async function login(){
    setStatus("Connecting…");
    try{
      const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=password",{
        method:"POST",
        headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({email,password})
      });
      const d=await r.json();
      if(!r.ok||!d.access_token) throw new Error(d.error_description||d.msg||"Login failed");
      localStorage.setItem("tmbty-seo-admin-token",d.access_token);
      localStorage.setItem("tmbty-seo-admin-email",email);
      setToken(d.access_token);setPassword("");
      await load(d.access_token);
    }catch(e){setStatus("Connection failed: "+e.message);}
  }

  async function load(t=token){
    if(!t)return;
    try{
      const d=await apiFetch(t);
      setProducts(d.products||[]);
      setStatus(`Ready. Found ${(d.products||[]).length} products.`);
    }catch(e){setStatus("Please reconnect: "+e.message);}
  }

  async function optimizeOne(p,t=token){
    const d=await apiFetch(t,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id:p.id})
    });
    return d;
  }

  async function optimizeAll(){
    if(!products.length)return;
    setBusy(true);
    let done=0,errors=0;
    for(const p of products){
      setStatus(`Optimizing ${done+1}/${products.length}: ${p.title}`);
      try{await optimizeOne(p);}catch{errors++;}
      done++;
    }
    setBusy(false);
    await load();
    setStatus(`Finished. Updated ${done-errors} products. Errors: ${errors}.`);
  }

  return <main style={{maxWidth:1180,margin:"40px auto",padding:"0 20px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:12,letterSpacing:1.2,textTransform:"uppercase",color:"#7c6476"}}>TMBTY Admin</div>
        <h1 style={{margin:"6px 0 8px"}}>Pinterest SEO Optimizer</h1>
        <p style={{margin:0,color:"#6f636c",maxWidth:780}}>
          Rewrites product titles and descriptions in a Pinterest/SHEIN-style format, adds natural search phrases,
          and includes color-based keywords such as pink long earrings, yellow ring, blue bracelet, and green bag when those colors exist in the product.
        </p>
      </div>
      <a href="/" style={{color:"#704f68"}}>Back to store</a>
    </div>

    {!token&&<section style={box}>
      <h2 style={{marginTop:0}}>Admin sign in</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Admin email" style={input}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" style={input}/>
        <button onClick={login} style={primary}>Connect</button>
      </div>
    </section>}

    {token&&<>
      <section style={box}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button disabled={busy} onClick={optimizeAll} style={primary}>Optimize all products</button>
          <button disabled={busy} onClick={()=>load()} style={secondary}>Reload preview</button>
        </div>
        <div style={{marginTop:14,padding:12,borderRadius:10,background:"#faf7f9"}}>{status}</div>
      </section>

      <section style={{marginTop:18,border:"1px solid #eadfe7",borderRadius:16,overflow:"hidden",background:"#fff"}}>
        <div style={{padding:"14px 16px",fontWeight:800,borderBottom:"1px solid #eadfe7"}}>SEO Preview</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#faf7f9",textAlign:"left"}}>
              <th style={th}>Current Product</th>
              <th style={th}>New Pinterest-Style Title</th>
              <th style={th}>Top Keywords</th>
              <th style={th}>Action</th>
            </tr></thead>
            <tbody>{products.map(p=><tr key={p.id} style={{borderTop:"1px solid #f0e7ee",verticalAlign:"top"}}>
              <td style={td}><a href={"/products/"+p.slug} target="_blank" rel="noreferrer">{p.title}</a></td>
              <td style={td}><strong>{p.preview?.title}</strong><div style={{marginTop:6,color:"#777",lineHeight:1.4}}>{p.preview?.description}</div></td>
              <td style={td}><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{(p.preview?.seo_keywords||[]).slice(0,8).map(k=><span key={k} style={pill}>{k}</span>)}</div></td>
              <td style={td}><button disabled={busy} onClick={async()=>{setBusy(true);setStatus("Optimizing "+p.title+"…");try{await optimizeOne(p);await load();setStatus("Updated: "+p.preview?.title);}catch(e){setStatus("Error: "+e.message);}setBusy(false);}} style={mini}>Optimize</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </>}
  </main>;
}

const box={marginTop:24,padding:20,border:"1px solid #eadfe7",borderRadius:16,background:"#fff"};
const input={padding:"11px 12px",border:"1px solid #d9ccd5",borderRadius:10,fontSize:14};
const primary={padding:"11px 14px",border:0,borderRadius:10,background:"#76516f",color:"#fff",fontWeight:800,cursor:"pointer"};
const secondary={padding:"11px 14px",border:"1px solid #d9ccd5",borderRadius:10,background:"#fff",fontWeight:700,cursor:"pointer"};
const mini={padding:"7px 10px",border:"1px solid #d9ccd5",borderRadius:8,background:"#fff",cursor:"pointer"};
const th={padding:"11px 14px",fontSize:11,textTransform:"uppercase",letterSpacing:.7,color:"#6d5e69"};
const td={padding:"12px 14px",lineHeight:1.4,minWidth:170};
const pill={display:"inline-block",padding:"4px 7px",borderRadius:999,border:"1px solid #eadfe7",background:"#fbf8fa",fontSize:11};
