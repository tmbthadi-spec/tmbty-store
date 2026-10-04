"use client";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";

function prettifyOptionName(name){
  if(!name) return "";
  const raw=String(name).trim();
  const map={
    "001":"Green Flower",
    "002":"White Flower",
    "003":"Pearl",
    "004":"Black",
    "005":"Silver",
    "006":"Gold",
    "007":"Pink",
    "008":"Blue",
    "009 red":"Red",
    "009":"Red"
  };
  return map[raw.toLowerCase()] || map[raw] || raw
    .replace(/^\d{3}\s*/,"")
    .replace(/\b(stud|earring|earrings)\b/gi,"")
    .replace(/\s+/g," ")
    .trim()
    .replace(/\b\w/g,c=>c.toUpperCase()) || raw;
}

function normalizeVariants(variants, selectedColor, fallbackImage){
  const list = Array.isArray(variants) ? variants.map((v,i)=>{
    if(typeof v==="string") return {name:prettifyOptionName(v),rawName:v,image:"",selected:false,key:v+"-"+i};
    const rawName=String(v?.name||v?.label||v?.value||"").trim();
    const image=String(v?.image||v?.image_url||v?.img||"").trim();
    return {name:prettifyOptionName(rawName),rawName,image,selected:!!v?.selected,key:(rawName||"option")+"-"+i};
  }).filter(v=>v.rawName) : [];
  if(!list.length && selectedColor) return [{name:prettifyOptionName(selectedColor),rawName:selectedColor,image:fallbackImage||"",selected:true,key:"fallback"}];
  return list;
}

