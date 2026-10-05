import { getPublishedProducts } from "../lib/supabase";
import RatingStars from "../components/RatingStars";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getPublishedProducts();
  return <main>
    <section className="hero"><div className="wrap"><div className="heroBox">
      <h1>Style made to stand out.</h1>
      <p className="muted">Discover jewelry, handbags, outfits and accessories selected for style, color and everyday wear.</p>
    </div></div></section>
    <section className="wrap">
      <h2>Latest Products</h2>
      <div className="grid">
        {products.map(p => <a className="card" key={p.id} href={`/products/${p.slug}`}>
          {p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" />}
          <div className="body">
            <div className="cat">{p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}</div>
            <div className="title">{p.title}</div>
            <RatingStars reviews={p.reviews||[]} rating={p.rating} compact />
            <div className="price">${Number(p.retail_price||0).toFixed(2)}</div>
          </div>
        </a>)}
      </div>
    </section>
  </main>
}