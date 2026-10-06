"use client";
import {useEffect,useMemo,useState} from "react";

const U="https://dchbrrnywealudwripwq.supabase.co";
const K="sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";
const API=U+"/functions/v1/tmbty-product-remover";

async function readJson(r){const t=await r.text();try{return JSON.parse(t)}catch{return{error:t||("HTTP "+r.status)}}}
async function api(token,options={}){
  const r=await fetch(API,{...options,headers:{apikey:K,Authorization:"Bearer "+token,...(options.headers||{})}});
  const d=await readJson(r);
  if(!r.ok) throw new Error(d.message||d.error||("HTTP "+r.status));
  return d;
}

export default function ProductRemover(){
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[token,setToken]=useState("");
  const[products,setProducts]=useState([]);
  const[q,setQ]=useState("");
  const[busyId,setBusyId]=useState("");
  const[status,setStatus]=useState("Connect your TMBTY admin account.");

  useEffect(()=>{
    const t=localStorage.getItem("tmbty-remove-token")||"";
    const e=localStorage.getItem("tmbty-remove-email")||"";
    if(e)setEmail(e);
    if(t){setToken(t);load(t)}
  },[]);

  async function login(){
    setStatus("Connecting…");
    try{
      const r=await fetch(U+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:K,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const d=await r.json();
      if(!r.ok||!d.access_token) throw new Error(d.error_description||d.msg||"Login failed");
      localStorage.setItem("tmbty-remove-token",d.access_token);
      localStorage.setItem("tmbty-remove-email",email);
      setToken(d.access_token);setPassword("");
      await load(d.access_token);
    }catch(e){setStatus("Connection failed: "+e.message)}
  }

  async function load(t=token){
    if(!t)return;
    try{
      const d=await api(t);
      setProducts(d.products||[]);
      setStatus("Ready. Found "+(d.products||[]).length+" products.");
    }catch(e){setStatus("Please reconnect: "+e.message)}
  }

  async function removeProduct(p){
    const ok=window.confirm('Delete "'+p.title+'"? This removes the product from TMBTY.');
    if(!ok)return;
    setBusyId(p.id);
    setStatus("Removing "+p.title+"…");
    try{
      await api(token,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"delete",id:p.id})});
      setProducts(prev=>prev.filter(x=>x.id!==p.id));
      setStatus("Removed: "+p.title);
    }catch(e){setStatus("Error: "+e.message)}
    setBusyId("");
  }

  const filtered=useMemo(()=>{
    const s=q.trim().toLowerCase();
    if(!s)return products;
    return products.filter(p=>[p.title,p.slug,p.category,p.subcategory,p.status].some(v=>String(v||"").toLowerCase().includes(s)));
  },[q,products]);

  return <main style={{maxWidth:1100,margin:"40px auto",padding:"0 20px"}}>
    <h1>Remove Products</h1>
    <p style={{color:"#6f636c"}}>Use this only for products that were imported by mistake or that you no longer want in the store.</p>

    {!token?<section style={box}>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email" style={input}/>
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" style={input}/>
      <button onClick={login} style={primary}>Connect</button>
    </section>:<>
      <section style={box}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search product title, category or slug…" style={{...input,minWidth:320}}/>
        <button onClick={()=>load()} style={secondary}>Reload</button>
        <div style={{width:"100%",marginTop:8}}>{status}</div>
      </section>

      <div style={{marginTop:18,display:"grid",gap:12}}>
        {filtered.map(p=><div key={p.id} style={{display:"grid",gridTemplateColumns:"72px 1fr auto",gap:14,alignItems:"center",border:"1px solid #eadfe7",borderRadius:12,padding:12,background:"#fff"}}>
          <div style={{width:72,height:72,background:"#faf7f9",overflow:"hidden",borderRadius:8}}>
            {p.images?.[0]?<img src={p.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:null}
          </div>
          <div>
            <strong>{p.title}</strong>
            <div style={{fontSize:12,color:"#777",marginTop:4}}>{p.category}{p.subcategory?" / "+p.subcategory:""} · {p.status}</div>
            <a href={"/products/"+p.slug} target="_blank" rel="noreferrer" style={{fontSize:12,textDecoration:"underline"}}>View product</a>
          </div>
          <button disabled={busyId===p.id} onClick={()=>removeProduct(p)} style={danger}>
            {busyId===p.id?"Removing…":"Delete"}
          </button>
        </div>)}
      </div>
    </>}
  </main>
}

const box={display:"flex",gap:10,flexWrap:"wrap",marginTop:20,padding:18,border:"1px solid #eadfe7",borderRadius:14,background:"#fff"};
const input={padding:"10px 12px",border:"1px solid #d9ccd5",borderRadius:8};
const primary={padding:"10px 14px",border:0,borderRadius:8,background:"#76516f",color:"#fff",fontWeight:700};
const secondary={padding:"10px 14px",border:"1px solid #d9ccd5",borderRadius:8,background:"#fff",fontWeight:700};
const danger={padding:"10px 14px",border:0,borderRadius:8,background:"#b42318",color:"#fff",fontWeight:800};
