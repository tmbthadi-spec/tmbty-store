import { getProductsByCategory } from "../../../lib/supabase";
import RatingStars from "../../../components/RatingStars";
export const dynamic = "force-dynamic";
export const metadata = {title:"Ceramic Coffee & Tea Sets | Miga Mart",description:"Shop ceramic coffee cups, ceramic tea sets, mugs and saucers for elegant Arabic hospitality in the USA.",alternates:{canonical:"/collections/ceramic-coffee-tea"}};
export default async function CeramicCollection(){
 const products=(await getProductsByCategory("Tea & Coffee")).filter(p=>/ceramic|porcelain|stoneware|earthenware|bone.china/i.test([p.title,p.description,p.slug].join(" ")));
 return <main className="wrap" style={{paddingTop:30}}>
 <h1 style={{fontSize:38}}>Ceramic Coffee &amp; Tea</h1>
 <p className="muted">Elegant ceramic coffee cups, tea sets, mugs and saucers for everyday moments and Arabic hospitality.</p>
 <div className="grid">{products.map(p=><a className="card" key={p.id} href={`/products/${p.slug}`}>
 {p.images?.[0]&&<img src={p.images[0]} alt={p.title} loading="lazy"/>}
 <div className="body"><div className="cat">{p.subcategory||p.category}</div><div className="title">{p.title}</div><RatingStars reviews={p.reviews||[]} rating={p.rating} compact/><div className="price">${Number(p.retail_price||0).toFixed(2)}</div></div></a>)}</div>
 </main>
}