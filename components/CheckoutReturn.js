"use client";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

const SUPABASE_URL = "https://dchbrrnywealudwripwq.supabase.co";
const SUPABASE_KEY = "sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";

export default function CheckoutReturn(){
  const { clear, setOpen, setStatus } = useCart();
  const [notice,setNotice]=useState(null);

  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    const state=p.get("checkout");
    const sessionId=p.get("session_id");

    if(state==="cancelled"){
      setNotice({type:"info",text:"Checkout was cancelled. Your cart is still saved."});
      setOpen(true);
      setStatus("Checkout was cancelled. Your cart is still saved.");
      return;
    }

    if(state!=="success" || !sessionId) return;

    setNotice({type:"success",text:"Confirming your payment..."});
    (async()=>{
      try{
        const r=await fetch(`${SUPABASE_URL}/functions/v1/tmbty-verify-checkout`,{
          method:"POST",
          headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},
          body:JSON.stringify({session_id:sessionId})
        });
        const d=await r.json();
        if(!r.ok) throw new Error(d.error||d.message||"Could not verify payment.");
        if(d.paid){
          clear();
          const order=d.order?.order_number ? ` Order: ${d.order.order_number}.` : "";
          setNotice({type:"success",text:`Thank you — payment received.${order} We will prepare your order for shipment.`});
          window.history.replaceState(null,"",window.location.pathname);
        }else{
          setNotice({type:"info",text:"Your payment is still processing. Please keep your Stripe confirmation."});
        }
      }catch{
        setNotice({type:"info",text:"Checkout returned successfully, but payment confirmation could not be loaded yet. Please keep your Stripe confirmation."});
      }
    })();
  },[]);

  if(!notice) return null;
  return <div className={`checkoutNotice ${notice.type}`}>{notice.text}</div>
}