"use client";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import RatingStars from "./RatingStars";

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

function normalizeReviews(reviews){
  if(!Array.isArray(reviews)) return [];
  const seen=new Set();
  return reviews.map((r,i)=>{
    const text=String(r?.text||"").trim().replace(/\s+/g," ");
    if(text.length<8) return null;
    if(/official st|official store|\d[\d,]*\+?\s*sold\b|all from verified purchases|sort by default|related items|you may also like|more to love/i.test(text)) return null;
    const ratingNum=Number(r?.rating);
    const rating=Number.isFinite(ratingNum)&&ratingNum>=1&&ratingNum<=5?ratingNum:null;
    if(!rating) return null;
    const key=text.toLowerCase();
    if(seen.has(key)) return null;
    seen.add(key);
    const images=Array.isArray(r?.images)?r.images.filter(Boolean).slice(0,6):[];
    const date=String(r?.date||"").trim();
    let reviewer_name=String(r?.reviewer_name||r?.reviewerName||r?.name||"").trim();
    if(/aliexpress/i.test(reviewer_name)) reviewer_name="";
    if(!reviewer_name) reviewer_name="Verified Customer";
    return {text,rating,images,date,reviewer_name,key:`review-${i}`};
  }).filter(Boolean).slice(0,20);
}

function normalizeVariants(variants, selectedColor, fallbackImage){
  const list = Array.isArray(variants) ? variants.map((v,i)=>{
    if(typeof v==="string") return {name:prettifyOptionName(v),rawName:v,image:"",selected:false,key:v+"-"+i};
    const rawName=String(v?.name||v?.label||v?.value||"").trim();
    const image=String(v?.image||v?.image_url||v?.img||"").trim();
    const group=String(v?.group||v?.group_name||v?.groupName||v?.property||v?.property_name||v?.propertyName||v?.option_group||v?.optionGroup||"").trim();
    return {name:prettifyOptionName(rawName),rawName,image,group,selected:!!v?.selected,key:(group||"option")+"-"+(rawName||"option")+"-"+i};
  }).filter(v=>v.rawName) : [];
  if(!list.length && selectedColor) return [{name:prettifyOptionName(selectedColor),rawName:selectedColor,image:fallbackImage||"",selected:true,key:"fallback"}];
  return list;
}

function optionAwareTitle(baseTitle,selectedVariant){
  const base=String(baseTitle||"").trim();
  const baseCore=base.split(/[–—|]/)[0].trim();
  const option=String(selectedVariant?.name||"").trim();
  if(!option) return base;

  const colorWords=["black","white","cream","ivory","beige","brown","tan","gray","grey","silver","gold","golden","rose gold","red","rose red","burgundy","wine","pink","hot pink","blush","fuchsia","orange","yellow","mustard","green","olive","lime","mint","emerald","teal","turquoise","blue","navy","sky blue","royal blue","purple","lavender","lilac","violet","multicolor","colorful","clear"];
  const isColor=colorWords.some(x=>new RegExp("^"+x.replace(/ /g,"\\\\s+")+"$","i").test(option));
  if(isColor){
    const cleaned=base.replace(new RegExp("^("+colorWords.sort((a,b)=>b.length-a.length).map(x=>x.replace(/ /g,"\\\\s+")).join("|")+")\\\\s+","i"),"");
    return `${option.replace(/\\b\\w/g,ch=>ch.toUpperCase())} ${cleaned}`.trim();
  }
  if(/mixed media/i.test(option)) return `Mixed Media ${base.replace(/^(?:[A-Za-z]+(?:\\s+[A-Za-z]+)?\\s+)?/,"")||base}`;
  return base;
}

