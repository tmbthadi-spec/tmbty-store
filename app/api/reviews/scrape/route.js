import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPABASE_URL = "https://dchbrrnywealudwripwq.supabase.co";
const SUPABASE_KEY = "sb_publishable_VZv2J1E4sAxQHIQs-NK7rQ_YJ3AK7Ws";

function clean(v=""){ return String(v||"").replace(/\s+/g," ").trim(); }

async function verifyUser(req){
  const auth=req.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")) return false;
  const r=await fetch(SUPABASE_URL+"/auth/v1/user",{
    headers:{apikey:SUPABASE_KEY,Authorization:auth},
    cache:"no-store"
  });
  return r.ok;
}

function validReview(r){
  if(!r) return false;
  const text=clean(r.text);
  const rating=Number(r.rating);
  if(text.length<5) return false;
  if(!Number.isFinite(rating)||rating<1||rating>5) return false;
  if(/official st|official store|\d[\d,]*\+?\s*sold\b|all from verified purchases|sort by default|related items|you may also like|more to love|seller info|store info|recommended/i.test(text)) return false;
  return true;
}

function normalizePayload(payload){
  const out=[];
  const seen=new Set();

  const visit=(x)=>{
    if(!x) return;
    if(Array.isArray(x)){ x.forEach(visit); return; }
    if(typeof x!=="object") return;

    const text=clean(
      x.review_text ?? x.reviewText ?? x.review ?? x.content ?? x.comment ??
      x.feedback ?? x.body ?? x.message ?? x.reviewContent ?? x.buyerReview ?? ""
    );
    const rating=Number(
      x.rating ?? x.stars ?? x.star_rating ?? x.starRating ?? x.score ??
      x.review_rating ?? x.reviewRating ?? x.star ?? 0
    );
    const reviewer_name=clean(
      x.reviewer_name ?? x.reviewerName ?? x.author_name ?? x.authorName ??
      x.user_name ?? x.userName ?? x.username ?? x.buyer_name ?? x.buyerName ??
      x.customer_name ?? x.customerName ?? x.name ?? ""
    ).slice(0,80);
    const date=clean(
      x.date ?? x.review_date ?? x.reviewDate ?? x.created_at ?? x.createdAt ??
      x.time ?? x.posted_at ?? x.postedAt ?? ""
    ).slice(0,80);

    let images=[];
    const rawImages=x.review_images ?? x.reviewImages ?? x.images ?? x.photos ?? x.image_urls ?? x.imageUrls ?? [];
    if(Array.isArray(rawImages)){
      images=rawImages.map(v=>typeof v==="string"?v:(v?.url||v?.src||v?.image||""))
        .filter(u=>/^https?:\/\//i.test(String(u||"")))
        .slice(0,6);
    }

    const candidate={text,rating,reviewer_name,date,images};
    if(validReview(candidate)){
      const key=(reviewer_name+"|"+text).toLowerCase();
      if(!seen.has(key)){
        seen.add(key);
        out.push(candidate);
      }
    }

    // walk likely containers only to avoid exploding traversal
    for(const k of ["data","result","results","reviews","feedback","feedbacks","list","items","evaluationList","feedbackList","reviewList"]){
      if(x[k]) visit(x[k]);
    }
  };

  visit(payload);
  return out.slice(0,20);
}

function mergeReviews(...groups){
  const out=[];
  const seen=new Set();
  for(const group of groups){
    for(const r of group||[]){
      if(!validReview(r)) continue;
      const key=(clean(r.reviewer_name)+"|"+clean(r.text)).toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      out.push({
        reviewer_name:clean(r.reviewer_name).slice(0,80),
        text:clean(r.text).slice(0,1200),
        rating:Number(r.rating),
        date:clean(r.date).slice(0,80),
        images:Array.isArray(r.images)?r.images.slice(0,6):[]
      });
      if(out.length>=20) return out;
    }
  }
  return out;
}

async function fetchDirectReviews(productId){
  const endpoint="https://feedback.aliexpress.com/pc/searchEvaluation.do?productId="
    +encodeURIComponent(productId)
    +"&lang=en_US&country=US&page=1&pageSize=20&filter=all&sort=complex_default";

  const r=await fetch(endpoint,{
    method:"GET",
    headers:{
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
      "Accept":"application/json,text/plain,*/*",
      "Accept-Language":"en-US,en;q=0.9",
      "Referer":"https://www.aliexpress.us/"
    },
    cache:"no-store"
  });

  const text=await r.text();
  if(!r.ok) return {ok:false,status:r.status,reviews:[],error:"feedback_http_"+r.status};

  let data;
  try{ data=JSON.parse(text); }
  catch{
    const m=text.match(/^[^(]*\((.*)\)\s*;?$/s);
    if(!m) return {ok:false,status:r.status,reviews:[],error:"feedback_not_json"};
    try{ data=JSON.parse(m[1]); }catch{ return {ok:false,status:r.status,reviews:[],error:"feedback_bad_json"}; }
  }

  const list=data?.data?.evaViewList || data?.response?.data?.evaViewList || [];
  if(!Array.isArray(list)) return {ok:true,status:r.status,reviews:[],rawCount:0};

  const reviews=[];
  for(const x of list){
    const buyerEval=Number(x?.buyerEval);
    let rating=Number(x?.rating ?? x?.starRating ?? x?.star);
    if(!Number.isFinite(rating) || rating<1 || rating>5){
      if(Number.isFinite(buyerEval) && buyerEval>0) rating=Math.max(1,Math.min(5,Math.round(buyerEval/20)));
    }

    const textReview=clean(
      x?.buyerTranslationFeedback ||
      x?.buyerFeedback ||
      x?.buyerProductFeedBack ||
      x?.feedback ||
      ""
    );

    const reviewer_name=clean(x?.buyerName || x?.buyerNameMasked || x?.userName || "").slice(0,80);
    const date=clean(x?.evalDate || x?.evaluationDate || x?.date || "").slice(0,80);

    const rawImages=Array.isArray(x?.images)?x.images:
      Array.isArray(x?.imageList)?x.imageList:
      Array.isArray(x?.photos)?x.photos:[];

    const images=rawImages.map(v=>typeof v==="string"?v:(v?.url||v?.src||v?.image||""))
      .filter(u=>/^https?:\/\//i.test(String(u||"")))
      .slice(0,6);

    const candidate={reviewer_name,text:textReview,rating,date,images};
    if(validReview(candidate)) reviews.push(candidate);
    if(reviews.length>=20) break;
  }

  return {ok:true,status:r.status,reviews,rawCount:list.length};
}

export async function POST(req){
  if(!(await verifyUser(req))) return NextResponse.json({error:"unauthorized"},{status:401});

  let body={};
  try{ body=await req.json(); }catch{}
  const url=String(body?.url||"");
  if(!/^https:\/\/(?:www\.)?aliexpress\.(?:us|com)\/item\/\d+\.html/i.test(url)){
    return NextResponse.json({error:"invalid_aliexpress_product_url"},{status:400});
  }

  const productId=url.match(/\/item\/(\d+)\.html/i)?.[1]||"";
  if(productId){
    try{
      const direct=await fetchDirectReviews(productId);
      if(direct.reviews.length){
        return NextResponse.json({
          ok:true,
          source:"aliexpress_feedback_endpoint",
          raw_count:Number(direct.rawCount||0),
          review_count:direct.reviews.length,
          reviews:direct.reviews
        });
      }
    }catch{}
  }

  let browser;
  try{
    browser=await puppeteer.launch({
      args:[...chromium.args,"--disable-blink-features=AutomationControlled","--lang=en-US,en"],
      defaultViewport:{width:1440,height:1200},
      executablePath:await chromium.executablePath(),
      headless:"shell"
    });

    const page=await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({"Accept-Language":"en-US,en;q=0.9"});
    await page.setJavaScriptEnabled(true);

    const networkReviews=[];
    page.on("response",async res=>{
      try{
        const u=res.url();
        if(!/review|feedback|evaluation/i.test(u)) return;
        const ct=res.headers()["content-type"]||"";
        if(!ct.includes("json") && !ct.includes("javascript") && !ct.includes("text")) return;
        const txt=await res.text();
        if(txt.length>2_000_000) return;
        const m=txt.match(/^[^(]*\((.*)\)\s*;?$/s);
        const raw=m?m[1]:txt;
        let data;
        try{ data=JSON.parse(raw); }catch{ return; }
        const normalized=normalizePayload(data);
        if(normalized.length) networkReviews.push(...normalized);
      }catch{}
    });

    await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
    await new Promise(r=>setTimeout(r,2500));

    const blocked=await page.evaluate(()=>/captcha|verify you are human|access denied|unusual traffic|security verification/i.test(document.body?.innerText||""));
    if(blocked){
      return NextResponse.json({error:"aliexpress_blocked",message:"AliExpress blocked the server browser for this product. Try again later."},{status:429});
    }

    // Try to reveal the real product reviews.
    await page.evaluate(()=>{
      const clean=s=>String(s||"").replace(/\s+/g," ").trim();
      const els=[...document.querySelectorAll('button,a,[role="tab"],[role="button"],div,span')];
      const target=els.find(el=>{
        const t=clean(el.textContent);
        return t.length<120 && (/^(?:customer\s+)?reviews?\b/i.test(t) || /^reviews?\s*[|(:]/i.test(t));
      });
      if(target){
        try{ target.scrollIntoView({block:"center"}); }catch{}
        try{ target.click(); }catch{}
      }
    }).catch(()=>{});

    await new Promise(r=>setTimeout(r,2200));

    // Scroll review area to trigger lazy-loaded calls and photos.
    for(const y of [0.45,0.62,0.75,0.86,0.94]){
      await page.evaluate(frac=>window.scrollTo(0,document.body.scrollHeight*frac),y).catch(()=>{});
      await new Promise(r=>setTimeout(r,850));
    }

    const domReviews=await page.evaluate(()=>{
      const clean=s=>String(s||"").replace(/\s+/g," ").trim();
      const badArea=el=>{
        let n=el;
        for(let i=0;i<8&&n;i++,n=n.parentElement){
          const s=(String(n.className||"")+" "+String(n.id||"")+" "+String(n.getAttribute?.("aria-label")||"")).toLowerCase();
          if(/recommend|related|similar|more-to-love|may-like|seller|store-card|shop-card/.test(s)) return true;
        }
        return false;
      };
      const ratingOf=el=>{
        const aria=[...el.querySelectorAll("[aria-label]")].map(n=>n.getAttribute("aria-label")||"").join(" ");
        let m=aria.match(/([1-5](?:\.\d)?)\s*(?:out of 5|stars?)/i);
        if(m) return Number(m[1]);
        const txt=clean(el.innerText||"");
        m=txt.match(/\b([1-5](?:\.\d)?)\s*(?:\/\s*5|stars?)\b/i);
        if(m) return Number(m[1]);
        const stars=[...el.querySelectorAll('[class*="star"],svg,img')].filter(n=>{
          const s=(String(n.className||"")+" "+String(n.getAttribute?.("aria-label")||"")+" "+String(n.getAttribute?.("src")||"")).toLowerCase();
          return /star/.test(s)&&!/empty|gray|grey|off/.test(s);
        });
        return stars.length>=1&&stars.length<=5?stars.length:null;
      };

      const selectors=[
        '[class*="review-item"]','[class*="review--item"]','[class*="feedback-item"]',
        '[data-pl*="review"]','[class*="review-card"]','[class*="comment-item"]',
        '[class*="evaluation-item"]'
      ];
      let cards=[...document.querySelectorAll(selectors.join(","))].filter(el=>!badArea(el));
      if(!cards.length){
        cards=[...document.querySelectorAll("div,article,li")].filter(el=>{
          if(badArea(el)) return false;
          const t=clean(el.innerText||"");
          if(t.length<20||t.length>1800) return false;
          const rating=ratingOf(el);
          return rating>=1&&rating<=5 && (/helpful|show original language|translate/i.test(t)||/[A-Za-z0-9]?\*{2,}[A-Za-z0-9]?/.test(t));
        });
      }

      cards=cards.filter((el,i,arr)=>!arr.some((o,j)=>j!==i&&el.contains(o)&&clean(o.innerText||"").length>=20));

      const out=[],seen=new Set();
      for(const el of cards){
        if(out.length>=20) break;
        const rating=ratingOf(el);
        if(!(rating>=1&&rating<=5)) continue;

        const full=clean(el.innerText||"");
        if(/official st|official store|\d[\d,]*\+?\s*sold\b|related items|you may also like|more to love/i.test(full)) continue;

        let reviewer_name="";
        for(const sel of ['[class*="user-name"]','[class*="userName"]','[class*="reviewer"]','[class*="buyer-name"]','[class*="buyerName"]','[class*="customer-name"]','[class*="customerName"]']){
          const n=el.querySelector(sel);
          const s=clean(n?.textContent||"");
          if(s&&s.length<=80&&!/seller|store|shop|sold|review/i.test(s)){ reviewer_name=s; break; }
        }
        if(!reviewer_name){
          const mm=full.match(/\b([A-Za-z0-9]?\*{2,}[A-Za-z0-9]?)\b/);
          if(mm) reviewer_name=mm[1];
        }

        let texts=[...el.querySelectorAll('p,[class*="content"],[class*="text"],[class*="comment"]')]
          .map(n=>clean(n.textContent||""))
          .filter(t=>t.length>=5&&t.length<=1200)
          .filter(t=>!/^(helpful|share|report|translate|show original language|view more)$/i.test(t))
          .filter(t=>!/^(metal color|main stone color|size|color|ships from)\s*:/i.test(t))
          .filter(t=>!(/official st|official store|\d[\d,]*\+?\s*sold\b|related items|you may also like|more to love/i.test(t)));
        texts=[...new Set(texts)].sort((a,b)=>b.length-a.length);
        const text=texts[0]||"";
        if(!text) continue;

        const dm=full.match(/\b(?:20\d{2}[-\/.]\d{1,2}[-\/.]\d{1,2}|[A-Z][a-z]{2,8}\s+\d{1,2},?\s+20\d{2}|\d{1,2}\s+[A-Z][a-z]{2,8}\s+20\d{2})\b/);
        const images=[...el.querySelectorAll("img")].map(img=>img.currentSrc||img.src||"")
          .filter(u=>/^https?:\/\//i.test(u))
          .filter(u=>!(/avatar|profile|icon|logo|star|flag|badge|seller|store/i.test(u)))
          .slice(0,6);

        const key=(reviewer_name+"|"+text).toLowerCase();
        if(seen.has(key)) continue;
        seen.add(key);
        out.push({reviewer_name,text,rating,date:dm?.[0]||"",images});
      }
      return out;
    }).catch(()=>[]);

    const reviews=mergeReviews(networkReviews,domReviews);
    return NextResponse.json({
      ok:true,
      source:"browser_fallback",
      review_count:reviews.length,
      reviews
    });
  }catch(e){
    return NextResponse.json({error:"scrape_failed",message:String(e?.message||e)},{status:500});
  }finally{
    if(browser) await browser.close().catch(()=>{});
  }
}
