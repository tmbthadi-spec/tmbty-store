"use client";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";

function normalizeVariants(variants){
  if(!Array.isArray(variants)) return [];
  return variants.map((v,i)=>{
    if(typeof v==="string") return {name:v,image:"",selected:false,key:v+"-"+i};
    const name=String(v?.name||v?.label||v?.value||"").trim();
    const image=String(v?.image||v?.image_url||v?.img||"").trim();
    return {name,image,selected:!!v?.selected,key:(name||"option")+"-"+i};
  }).filter(v=>v.name);
}

export default function ProductConfigurator({ product, description, keywords=[] }) {
  const { add } = useCart();
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const variants = useMemo(()=>normalizeVariants(product.variants),[product.variants]);
  const initialVariant = variants.find(v=>v.selected) || variants.find(v=>v.name===product.selected_color) || variants[0] || null;
  const [selectedVariant,setSelectedVariant] = useState(initialVariant);
  const [active,setActive] = useState({type:"image",value:initialVariant?.image || images[0] || ""});

  const selectVariant=(v)=>{
    setSelectedVariant(v);
    if(v.image) setActive({type:"image",value:v.image});
  };

  const addItem=()=>{
    add({
      ...product,
      selectedVariant:selectedVariant ? {name:selectedVariant.name,image:selectedVariant.image||""} : null,
      cartImage:selectedVariant?.image || images[0] || ""
    });
  };

  return <div className="productConfigurator">
    <div className="productMedia">
      <div className="mediaStage">
        {active.type==="video" && product.video_url
          ? <video className="mediaMain" controls autoPlay playsInline poster={images[0]||undefined} src={product.video_url}/>
          : active.value
            ? <img className="mediaMain" src={active.value} alt={product.title}/>
            : <div className="mediaEmpty">TMBTY</div>}
      </div>

      <div className="mediaThumbs">
        {product.video_url ? <button type="button" className={"mediaThumb videoThumb"+(active.type==="video"?" active":"")} onClick={()=>setActive({type:"video",value:product.video_url})} aria-label="Play product video">
          {images[0] ? <img src={images[0]} alt=""/> : null}
          <span className="playBadge">▶</span><span className="videoLabel">Video</span>
        </button> : null}
        {images.slice(0,8).map((u,i)=><button type="button" className={"mediaThumb"+(active.type==="image"&&active.value===u?" active":"")} onClick={()=>setActive({type:"image",value:u})} key={u+i} aria-label={i===0?"View original product cover":`View ${product.title} image ${i+1}`}>
          <img src={u} alt={i===0?`${product.title} original cover`:`${product.title} view ${i+1}`}/>
        </button>)}
      </div>
    </div>

    <div className="productInfo">
      <div className="cat">{product.category}{product.subcategory ? ` · ${product.subcategory}` : ""}</div>
      <h1 className="productTitle">{product.title}</h1>
      <div className="price productPrice">${Number(product.retail_price||0).toFixed(2)}</div>

      {variants.length ? <section className="variantSection">
        <div className="variantHeading"><strong>Choose an option</strong>{selectedVariant?.name ? <span>{selectedVariant.name}</span> : null}</div>
        <div className="variantGrid">
          {variants.map(v=><button type="button" key={v.key} className={"variantChoice"+(selectedVariant?.key===v.key?" selected":"")} onClick={()=>selectVariant(v)} title={v.name}>
            {v.image ? <img src={v.image} alt={v.name}/> : <span className="variantTextOnly">{v.name}</span>}
            <span className="variantName">{v.name}</span>
          </button>)}
        </div>
      </section> : null}

      <div className="cuteDescription">
        <div className="descSparkle">♡</div>
        <p>{description}</p>
      </div>

      {keywords.length ? <div className="styleTags" aria-label="Product style tags">
        {keywords.map(k=><span className="styleTag" key={k}>{k}</span>)}
      </div> : null}

      <button className="buyButton" onClick={addItem}>Add to Cart</button>
      <p className="shippingNote">Secure checkout · Shipping shown at checkout</p>
    </div>
  </div>;
}
