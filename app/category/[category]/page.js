import { getProductsByCategory } from "../../../lib/supabase";
import RatingStars from "../../../components/RatingStars";

export const dynamic = "force-dynamic";

const SUBCATEGORIES={
  "Tea & Coffee":["Coffee & Tea Set","Cups & Mugs","Thermos","Teapot"],
  "Dinnerware":["Serving Set","Bowl & Plate"],
  "Kitchen Storage":["Canister & Jar Set","Organizer"],
  "Kitchenware":["Serving Set","Food Warmer"],
  "Decorative Accents":["Candle Holder","Decorative Items"],
  "Home Decor":[]
};

export async function generateMetadata({ params }) {
  const { category } = await params;
  const name = decodeURIComponent(category);
  return {
    title:`${name} — Miga Mart Kitchen & Dining`,
    description:`Shop ${name.toLowerCase()} at Miga Mart. Curated kitchen, dining and home finds chosen for beauty, usefulness and everyday living.`,
    alternates:{canonical:`/category/${encodeURIComponent(name)}`}
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const name = decodeURIComponent(category);
  const allProducts = await getProductsByCategory(name);
  // Keep thermoses and pots in their own dedicated collections, not the main Coffee & Tea grid.
  const products = name === "Tea & Coffee"
    ? allProducts.filter(p => !["Thermos", "Teapot"].includes(p.subcategory))
    : allProducts;
  return <main className="wrap luxuryCollection">
    <h1 className="luxuryCollectionTitle">{name}</h1>
    <p className="muted">Shop curated Miga Mart {name.toLowerCase()} finds for a beautiful, practical home.</p>
    {SUBCATEGORIES[name]?.length ? <div className="subcategoryLinks">
      {SUBCATEGORIES[name].map(sub=><a key={sub} href={`/category/${encodeURIComponent(name)}/${encodeURIComponent(sub)}`}>{sub}</a>)}
    </div> : null}
    <div className="collectionToolbar"><span>{products.length} products</span><span>Explore the collection</span></div>
    <div className="grid luxuryProductGrid">
      {products.map(p=><a className="card" key={p.id} href={`/products/${p.slug}`}>
        {p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" />}
        <div className="body">
          <div className="cat">{p.subcategory||p.category}</div>
          <div className="title">{p.title}</div>
          <RatingStars reviews={p.reviews||[]} rating={p.rating} compact />
          <div className="price">${Number(p.retail_price||0).toFixed(2)}</div>
          <span className="collectionShopLink">View details <span aria-hidden="true">→</span></span>
        </div>
      </a>)}
    </div>
  </main>
}