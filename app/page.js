import "./home.css";
import { getPublishedProducts } from "../lib/supabase";
import RatingStars from "../components/RatingStars";

export const dynamic = "force-dynamic";

const collections = [
  { label: "Coffee & Tea", category: "Tea & Coffee", href: "/category/Tea%20%26%20Coffee", subtitle: "Beautiful rituals, every day" },
  { label: "Dinnerware", category: "Dinnerware", href: "/category/Dinnerware", subtitle: "Set a table to remember" },
  { label: "Serving & Kitchenware", category: "Kitchenware", href: "/category/Kitchenware", subtitle: "Thoughtful finishing touches" },
  { label: "Decorative Accents", category: "Decorative Accents", href: "/category/Decorative%20Accents", subtitle: "Details that feel like home" },
  { label: "Kitchen Storage", category: "Kitchen Storage", href: "/category/Kitchen%20Storage", subtitle: "Practical, beautifully styled" }
];

function ProductCard({ product }) {
  return <a className="card homeProductCard" href={`/products/${product.slug}`}>
    <div className="homeProductImage">
      {product.images?.[0] ? <img src={product.images[0]} alt={product.title} loading="lazy" /> : <span>Miga Mart</span>}
    </div>
    <div className="body">
      <div className="cat">{product.subcategory || product.category}</div>
      <div className="title">{product.title}</div>
      <RatingStars reviews={product.reviews || []} rating={product.rating} compact />
      <div className="price">${Number(product.retail_price || 0).toFixed(2)}</div>
    </div>
  </a>;
}

export default async function Home() {
  const products = await getPublishedProducts();
  const pictured = products.filter(p => p.images?.[0]);
  const heroProduct = pictured.find(p => p.category === "Tea & Coffee") || pictured[0];
  const featured = products.slice(0, 8);
  const collectionCards = collections.map(c => ({
    ...c,
    image: pictured.find(p => p.category === c.category)?.images?.[0] || null
  }));
  return <main className="migaHome">
    <section className="homeHeroWrap wrap">
      <div className="homeHero">
        <div className="homeHeroCopy">
          <span className="heroEyebrow">MIGA MART · THE ART OF EVERYDAY LIVING</span>
          <h1>Make every moment <em>beautiful.</em></h1>
          <p>Discover elegant coffee sets, statement serving pieces and thoughtfully chosen details for the home you love.</p>
          <div className="homeHeroActions">
            <a className="homePrimaryButton" href="#new-arrivals">Shop new arrivals <span aria-hidden="true">↗</span></a>
            <a className="homeSecondaryButton" href="#collections">Explore collections →</a>
          </div>
        </div>
        <div className="homeHeroVisual">
          {heroProduct?.images?.[0] ? <a href={`/products/${heroProduct.slug}`} aria-label={`View ${heroProduct.title}`}><img src={heroProduct.images[0]} alt={heroProduct.title} /></a> : <div className="homeHeroPlaceholder">MIGA MART</div>}
          <span className="homeHeroVisualLabel">ELEGANT KITCHEN & DINING</span>
        </div>
      </div>
    </section>
    <div className="homeValueStrip"><div className="wrap homeValueInner"><span>Curated for beautiful living</span><span aria-hidden="true">✦</span><span>Thoughtful kitchen & dining finds</span><span aria-hidden="true">✦</span><span>Details worth sharing</span></div></div>
    <section className="wrap homeSection" id="collections">
      <div className="homeSectionHeading"><div><span className="sectionEyebrow">SHOP BY CATEGORY</span><h2>Explore the collections</h2></div><p>From morning coffee to memorable gatherings, find something lovely for every corner of your home.</p></div>
      <div className="homeCategoryGrid">
        {collectionCards.map((c, i) => <a className={`homeCategoryCard homeCategoryCard${i + 1}`} href={c.href} key={c.category}>
          <div className="homeCategoryImage">{c.image ? <img src={c.image} alt="" loading="lazy" /> : <span>Miga Mart</span>}</div>
          <div className="homeCategoryCaption"><strong>{c.label}</strong><small>{c.subtitle}</small><span aria-hidden="true">↗</span></div>
        </a>)}
      </div>
    </section>
    <section className="wrap homeSection" id="new-arrivals">
      <div className="homeSectionHeading"><div><span className="sectionEyebrow">JUST DISCOVERED</span><h2>New & noteworthy</h2></div><p>Our latest finds, chosen to add beauty to everyday moments.</p></div>
      {featured.length ? <div className="grid homeFeaturedGrid">{featured.map(p => <ProductCard key={p.id} product={p} />)}</div> : <p>Beautiful new finds are on their way.</p>}
      {products.length > 8 && <div className="homeBrowseMore"><a href="#collections">Browse more collections →</a></div>}
    </section>
    <section className="wrap homeEditorialSection"><div className="homeEditorialPanel"><span className="sectionEyebrow">A LITTLE EVERYDAY LUXURY</span><h2>Beautiful details make a house feel like home.</h2><p>Bring warmth to your coffee ritual, elegance to your table, and personality to the moments that matter.</p><a href="/category/Tea%20%26%20Coffee">Discover coffee & tea →</a></div></section>
  </main>;
}
