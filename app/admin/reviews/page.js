"use client";

import { useEffect, useMemo, useState } from "react";

const SUPABASE_URL="https://dchbrrnywealudwripwq.supabase.co";
const SUPABASE_KEY="sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";
const API=SUPABASE_URL+"/functions/v1/tmbty-review-importer";

async function apiFetch(token,options={}){
  const r=await fetch(API,{
    ...options,
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:"Bearer "+token,
      ...(options.headers||{})
    }
  });
  const text=await r.text();
  let data={};
  try{ data=JSON.parse(text); }catch{ data={error:text||("HTTP "+r.status)}; }
  if(!r.ok && r.status!==202) throw new Error(data.message||data.error||("HTTP "+r.status));
  return {status:r.status,data};
}

export default function ReviewImporterAdmin(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");
  const [products,setProducts]=useState([]);
  const [providerReady,setProviderReady]=useState(false);
  const [status,setStatus]=useState("Connect your TMBTY admin account.");
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState({done:0,total:0});
  const [current,setCurrent]=useState("");
  const [stop,setStop]=useState(false);

  useEffect(()=>{
    const saved=localStorage.getItem("tmbty-review-admin-token")||"";
    const savedEmail=localStorage.getItem("tmbty-review-admin-email")||"";
    if(savedEmail) setEmail(savedEmail);
    if(saved){ setToken(saved); loadProducts(saved); }
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
      setToken(d.access_token);
      setPassword("");
      localStorage.setItem("tmbty-review-admin-token",d.access_token);
      localStorage.setItem("tmbty-review-admin-email",email);
      await loadProducts(d.access_token);
    }catch(e){ setStatus("Connection failed: "+e.message); }
  }

  async function loadProducts(t=token){
    if(!t) return;
    try{
      const {data}=await apiFetch(t);
      setProducts(data.products||[]);
      setProviderReady(!!data.provider_ready);
      setStatus(data.provider_ready
        ? `Ready. Found ${(data.products||[]).length} TMBTY products.`
        : "Review importer is installed, but the Bright Data server credentials still need to be added.");
    }catch(e){
      setStatus("Please reconnect: "+e.message);
      setToken("");
      localStorage.removeItem("tmbty-review-admin-token");
    }
  }

  async function syncOne(product,t=token){
    const {status:code,data}=await apiFetch(t,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"sync_product",source_product_id:product.source_product_id})
    });
    if(code===202 || data.pending){
      return {count:0,message:"still processing"};
    }
    return {count:Number(data.review_count||0),message:"done"};
  }

  async function scan(list){
    if(!providerReady){ setStatus("Add the Bright Data server credentials first."); return; }
    if(!list.length){ setStatus("No products need scanning."); return; }
    setBusy(true); setStop(false);
    setProgress({done:0,total:list.length});
    let imported=0,errors=0,pending=0;
    for(let i=0;i<list.length;i++){
      if(stop) break;
      const p=list[i];
      setCurrent(p.title);
      setStatus(`Scanning ${i+1}/${list.length}: ${p.title}`);
      try{
        const r=await syncOne(p);
        if(r.message==="still processing") pending++;
        imported+=r.count;
      }catch(e){ errors++; }
      setProgress({done:i+1,total:list.length});
    }
    setCurrent("");
    setBusy(false);
    await loadProducts();
    setStatus(`Finished. Imported ${imported} reviews. Pending: ${pending}. Errors: ${errors}.`);
  }

  const emptyProducts=useMemo(()=>products.filter(p=>Number(p.review_count||0)===0),[products]);
  const pct=progress.total?Math.round(progress.done/progress.total*100):0;

  return <main style={{maxWidth:1100,margin:"40px auto",padding:"0 18px"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"end",flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:13,letterSpacing:1.4,textTransform:"uppercase",color:"#7c6476"}}>TMBTY Admin</div>
        <h1 style={{margin:"6px 0 8px"}}>Review Importer</h1>
        <p style={{margin:0,color:"#6e626b",maxWidth:680}}>
          Server-side AliExpress review importing. No browser extension and no AliExpress page opening.
        </p>
      </div>
      <a href="/" style={{color:"#6f4f68"}}>Back to store</a>
    </div>

    {!token && <section style={{marginTop:28,padding:22,border:"1px solid #eadfe7",borderRadius:16,background:"#fff"}}>
      <h2 style={{marginTop:0}}>Admin sign in</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Admin email" style={inputStyle}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" style={inputStyle}/>
        <button onClick={login} style={primaryButton}>Connect</button>
      </div>
    </section>}

    {token && <section style={{marginTop:28}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
        <Stat label="Products" value={products.length}/>
        <Stat label="With reviews" value={products.length-emptyProducts.length}/>
        <Stat label="No reviews" value={emptyProducts.length}/>
        <Stat label="Provider" value={providerReady?"Ready":"Setup needed"}/>
      </div>

      {!providerReady && <div style={{marginTop:16,padding:16,borderRadius:14,background:"#fff7df",border:"1px solid #efdda4",lineHeight:1.5}}>
        <strong>One setup step remains:</strong> add the Bright Data API token and AliExpress Reviews dataset ID as private Supabase Edge Function secrets named
        <code> BRIGHTDATA_API_TOKEN </code> and <code> BRIGHTDATA_ALIEXPRESS_REVIEWS_DATASET_ID</code>.
        They are never exposed to shoppers or stored in this page.
      </div>}

      <div style={{marginTop:18,padding:18,border:"1px solid #eadfe7",borderRadius:16,background:"#fff"}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button disabled={busy||!providerReady} onClick={()=>scan(emptyProducts)} style={primaryButton}>
            Scan products with no reviews ({emptyProducts.length})
          </button>
          <button disabled={busy||!providerReady} onClick={()=>scan(products)} style={secondaryButton}>Refresh all products</button>
          <button disabled={busy} onClick={()=>loadProducts()} style={secondaryButton}>Reload list</button>
          {busy && <button onClick={()=>setStop(true)} style={secondaryButton}>Stop</button>}
        </div>

        {(busy||progress.total>0) && <div style={{marginTop:16}}>
          <div style={{height:10,background:"#f0e7ee",borderRadius:20,overflow:"hidden"}}>
            <div style={{height:"100%",width:pct+"%",background:"#76516f",transition:"width .2s"}}/>
          </div>
          <div style={{marginTop:8,fontSize:13,color:"#715f6d"}}>
            {progress.done}/{progress.total} ({pct}%) {current?("— "+current):""}
          </div>
        </div>}

        <div style={{marginTop:14,padding:12,borderRadius:10,background:"#faf7f9",fontSize:14}}>{status}</div>
      </div>

      <div style={{marginTop:18,border:"1px solid #eadfe7",borderRadius:16,overflow:"hidden",background:"#fff"}}>
        <div style={{padding:"14px 16px",fontWeight:700,borderBottom:"1px solid #eadfe7"}}>Products</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead><tr style={{textAlign:"left",background:"#faf7f9"}}>
              <th style={th}>Product</th><th style={th}>Status</th><th style={th}>Reviews</th><th style={th}>Action</th>
            </tr></thead>
            <tbody>{products.map(p=><tr key={p.id} style={{borderTop:"1px solid #f1e8ef"}}>
              <td style={td}><a href={"/products/"+p.slug} style={{color:"#4d3848"}}>{p.title}</a></td>
              <td style={td}>{p.status}</td>
              <td style={td}><strong>{p.review_count||0}</strong></td>
              <td style={td}>
                <button disabled={busy||!providerReady} onClick={()=>scan([p])} style={miniButton}>
                  {p.review_count?"Refresh":"Import"}
                </button>
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    </section>}
  </main>;
}

function Stat({label,value}){
  return <div style={{padding:16,border:"1px solid #eadfe7",borderRadius:14,background:"#fff"}}>
    <div style={{fontSize:12,color:"#806e7b",textTransform:"uppercase",letterSpacing:1}}>{label}</div>
    <div style={{fontSize:26,fontWeight:800,marginTop:4}}>{value}</div>
  </div>
}

const inputStyle={padding:"11px 12px",border:"1px solid #d9ccd5",borderRadius:10,fontSize:14};
const primaryButton={padding:"11px 14px",border:0,borderRadius:10,background:"#76516f",color:"#fff",fontWeight:700,cursor:"pointer"};
const secondaryButton={padding:"11px 14px",border:"1px solid #d9ccd5",borderRadius:10,background:"#fff",color:"#4f3d4b",fontWeight:700,cursor:"pointer"};
const miniButton={padding:"7px 10px",border:"1px solid #d9ccd5",borderRadius:8,background:"#fff",cursor:"pointer"};
const th={padding:"11px 14px",fontSize:12,color:"#6d5e69",textTransform:"uppercase",letterSpacing:.7};
const td={padding:"12px 14px"};
