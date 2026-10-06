import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "../../../lib/supabase";
import ProductConfigurator from "../../../components/ProductConfigurator";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const description = (p.meta_description || p.description || "").replace(/#\w+/g,"").slice(0,160);
  const keywords = Array.isArray(p.seo_keywords) ? p.seo_keywords.slice(0,10) : [];
  return {
    title: p.title,
    description,
    keywords,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type:"website",
      title:p.title,
      description,
      url:`/products/${p.slug}`,
      images:p.images?.[0] ? [{url:p.images[0],alt:`${p.title} product cover`}] : []
    }
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const keywords = Array.isArray(p.seo_keywords) ? p.seo_keywords.filter(Boolean).slice(0,6) : [];
  const relatedProducts = await getRelatedProducts(p.id,p.category,p.subcategory,8);
  const validReviews=(Array.isArray(p.reviews)?p.reviews:[]).filter(r=>Number(r?.rating)>=1&&Number(r?.rating)<=5&&String(r?.text||"").trim());
  const averageRating=validReviews.length ? validReviews.reduce((a,r)=>a+Number(r.rating),0)/validReviews.length : null;
  const variantNames=(Array.isArray(p.variants)?p.variants:[]).map(v=>String(v?.name||v?.source_name||"").trim()).filter(Boolean);

  const schema = {
    "@context":"https://schema.org",
    "@type":"Product",
    name:p.title,
    description:p.meta_description || p.description || "",
    image:p.images || [],
    sku:p.id,
    category:[p.category,p.subcategory].filter(Boolean).join(" > "),
    additionalProperty:variantNames.slice(0,20).map(v=>({
      "@type":"PropertyValue",
      name:"Available style",
      value:v
    })),
    offers:{
      "@type":"Offer",
      priceCurrency:"USD",
      price:Number(p.retail_price||0).toFixed(2),
      url:`https://tmbty.com/products/${p.slug}`,
      availability:"https://schema.org/InStock"
    },
    ...(averageRating ? {
      aggregateRating:{
        "@type":"AggregateRating",
        ratingValue:Number(averageRating.toFixed(2)),
        reviewCount:validReviews.length
      },
      review:validReviews.slice(0,5).map(r=>({
        "@type":"Review",
        author:{"@type":"Person",name:/aliexpress/i.test(String(r.reviewer_name||""))?"Verified Customer":(r.reviewer_name||"Verified Customer")},
        reviewRating:{"@type":"Rating",ratingValue:Number(r.rating),bestRating:5},
        reviewBody:String(r.text||"")
      }))
    }:{})
  };

  return <main className="wrap productPage">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} />
    <ProductConfigurator
      product={{
        id:p.id,title:p.title,retail_price:p.retail_price,images:p.images||[],
        video_url:p.video_url||"",variants:p.variants||[],reviews:p.reviews||[],rating:p.rating||null,selected_color:p.selected_color||"",
        category:p.category||"",subcategory:p.subcategory||"",shipping_eta_text:p.shipping_eta_text||""
      }}
      description={p.description||""}
      keywords={keywords}
      relatedProducts={relatedProducts}
    />
  </main>
}