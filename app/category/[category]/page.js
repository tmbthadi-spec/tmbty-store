import { getProductsByCategory } from "../../../lib/supabase";
import RatingStars from "../../../components/RatingStars";

export const dynamic = "force-dynamic";

const SUBCATEGORIES={
  "Tea & Coffee":["Tea Set","Coffee Set","Cup & Saucer","Mug","Teapot"],
  "Dinnerware":["Dinnerware Set","Plate","Bowl","Serving Set"],
  "Kitchen Storage":["Canister Set","Storage Jar","Organizer"],
  "Kitchenware":["Serving Tray","Cake Stand","Kitchen Accessory"],
  "Home Decor":["Table Decor","Decorative Accent"]
};

export async function generateMetadata({ params }) {
  const { category } = await params;
  const name = decodeURIComponent(category);
  return {
    title:`${name} — TMBTY Kitchen & Dining`,
    description:`Shop ${name.toLowerCase()} at TMBTY. Curated kitchen, dining and home finds chosen for beauty, usefulness and everyday living.`,
    alternates:{canonical:`/category/${encodeURIComponent(name)}`}
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const name = decodeURIComponent(category);
  const products = await getProductsByCategory(name);
  return <main className="wrap" style={{paddingTop:30}}>
    <h1 style={{fontSize:38}}>{name}</h1>
    <p className="muted">Shop curated TMBTY {name.toLowerCase()} finds for a beautiful, practical home.</p>
    {SUBCATEGORIES[name]?.length ? <div className="subcategoryLinks">
      {SUBCATEGORIES[name].map(sub=><a key={sub} href={`/category/${encodeURIComponent(name)}/${encodeURIComponent(sub)}`}>{sub}</a>)}
    </div> : null}
    <div className="grid">
      {products.map(p=><a className="card" key={p.id} href={`/products/${p.slug}`}>
        {p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" />}
        <div className="body">
          <div className="cat">{p.subcategory||p.category}</div>
          <div className="title">{p.title}</div>
          <RatingStars reviews={p.reviews||[]} rating={p.rating} compact />
          <div className="price">${Number(p.retail_price||0).toFixed(2)}</div>
        </div>
      </a>)}
    </div>
  </main>
}