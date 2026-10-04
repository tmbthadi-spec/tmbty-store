"use client";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";

function normalizeVariants(variants, selectedColor, fallbackImage){
  const list = Array.isArray(variants) ? variants.map((v,i)=>{
    if(typeof v==="string") return {name:v,image:"",selected:false,key:v+"-"+i};
    const name=String(v?.name||v?.label||v?.value||"").trim();
    const image=String(v?.image||v?.image_url||v?.img||"").trim();
    return {name,image,selected:!!v?.selected,key:(name||"option")+"-"+i};
  }).filter(v=>v.name) : [];
  if(!list.length && selectedColor) return [{name:selectedColor,image:fallbackImage||"",selected:true,key:"fallback"}];
  return list;
}

export default function ProductConfigurator({ product, description, keywords=[] }) {
  const { add } = useCart();
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const variants = useMemo(()=>normalizeVariants(product.variants,product.selected_color,images[0]),[product.variants,product.selected_color,images]);
  const initialVariant = variants.find(v=>v.selected) || variants.find(v=>v.name===product.selected_color) || variants[0] || null;
  const [selectedVariant,setSelectedVariant] = useState(initialVariant);
  const [active,setActive] = useState({type:"image",value:initialVariant?.image || images[0] || ""});

  const selectVariant=(v)=>{
    setSelectedVariant(v);
    if(v.image) setActive({type:"image",value:v.image});
  };

  const addItem=()=>{
    if(variants.length && !selectedVariant) return;
    add({
      ...product,
      selectedVariant:selectedVariant ? {name:selectedVariant.name,image:selectedVariant.image||""} : null,
      cartImage:selectedVariant?.image || images[0] || ""
    });
  };

  return <>
    <section className="sheinProduct">
      <div className="sheinMedia">
        <div className="sheinThumbRail">
          {product.video_url ? <button className={"sheinThumb videoThumb"+(active.type==="video"?" active":"")} onClick={()=>setActive({type:"video",value:product.video_url})} aria-label="Play product video">
            {images[0] ? <img src={images[0]} alt=""/> : null}<span className="playBadge">▶</span>
          </button> : null}
          {images.slice(0,8).map((u,i)=><button className={"sheinThumb"+(active.type==="image"&&active.value===u?" active":"")} onClick={()=>setActive({type:"image",value:u})} key={u+i}>
            <img src={u} alt={i===0?`${product.title} cover`:`${product.title} image ${i+1}`}/>
          </button>)}
        </div>
        <div className="sheinMainMedia">
          {active.type==="video" && product.video_url
            ? <video controls autoPlay playsInline poster={images[0]||undefined} src={product.video_url}/>
            : active.value ? <img src={active.value} alt={product.title}/> : <div className="mediaEmpty">TMBTY</div>}
        </div>
      </div>

      <div className="sheinInfo">
        <div className="sheinCategory">{product.category}{product.subcategory ? ` / ${product.subcategory}` : ""}</div>
        <h1>{product.title}</h1>
        <div className="sheinPrice">${Number(product.retail_price||0).toFixed(2)}</div>
        <div className="sheinPayNote">Secure checkout • Easy shopping with TMBTY</div>

        {variants.length ? <div className="sheinOptions">
          <div className="sheinOptionTitle"><strong>Option:</strong> <span>{selectedVariant?.name || "Please choose"}</span></div>
          <div className="sheinSwatches">
            {variants.map(v=><button type="button" key={v.key} className={"sheinSwatch"+(selectedVariant?.key===v.key?" selected":"")} onClick={()=>selectVariant(v)} title={v.name}>
              {v.image ? <img src={v.image} alt={v.name}/> : <span>{v.name}</span>}
            </button>)}
          </div>
        </div> : null}

        <button className="sheinAdd" onClick={addItem}>ADD TO CART</button>

        <div className="sheinService">
          <div><strong>🚚 Shipping</strong><span>Calculated at secure checkout</span></div>
          <div><strong>↩ Returns</strong><span>Review our return policy before ordering</span></div>
          <div><strong>🔒 Secure payment</strong><span>Checkout is securely processed</span></div>
        </div>
      </div>
    </section>

    <section className="sheinDetails">
      <h2>Product Details</h2>
      <div className="detailRows">
        <div><span>Category</span><strong>{product.category || "—"}</strong></div>
        <div><span>Type</span><strong>{product.subcategory || "—"}</strong></div>
        {product.selected_color ? <div><span>Selected option</span><strong>{product.selected_color}</strong></div> : null}
        <div><span>Brand</span><strong>TMBTY</strong></div>
      </div>

      <div className="sheinDescription">
        <h2>Description</h2>
        <p>{description}</p>
      </div>

      {keywords.length ? <div className="bottomSeo">
        <h3>Style & Search Tags</h3>
        <div className="styleTags">
          {keywords.map(k=><span className="styleTag" key={k}>{k}</span>)}
        </div>
      </div> : null}
    </section>
  </>;
}
