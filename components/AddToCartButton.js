"use client";
import { useCart } from "./CartProvider";

export default function AddToCartButton({product}){
  const { add } = useCart();
  return <button className="buyButton" onClick={()=>add(product)}>Add to Cart</button>
}