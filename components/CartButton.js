"use client";
import { useCart } from "./CartProvider";

export default function CartButton(){
  const { count, setOpen } = useCart();
  return <button className="cartButton" onClick={()=>setOpen(true)}>Cart ({count})</button>
}