export default function ProductConfigurator({ product, description, keywords=[], relatedProducts=[] }) {
  const { add } = useCart();
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const variants = useMemo(()=>normalizeVariants(product.variants,product.selected_color,images[0]),[product.variants,product.selected_color,images]);
  const initialVariant = variants.find(v=>v.selected) || variants.find(v=>v.rawName===product.selected_color) || variants[0] || null;
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

  const productUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${product.title} - TMBTY`;
  const shareImage = selectedVariant?.image || images[0] || "";

  const openShare = (type) => {
    const url = encodeURIComponent(productUrl);
    const text = encodeURIComponent(shareText);
    const media = encodeURIComponent(shareImage);
    if(type==="pinterest") return window.open(`https://www.pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${text}`,"_blank","noopener,noreferrer");
    if(type==="facebook") return window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`,"_blank","noopener,noreferrer");
    if(navigator.share){
      return navigator.share({title:product.title,text:shareText,url:productUrl}).catch(()=>{});
    }
    navigator.clipboard?.writeText(productUrl);
    alert("Product link copied. Paste it into your social post.");
  };

  return <>
    <section className="fashionProduct">
      <div className="fashionMedia">
        <div className="fashionThumbRail">
          {product.video_url ? <button className={"fashionThumb videoThumb"+(active.type==="video"?" active":"")} onClick={()=>setActive({type:"video",value:product.video_url})} aria-label="Play product video">
            {images[0] ? <img src={images[0]} alt=""/> : null}<span className="playBadge">▶</span>
          </button> : null}
          {images.slice(0,8).map((u,i)=><button className={"fashionThumb"+(active.type==="image"&&active.value===u?" active":"")} onClick={()=>setActive({type:"image",value:u})} key={u+i}>
            <img src={u} alt={i===0?`${product.title} cover`:`${product.title} image ${i+1}`}/>
          </button>)}
        </div>
        <div className="fashionMainMedia">
          {active.type==="video" && product.video_url
            ? <video controls autoPlay playsInline poster={images[0]||undefined} src={product.video_url}/>
            : active.value ? <img src={active.value} alt={product.title}/> : <div className="mediaEmpty">TMBTY</div>}
        </div>
      </div>

      <aside className="fashionInfo">
        <div className="fashionCategory">{product.category}{product.subcategory ? ` / ${product.subcategory}` : ""}</div>
        <h1>{product.title}</h1>
        <div className="fashionPrice">${Number(product.retail_price||0).toFixed(2)}</div>

        {variants.length ? <section className="fashionOptions">
          <div className="fashionOptionHeading">
            <strong>Color / Style</strong>
            <span>{selectedVariant?.name || "Select an option"}</span>
          </div>
          <div className="fashionSwatches">
            {variants.map(v=><button type="button" key={v.key} className={"fashionSwatch"+(selectedVariant?.key===v.key?" selected":"")} onClick={()=>selectVariant(v)} title={v.name}>
              {v.image ? <img src={v.image} alt={v.name}/> : <span className="swatchFallback">{v.name}</span>}
              <small>{v.name}</small>
            </button>)}
          </div>
        </section> : null}

        <button className="fashionAdd" onClick={addItem}>ADD TO CART</button>

        <div className="fashionInfoRows">
          <div><span>Shipping</span><strong>{product.shipping_eta_text ? `Estimated arrival ${product.shipping_eta_text}` : "Estimated at checkout"}</strong></div>
        </div>

        <div className="secureCheckoutBox" aria-label="Secure checkout">
          <div className="secureCheckoutTitle">GUARANTEED SAFE CHECKOUT</div>
          <div className="paymentBadges">
            <span className="payBadge paypal">PayPal</span>
            <span className="payBadge stripe">Stripe</span>
            <span className="payBadge visa">VISA</span>
            <span className="payBadge mastercard">Mastercard</span>
            <span className="payBadge amex">AMEX</span>
            <span className="payBadge discover">Discover</span>
          </div>
          <div className="secureCheckoutNote">Secure payment processing at checkout</div>
        </div>

        <div className="productShare">
          <span className="shareLabel">Share</span>
          <div className="shareButtons">
            <button type="button" className="shareBtn pinterestShare" onClick={()=>openShare("pinterest")} aria-label="Share on Pinterest">P</button>
            <button type="button" className="shareBtn facebookShare" onClick={()=>openShare("facebook")} aria-label="Share on Facebook">f</button>
            <button type="button" className="shareBtn instagramShare" onClick={()=>openShare("instagram")} aria-label="Share on Instagram">◎</button>
            <button type="button" className="shareBtn tiktokShare" onClick={()=>openShare("tiktok")} aria-label="Share on TikTok">♪</button>
            <button type="button" className="shareBtn youtubeShare" onClick={()=>openShare("youtube")} aria-label="Share on YouTube">▶</button>
          </div>
          <div className="shareHint">Pinterest and Facebook open directly. Other apps use your device share menu.</div>
        </div>
      </aside>
    </section>

    <section className="fashionDetails">
      <div className="detailsBlock">
        <h2>Product Details</h2>
        <div className="detailsGrid">
          <div><span>Category</span><strong>{product.category || "—"}</strong></div>
          <div><span>Type</span><strong>{product.subcategory || "—"}</strong></div>
          {selectedVariant?.name ? <div><span>Style</span><strong>{selectedVariant.name}</strong></div> : null}
        </div>
      </div>

      <div className="detailsBlock descriptionBlock">
        <h2>Description</h2>
        <p>{description}</p>
      </div>

      <div className="detailsBlock specsBlock">
        <h2>Why You'll Love It</h2>
        <ul>
          <li>Easy to style with everyday and occasion looks</li>
          <li>Lightweight fashion accessory design</li>
          <li>Multiple styles available when shown above</li>
          <li>Secure checkout through TMBTY</li>
        </ul>
      </div>

      {relatedProducts.length ? <div className="relatedProducts">
        <div className="relatedHeader">
          <h2>You May Also Like</h2>
          <span>More styles picked for you</span>
        </div>
        <div className="relatedGrid">
          {relatedProducts.map(r=><a className="relatedCard" href={`/products/${r.slug}`} key={r.id}>
            <div className="relatedImageWrap">
              {r.images?.[0] ? <img src={r.images[0]} alt={r.title}/> : <div className="relatedEmpty">TMBTY</div>}
            </div>
            <div className="relatedBody">
              <div className="relatedTitle">{r.title}</div>
              <div className="relatedPrice">${Number(r.retail_price||0).toFixed(2)}</div>
            </div>
          </a>)}
        </div>
      </div> : null}

      {keywords.length ? <div className="seoFooterTags" aria-label="Product search terms">
        {keywords.map(k=><span key={k}>{k}</span>)}
      </div> : null}
    </section>
  </>;
}
