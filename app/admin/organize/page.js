"use client";
import {useEffect,useState} from "react";
const U="https://dchbrrnywealudwripwq.supabase.co";
const K="sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";
const API=U+"/functions/v1/tmbty-product-organizer";
async function j(r){const t=await r.text();try{return JSON.parse(t)}catch{return{error:t||("HTTP "+r.status)}}}
async function api(token,options={}){const r=await fetch(API,{...options,headers:{apikey:K,Authorization:"Bearer "+token,...(options.headers||{})}});const d=await j(r);if(!r.ok)throw new Error(d.message||d.error||("HTTP "+r.status));return d}
export default function Page(){
 const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[token,setToken]=useState(""),[products,setProducts]=useState([]),[busy,setBusy]=useState(false),[status,setStatus]=useState("Connect your TMBTY admin account.");
 useEffect(()=>{const t=localStorage.getItem("tmbty-organizer-token")||"",e=localStorage.getItem("tmbty-organizer-email")||"";if(e)setEmail(e);if(t){setToken(t);load(t)}},[]);
 async function login(){setStatus("Connecting…");try{const r=await fetch(U+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:K,"Content-Type":"application/json"},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok||!d.access_token)throw new Error(d.error_description||d.msg||"Login failed");localStorage.setItem("tmbty-organizer-token",d.access_token);localStorage.setItem("tmbty-organizer-email",email);setToken(d.access_token);setPassword("");await load(d.access_token)}catch(e){setStatus("Connection failed: "+e.message)}}
 async function load(t=token){if(!t)return;try{const d=await api(t);setProducts(d.products||[]);setStatus("Ready. Found "+(d.products||[]).length+" products.")}catch(e){setStatus("Please reconnect: "+e.message)}}
 async function one(p,t=token){return api(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id})})}
 async function all(){setBusy(true);let done=0,removed=0,errors=0;for(const p of products){setStatus("Cleaning "+(done+1)+"/"+products.length+": "+p.title);try{const d=await one(p);removed+=Number(d.cleanup?.removed_options||0)}catch{errors++}done++}setBusy(false);await load();setStatus("Finished. Cleaned "+(done-errors)+" products. Removed "+removed+" bad/empty options. Errors: "+errors+".")}
 return <main style={{maxWidth:1180,margin:"40px auto",padding:"0 20px"}}>
  <h1>Product Organizer</h1>
  <p>Professional cleanup for all TMBTY products: removes promo/empty options, renames options, keeps option images, removes duplicate review photos, improves titles/descriptions, removes supplier/store language, and takes products below 4.7 rating off the public storefront.</p>
  {!token?<section style={box}><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email" style={input}/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" style={input}/><button onClick={login} style={primary}>Connect</button></section>:<>
   <section style={box}><button disabled={busy} onClick={all} style={primary}>Clean & organize all products</button><button disabled={busy} onClick={()=>load()} style={secondary}>Reload preview</button><div style={{marginTop:12}}>{status}</div></section>
   <div style={{marginTop:18,overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th>Current</th><th>Professional result</th><th>Options</th><th>Images</th><th>Reviews</th><th>Action</th></tr></thead><tbody>{products.map(p=><tr key={p.id} style={{borderTop:"1px solid #eee",verticalAlign:"top"}}><td style={td}>{p.title}</td><td style={td}><strong>{p.preview?.title}</strong><div>{p.preview?.description}</div></td><td style={td}>{p.preview?.cleanup?.option_count||0} clean / remove {p.preview?.cleanup?.removed_options||0}</td><td style={td}>{p.preview?.cleanup?.image_count||0}</td><td style={td}><div>{p.preview?.cleanup?.review_count||0} reviews</div><div>Rating: {p.preview?.cleanup?.average_rating??"—"}</div><div style={{color:"#a45"}}>Remove {p.preview?.cleanup?.removed_review_images||0} duplicate photos</div>{p.preview?.cleanup?.removed_from_store?<strong style={{color:"#b00020"}}>Hide from store (&lt;4.7)</strong>:null}</td><td style={td}><button disabled={busy} onClick={async()=>{setBusy(true);try{await one(p);await load();setStatus("Cleaned "+p.title)}catch(e){setStatus("Error: "+e.message)}setBusy(false)}} style={secondary}>Clean</button></td></tr>)}</tbody></table></div>
  </>}
 </main>
}
const box={display:"flex",gap:10,flexWrap:"wrap",marginTop:20,padding:18,border:"1px solid #eadfe7",borderRadius:14};
const input={padding:"10px 12px",border:"1px solid #d9ccd5",borderRadius:8};
const primary={padding:"10px 14px",border:0,borderRadius:8,background:"#76516f",color:"#fff",fontWeight:700};
const secondary={padding:"10px 14px",border:"1px solid #d9ccd5",borderRadius:8,background:"#fff",fontWeight:700};
const td={padding:"12px",minWidth:150};
