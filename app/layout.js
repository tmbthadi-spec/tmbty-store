import "./globals.css";
import { CartProvider } from "../components/CartProvider";
import CartButton from "../components/CartButton";
import CartDrawer from "../components/CartDrawer";
import CheckoutReturn from "../components/CheckoutReturn";

export const metadata = {
  metadataBase: new URL("https://migamart.com"),
  title: { default: "Miga Mart — Luxury Gold & Elegant Dining", template: "%s | Miga Mart" },
  description: "Shop luxury gold-tone coffee and tea sets, elegant serving trays, tableware and refined home décor at Miga Mart.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Miga Mart",
    title: "Miga Mart — Elegant Kitchen & Dining Finds",
    description: "Curated tea sets, coffee sets, dinnerware, kitchen storage, kitchenware and home décor."
  }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><CartProvider>
    <header><div className="wrap top">
      <a className="brand" href="/">Miga Mart</a>
      <nav className="nav">
        <a href="/">Home</a>
        <div className="navGroup"><a href="/category/Tea%20%26%20Coffee">Coffee &amp; Tea</a><div className="navDropdown">
          <a href="/category/Tea%20%26%20Coffee">Shop All Coffee &amp; Tea</a>
          <a href="/category/Tea%20%26%20Coffee/Coffee%20Set">Coffee Sets</a>
          <a href="/category/Tea%20%26%20Coffee/Tea%20Set">Tea Sets</a>
          <a href="/category/Tea%20%26%20Coffee/Cup%20%26%20Saucer">Cups &amp; Saucers</a>
          <a href="/category/Tea%20%26%20Coffee/Mug">Mugs</a>
          <a href="/category/Tea%20%26%20Coffee/Teapot">Teapots</a>
          <a href="/category/Tea%20%26%20Coffee/Thermos">Arabic Tea &amp; Coffee Thermoses</a>
        </div></div>
        <div className="navGroup"><a href="/category/Dinnerware">Dinnerware</a><div className="navDropdown">
          <a href="/category/Dinnerware">Shop All Dinnerware</a>
          <a href="/category/Dinnerware/Dinnerware%20Set">Dinnerware Sets</a>
          <a href="/category/Dinnerware/Plate">Plates</a>
          <a href="/category/Dinnerware/Bowl">Bowls</a>
          <a href="/category/Dinnerware/Serving%20Set">Serving Sets</a>
        </div></div>
        <div className="navGroup"><a href="/category/Kitchenware">Serving &amp; Kitchenware</a><div className="navDropdown">
          <a href="/category/Kitchenware">Shop All Kitchenware</a>
          <a href="/category/Kitchenware/Serving%20Tray">Serving Trays</a>
          <a href="/category/Kitchenware/Cake%20Stand">Cake Stands</a>
          <a href="/category/Kitchenware/Kitchen%20Accessory">Kitchen Accessories</a>
        </div></div>
        <div className="navGroup"><a href="/category/Decorative%20Accents">Decorative Accents</a><div className="navDropdown">
          <a href="/category/Decorative%20Accents">Shop All Decorative Accents</a>
          <a href="/category/Decorative%20Accents/Incense%20Burners">Incense Burners</a>
          <a href="/category/Decorative%20Accents/Candle%20Holders">Candle Holders</a>
          <a href="/category/Decorative%20Accents/Decorative%20Trays">Decorative Trays &amp; Sets</a>
        </div></div>
        <div className="navGroup"><a href="/category/Kitchen%20Storage">Kitchen Storage</a><div className="navDropdown">
          <a href="/category/Kitchen%20Storage">Shop All Storage</a>
          <a href="/category/Kitchen%20Storage/Canister%20Set">Canister Sets</a>
          <a href="/category/Kitchen%20Storage/Storage%20Jar">Storage Jars</a>
          <a href="/category/Kitchen%20Storage/Organizer">Organizers</a>
        </div></div>
      </nav>
      <CartButton />
    </div></header>
    <CheckoutReturn />
    {children}
    <CartDrawer />
    <footer><div className="wrap">© Miga Mart. Elegant kitchen & dining finds.</div></footer>
  </CartProvider></body></html>
}