"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "tmbty_cart_v3";
const SUPABASE_URL = "https://dchbrrnywealudwripwq.supabase.co";
const SUPABASE_KEY = "sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setCart(saved);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(cart));
  }, [cart, ready]);

  const add = (product) => {
    const variant = product.selectedVariant?.name || "";
    const cartKey = product.id + "::" + variant;
    setCart(prev => {
      const found = prev.find(x => x.cartKey === cartKey);
      if (found) return prev.map(x => x.cartKey === cartKey ? {...x, qty:x.qty+1} : x);
      return [...prev, {
        cartKey,
        id: product.id,
        title: product.title,
        variant: variant || null,
        price: Number(product.retail_price || 0),
        image: product.cartImage || (Array.isArray(product.images) ? (product.images[0] || "") : ""),
        qty: 1
      }];
    });
    setOpen(true);
  };

  const changeQty = (cartKey, delta) => {
    setCart(prev => prev
      .map(x => x.cartKey === cartKey ? {...x, qty:x.qty+delta} : x)
      .filter(x => x.qty > 0));
  };

  const remove = cartKey => setCart(prev => prev.filter(x => x.cartKey !== cartKey));
  const clear = () => setCart([]);
  const count = useMemo(() => cart.reduce((a,b)=>a+b.qty,0), [cart]);
  const subtotal = useMemo(() => cart.reduce((a,b)=>a+b.price*b.qty,0), [cart]);

  const checkout = async () => {
    if (!cart.length) return;
    setStatus("Opening secure checkout...");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/tmbty-create-checkout`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i=>({id:i.id,qty:i.qty,variant:i.variant||null})),
          origin: window.location.origin
        })
      });
      const d = await r.json();
      if (!r.ok || !d.url) throw new Error(d.error || d.message || "Checkout could not be created.");
      window.location.href = d.url;
    } catch (e) {
      setStatus(String(e.message || e));
    }
  };

  return <CartContext.Provider value={{cart,add,changeQty,remove,clear,count,subtotal,open,setOpen,status,setStatus,checkout}}>
    {children}
  </CartContext.Provider>
}

export function useCart() { return useContext(CartContext); }
