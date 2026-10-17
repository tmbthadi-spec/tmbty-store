import { getProductsBySubcategory } from "../../../../lib/supabase";
import RatingStars from "../../../../components/RatingStars";

export const dynamic="force-dynamic";

export async function generateMetadata({params}){
  const {category,subcategory}=await params;
  const cat=decodeURIComponent(category);
  const sub=decodeURIComponent(subcategory);
  return {
    title:`${sub} — ${cat} | Miga Mart`,
    description:`Shop ${sub.toLowerCase()} in TMBTY ${cat.toLowerCase()}. Curated kitchen, dining and home finds with secure checkout.`,
    alternates:{canonical:`/category/${encodeURIComponent(cat)}/${encodeURIComponent(sub)}`}
  };
}

export default async function SubcategoryPage({params}){
  const {category,subcategory}=await params;
  const cat=decodeURIComponent(category);
  const sub=decodeURIComponent(subcategory);
  const products=await getProductsBySubcategory(cat,sub);

  return <main className="wrap luxuryCollection">
    <div className="categoryBreadcrumb"><a href={`/category/${encodeURIComponent(cat)}`}>{cat}</a><span>›</span><strong>{sub}</strong></div>
    <h1 className="luxuryCollectionTitle">{sub}</h1>
    <p className="muted">Shop TMBTY {sub.toLowerCase()} selected for beauty, usefulness and everyday living.</p>
    <div className="collectionToolbar"><span>{products.length} products</span><span>Explore the collection</span></div>
    <div className="grid luxuryProductGrid">
      {products.map(p=><a className="card" key={p.id} href={`/products/${p.slug}`}>
        {p.images?.[0]&&<img src={p.images[0]} alt={p.title} loading="lazy"/>}
        <div className="body">
          <div className="cat">{p.subcategory||p.category}</div>
          <div className="title">{p.title}</div>
          <RatingStars reviews={p.reviews||[]} rating={p.rating} compact/>
          <div className="price">${Number(p.retail_price||0).toFixed(2)}</div>
          <span className="collectionShopLink">View details <span aria-hidden="true">→</span></span>
        </div>
      </a>)}
    </div>
    {!products.length?<p className="muted" style={{padding:"30px 0"}}>No products in this section yet.</p>:null}
  </main>;
}