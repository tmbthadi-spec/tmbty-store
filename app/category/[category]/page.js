import { getProductsByCategory } from "../../../lib/supabase";
import RatingStars from "../../../components/RatingStars";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { category } = await params;
  const name = decodeURIComponent(category);
  return {
    title:`${name} — Shop TMBTY`,
    description:`Shop ${name.toLowerCase()} at TMBTY. Discover stylish, curated pieces with fresh colors and details.`,
    alternates:{canonical:`/category/${encodeURIComponent(name)}`}
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const name = decodeURIComponent(category);
  const products = await getProductsByCategory(name);
  return <main className="wrap" style={{paddingTop:30}}>
    <h1 style={{fontSize:38}}>{name}</h1>
    <p className="muted">Shop TMBTY {name.toLowerCase()} selected for style, color and everyday wear.</p>
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