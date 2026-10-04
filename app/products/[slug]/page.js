import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/supabase";
import AddToCartButton from "../../../components/AddToCartButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const description = (p.meta_description || p.description || "").replace(/#\w+/g,"").slice(0,160);
  return {
    title: p.title,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type:"website",
      title:p.title,
      description,
      url:`/products/${p.slug}`,
      images:p.images?.[0] ? [{url:p.images[0],alt:p.title}] : []
    }
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const schema = {
    "@context":"https://schema.org",
    "@type":"Product",
    name:p.title,
    description:p.meta_description || p.description || "",
    image:p.images || [],
    sku:p.id,
    brand:{ "@type":"Brand", name:"TMBTY" },
    offers:{
      "@type":"Offer",
      priceCurrency:"USD",
      price:Number(p.retail_price||0).toFixed(2),
      url:`https://tmbty.com/products/${p.slug}`
    }
  };

  return <main className="wrap">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} />
    <div className="detail">
      <div>
        {p.images?.[0] && <img className="mainimg" src={p.images[0]} alt={p.title} />}
        <div className="thumbs">{(p.images||[]).slice(1,7).map((u,i)=><img key={i} src={u} alt={`${p.title} view ${i+2}`} />)}</div>
        {p.video_url ? <video controls style={{width:"100%",marginTop:12,borderRadius:12}} src={p.video_url} /> : null}
      </div>
      <div>
        <div className="cat">{p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}</div>
        <h1 style={{fontSize:36}}>{p.title}</h1>
        <div className="price">${Number(p.retail_price||0).toFixed(2)}</div>
        <p style={{lineHeight:1.7}}>{p.description}</p>
        <AddToCartButton product={{id:p.id,title:p.title,retail_price:p.retail_price,images:p.images||[]}} />
      </div>
    </div>
  </main>
}