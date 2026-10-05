"use client";

import { useEffect, useMemo, useState } from "react";

const SUPABASE_URL="https://dchbrrnywealudwripwq.supabase.co";
const SUPABASE_KEY="sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";
const LIST_API=SUPABASE_URL+"/functions/v1/tmbty-review-importer";
const SAVE_API=SUPABASE_URL+"/functions/v1/tmbty-review-sync";
const SCRAPE_API="/api/reviews/scrape";

async function readJson(r){
  const text=await r.text();
  try{return JSON.parse(text);}catch{return {error:text||("HTTP "+r.status)};}
}

async function supabaseFetch(url,token,options={}){
  const r=await fetch(url,{
    ...options,
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:"Bearer "+token,
      ...(options.headers||{})
    }
  });
  const data=await readJson(r);
  if(!r.ok) throw new Error(data.message||data.error||("HTTP "+r.status));
  return data;
}

export default function ReviewImporterAdmin(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");
  const [products,setProducts]=useState([]);
  const [status,setStatus]=useState("Connect your TMBTY admin account.");
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState({done:0,total:0});
  const [current,setCurrent]=useState("");
  const [stopRequested,setStopRequested]=useState(false);

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
    }catch(e){
      setStatus("Connection failed: "+e.message);
    }
  }

  async function loadProducts(t=token){
    if(!t) return;
    try{
      const data=await supabaseFetch(LIST_API,t);
      setProducts(data.products||[]);
      setStatus(`Ready. Found ${(data.products||[]).length} TMBTY products.`);
    }catch(e){
      setStatus("Please reconnect: "+e.message);
      setToken("");
      localStorage.removeItem("tmbty-review-admin-token");
    }
  }

  async function scrapeReviews(product,t=token){
    const r=await fetch(SCRAPE_API,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:"Bearer "+t
      },
      body:JSON.stringify({url:product.supplier_url})
    });
    const data=await readJson(r);
    if(!r.ok) throw new Error(data.message||data.error||("HTTP "+r.status));
    return data.reviews||[];
  }

  async function saveReviews(product,reviews,t=token){
    const data=await supabaseFetch(SAVE_API,t,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        source_product_id:product.source_product_id,
        reviews
      })
    });
    return Number(data.product?.review_count||0);
  }

  async function syncOne(product,t=token){
    const reviews=await scrapeReviews(product,t);
    const count=await saveReviews(product,reviews,t);
    return {count};
  }

  async function scan(list){
    if(!list.length){
      setStatus("No products need scanning.");
      return;
    }
    setBusy(true);
    setStopRequested(false);
    setProgress({done:0,total:list.length});
    let imported=0,errors=0,blocked=0;

    for(let i=0;i<list.length;i++){
      if(stopRequested) break;
      const p=list[i];
      setCurrent(p.title);
      setStatus(`Scanning ${i+1}/${list.length}: ${p.title}`);
      try{
        const r=await syncOne(p);
        imported+=r.count;
      }catch(e){
        const msg=String(e.message||e);
        if(/blocked|captcha|429/i.test(msg)) blocked++;
        else errors++;
      }
      setProgress({done:i+1,total:list.length});
    }

    setCurrent("");
    setBusy(false);
    await loadProducts();
    setStatus(`Finished. Imported ${imported} reviews. Blocked products: ${blocked}. Other errors: ${errors}.`);
  }

  const emptyProducts=useMemo(()=>products.filter(p=>Number(p.review_count||0)===0),[products]);
  const pct=progress.total?Math.round(progress.done/progress.total*100):0;

  return <main style={{maxWidth:1100,margin:"40px auto",padding:"0 18px"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"end",flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:13,letterSpacing:1.4,textTransform:"uppercase",color:"#7c6476"}}>TMBTY Admin</div>
        <h1 style={{margin:"6px 0 8px"}}>Review Importer</h1>
        <p style={{margin:0,color:"#6e626b",maxWidth:720}}>
          Built into TMBTY. No Bright Data, no external review account, and no browser extension.
          TMBTY opens each AliExpress product on the server, collects real product reviews, and saves up to 20.
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
        <Stat label="Review engine" value="Built in"/>
      </div>

      <div style={{marginTop:16,padding:16,borderRadius:14,background:"#f7f1f5",border:"1px solid #e4d6df",lineHeight:1.5}}>
        <strong>Your review rules:</strong> exact product only, maximum 20, written reviews only, real 1–5 star rating,
        reviewer name/date/photos when available, no store rating, no sold count, no recommendations, no duplicate reviews.
      </div>

      <div style={{marginTop:18,padding:18,border:"1px solid #eadfe7",borderRadius:16,background:"#fff"}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button disabled={busy} onClick={()=>scan(emptyProducts)} style={primaryButton}>
            Scan products with no reviews ({emptyProducts.length})
          </button>
          <button disabled={busy} onClick={()=>scan(products)} style={secondaryButton}>Refresh all products</button>
          <button disabled={busy} onClick={()=>loadProducts()} style={secondaryButton}>Reload list</button>
          {busy && <button onClick={()=>setStopRequested(true)} style={secondaryButton}>Stop after current product</button>}
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
                <button disabled={busy} onClick={()=>scan([p])} style={miniButton}>
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
