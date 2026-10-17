import { getPublishedProducts } from "../lib/supabase";
import RatingStars from "../components/RatingStars";

export const dynamic = "force-dynamic";

const collections = [
  { label: "Coffee & Tea", href: "/category/Tea%20%26%20Coffee", detail: "Explore the collection →" },
  { label: "Elegant Dinnerware", href: "/category/Dinnerware", detail: "Explore the collection →" },
  { label: "Decorative Accents", href: "/category/Decorative%20Accents", detail: "Explore the collection →" }
];

export default async function Home() {
  const products = await getPublishedProducts();
  return <main>
    <section className="hero"><div className="wrap"><div className="heroBox">
      <span className="heroEyebrow">Miga Mart · Kitchen, Dining & Home</span>
      <h1>Everyday moments, beautifully styled.</h1>
      <p className="muted">Elegant coffee and tea sets, luminous serving pieces, and thoughtful accents to bring warmth and character to your home.</p>
      <a className="heroAction" href="#shop-new">Explore the collection →</a>
    </div></div></section>
    <section className="wrap" aria-label="Shop by collection">
      <div className="homeIntro"><div><span className="sectionEyebrow">Discover Miga Mart</span><h2>Find your signature style</h2></div>
      <p className="muted">Beautiful details for the table, the kitchen, and the spaces you love.</p></div>
      <div className="homeCollections">
        {collections.map(c => <a className="homeCollection" href={c.href} key={c.label}><span>{c.label}</span><small>{c.detail}</small></a>)}
      </div>
    </section>
    <section className="wrap" id="shop-new">
      <div className="homeIntro"><div><span className="sectionEyebrow">The latest finds</span><h2>New & noteworthy</h2></div>
      <p className="muted">Explore our latest kitchen, dining, and home discoveries.</p></div>
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
  </main>;
}
