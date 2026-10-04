"use client";
import { useCart } from "./CartProvider";

export default function CartDrawer(){
  const {cart,open,setOpen,changeQty,remove,subtotal,status,checkout}=useCart();
  if(!open) return null;
  return <div className="cartOverlay" onClick={e=>{if(e.target.classList.contains("cartOverlay")) setOpen(false)}}>
    <aside className="cartPanel">
      <button className="cartClose" onClick={()=>setOpen(false)}>×</button>
      <h2>Your Cart</h2>
      {!cart.length ? <p className="muted">Your cart is empty.</p> :
        <>
          {cart.map(i=><div className="cartRow" key={i.cartKey||i.id}>
            {i.image ? <img src={i.image} alt={i.title} /> : <div />}
            <div>
              <strong>{i.title}</strong>
              {i.variant ? <div className="cartVariant">Option: {i.variant}</div> : null}
              <div>${i.price.toFixed(2)}</div>
              <div className="qty">
                <button onClick={()=>changeQty(i.cartKey||i.id,-1)}>−</button>
                <span>{i.qty}</span>
                <button onClick={()=>changeQty(i.cartKey||i.id,1)}>+</button>
                <button onClick={()=>remove(i.cartKey||i.id)} className="removeBtn">Remove</button>
              </div>
            </div>
            <strong>${(i.price*i.qty).toFixed(2)}</strong>
          </div>)}
          <div className="cartSummary">
            <div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
            <p className="muted small">Shipping is shown during checkout when available.</p>
            <button className="checkoutBtn" onClick={checkout}>Secure Checkout</button>
            {status ? <div className="small muted">{status}</div> : null}
          </div>
        </>
      }
    </aside>
  </div>
}