export default function ProductConfigurator({ product, description, keywords=[], relatedProducts=[] }) {
  const { add } = useCart();
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const reviews = useMemo(()=>normalizeReviews(product.reviews),[product.reviews]);
  const variants = useMemo(()=>normalizeVariants(product.variants,product.selected_color,images[0]),[product.variants,product.selected_color,images]);

  const optionGroups = useMemo(()=>{
    const groups=[];
    const byName=new Map();
    for(const v of variants){
      const name=String(v.group||"").trim() || "Color / Style";
      if(!byName.has(name)){
        const g={name,options:[]};
        byName.set(name,g);
        groups.push(g);
      }
      byName.get(name).options.push(v);
    }
    return groups;
  },[variants]);

  const [selectedOptions,setSelectedOptions] = useState(()=>{
    const initial={};
    for(const g of optionGroups){
      initial[g.name] =
        g.options.find(v=>v.selected) ||
        g.options.find(v=>v.rawName===product.selected_color) ||
        g.options[0] ||
        null;
    }
    return initial;
  });

  const selectedVariant =
    optionGroups.map(g=>selectedOptions[g.name]).find(v=>v?.image) ||
    optionGroups.map(g=>selectedOptions[g.name]).find(Boolean) ||
    null;

  const [active,setActive] = useState({type:"image",value:images[0] || selectedVariant?.image || ""});
  const displayTitle = optionAwareTitle(product.title, selectedVariant);

  const selectVariant=(groupName,v)=>{
    setSelectedOptions(prev=>({...prev,[groupName]:v}));
    if(v.image) setActive({type:"image",value:v.image});
  };

  const selectedOptionList = optionGroups
    .map(g=>({group:g.name,value:selectedOptions[g.name]}))
    .filter(x=>x.value);

  const addItem=()=>{
    if(optionGroups.length && selectedOptionList.length!==optionGroups.length) return;
    const optionText = selectedOptionList.map(x=>
      x.group==="Color / Style" ? x.value.name : `${x.group}: ${x.value.name}`
    ).join(" / ");
    add({
      ...product,
      title:displayTitle,
      selectedVariant:optionText ? {name:optionText,image:selectedVariant?.image||""} : null,
      selectedOptions:selectedOptionList.map(x=>({group:x.group,name:x.value.name,rawName:x.value.rawName,image:x.value.image||""})),
      cartImage:selectedVariant?.image || images[0] || ""
    });
  };

  const productUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${displayTitle} - TMBTY`;
  const cleanDescription = String(description||"").replace(/\s+/g," ").trim();
  const pinKeywords = (Array.isArray(keywords)?keywords:[]).filter(Boolean).slice(0,6).join(", ");
  const pinterestDescription = [
    displayTitle,
    cleanDescription,
    pinKeywords ? `Shop/search: ${pinKeywords}` : "",
    "TMBTY"
  ].filter(Boolean).join(" | ").slice(0,500);
  const shareImage = images[0] || selectedVariant?.image || "";

  const pinMedia = (mediaUrl) => {
    const url = encodeURIComponent(productUrl);
    const text = encodeURIComponent(pinterestDescription);
    const media = encodeURIComponent(mediaUrl || images[0] || "");
    window.open(`https://www.pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${text}`,"_blank","noopener,noreferrer");
  };

  const openShare = (type) => {
    const url = encodeURIComponent(productUrl);
    const text = encodeURIComponent(pinterestDescription);
    const media = encodeURIComponent(shareImage);
    if(type==="pinterest") return window.open(`https://www.pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${text}`,"_blank","noopener,noreferrer");
    if(type==="facebook") return window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`,"_blank","noopener,noreferrer");
    if(navigator.share){
      return navigator.share({title:displayTitle,text:pinterestDescription,url:productUrl}).catch(()=>{});
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
          {images.slice(0,8).map((u,i)=><div className="fashionThumbWrap" key={u+i}>
            <button className={"fashionThumb"+(active.type==="image"&&active.value===u?" active":"")} onClick={()=>setActive({type:"image",value:u})}>
              <img src={u} alt={i===0?`${product.title} cover`:`${product.title} image ${i+1}`}/>
            </button>
            <button type="button" className="pinItThumb" onClick={(e)=>{e.stopPropagation();pinMedia(u)}} aria-label={`Pin ${displayTitle} image ${i+1} to Pinterest`}>Pin it</button>
          </div>)}
        </div>
        <div className="fashionMainMedia">
          {active.type==="video" && product.video_url
            ? <>
                <video controls autoPlay playsInline poster={images[0]||undefined} src={product.video_url}/>
                <button type="button" className="pinItMain" onClick={()=>pinMedia(images[0]||"")} aria-label="Pin this product to Pinterest">Pin it</button>
              </>
            : active.value ? <>
                <img src={active.value} alt={displayTitle}/>
                <button type="button" className="pinItMain" onClick={()=>pinMedia(active.value)} aria-label="Pin this image to Pinterest">Pin it</button>
              </> : <div className="mediaEmpty">TMBTY</div>}
        </div>
      </div>

      <aside className="fashionInfo">
        <div className="fashionCategory">{product.category}{product.subcategory ? ` / ${product.subcategory}` : ""}</div>
        <h1>{displayTitle}</h1>
        <RatingStars reviews={product.reviews||[]} rating={product.rating} />
        <div className="fashionPrice">${Number(product.retail_price||0).toFixed(2)}</div>

        {optionGroups.map(group=><section className="fashionOptions" key={group.name}>
          <div className="fashionOptionHeading">
            <strong>{group.name}</strong>
            <span>{selectedOptions[group.name]?.name || "Select an option"}</span>
          </div>
          <div className="fashionSwatches">
            {group.options.map(v=><button type="button" key={v.key} className={"fashionSwatch"+(selectedOptions[group.name]?.key===v.key?" selected":"")} onClick={()=>selectVariant(group.name,v)} title={v.name}>
              {v.image ? <img src={v.image} alt={v.name}/> : <span className="swatchFallback">{v.name}</span>}
              <small>{v.name}</small>
            </button>)}
          </div>
        </section>)}

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
          {selectedOptionList.length ? <div><span>Options</span><strong>{selectedOptionList.map(x=>x.group==="Color / Style"?x.value.name:`${x.group}: ${x.value.name}`).join(" / ")}</strong></div> : null}
        </div>
      </div>

      <div className="detailsBlock descriptionBlock">
        <h2>Description</h2>
        <p>{description}</p>
      </div>

      <div className="detailsBlock specsBlock">
        <h2>Why You'll Love It</h2>
        <ul>
          <li>Curated for a beautiful kitchen, dining table or home</li>
          <li>Designed to add practical function with decorative appeal</li>
          <li>Multiple colors, sizes or styles available when shown above</li>
          <li>Secure checkout through TMBTY</li>
        </ul>
      </div>

      {reviews.length ? <div className="productReviews">
        <div className="productReviewsHeader">
          <h2>Product Reviews</h2>
          <span>{reviews.length} review{reviews.length===1?"":"s"}</span>
        </div>
        <div className="productReviewList">
          {reviews.map(r=><article className="productReviewCard" key={r.key}>
            <div className="productReviewMeta">
              <div>
                {r.reviewer_name ? <strong className="reviewerName">{r.reviewer_name}</strong> : null}
                <strong className="reviewStars" aria-label={`${r.rating} out of 5 stars`}>
  <span className="filledStars">{"★".repeat(Math.round(r.rating))}</span>
  <span className="emptyStars">{"★".repeat(Math.max(0,5-Math.round(r.rating)))}</span>
  <em>{Number(r.rating).toFixed(1)}</em>
</strong>
              </div>
              {r.date ? <time>{r.date}</time> : null}
            </div>
            <p>{r.text}</p>
            {r.images.length ? <div className="reviewImages">
              {r.images.map((u,i)=><a href={u} target="_blank" rel="noreferrer" key={u+i}><img src={u} alt={`Customer review photo ${i+1}`}/></a>)}
            </div> : null}
          </article>)}
        </div>
      </div> : null}

      {relatedProducts.length ? <div className="relatedProducts">
        <div className="relatedHeader">
          <h2>You May Also Like</h2>
          <span>More kitchen & dining finds picked for you</span>
        </div>
        <div className="relatedGrid">
          {relatedProducts.map(r=><a className="relatedCard" href={`/products/${r.slug}`} key={r.id}>
            <div className="relatedImageWrap">
              {r.images?.[0] ? <img src={r.images[0]} alt={r.title}/> : <div className="relatedEmpty">TMBTY</div>}
            </div>
            <div className="relatedBody">
              <div className="relatedTitle">{r.title}</div>
              <RatingStars reviews={r.reviews||[]} rating={r.rating} compact />
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
