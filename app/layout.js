import "./globals.css";
import { CartProvider } from "../components/CartProvider";
import CartButton from "../components/CartButton";
import CartDrawer from "../components/CartDrawer";
import CheckoutReturn from "../components/CheckoutReturn";

export const metadata = {
  metadataBase: new URL("https://tmbty.com"),
  title: { default: "TMBTY — Elegant Kitchen & Dining Finds", template: "%s | TMBTY" },
  description: "Shop elegant and affordable kitchen, dining, tea, coffee, tableware, storage and home décor finds at TMBTY.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TMBTY",
    title: "TMBTY — Elegant Kitchen & Dining Finds",
    description: "Curated tea sets, coffee sets, dinnerware, kitchen storage, kitchenware and home décor."
  }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><CartProvider>
    <header><div className="wrap top">
      <a className="brand" href="/">TMBTY</a>
      <nav className="nav">
        <div className="navGroup"><a href="/category/Tea%20%26%20Coffee">Tea & Coffee</a><div className="navDropdown">
          <a href="/category/Tea%20%26%20Coffee/Tea%20Set">Tea Sets</a>
          <a href="/category/Tea%20%26%20Coffee/Coffee%20Set">Coffee Sets</a>
          <a href="/category/Tea%20%26%20Coffee/Cup%20%26%20Saucer">Cups & Saucers</a>
          <a href="/category/Tea%20%26%20Coffee/Mug">Mugs</a>
          <a href="/category/Tea%20%26%20Coffee/Teapot">Teapots</a>
        </div></div>
        <div className="navGroup"><a href="/category/Dinnerware">Dinnerware</a><div className="navDropdown">
          <a href="/category/Dinnerware/Dinnerware%20Set">Dinnerware Sets</a>
          <a href="/category/Dinnerware/Plate">Plates</a>
          <a href="/category/Dinnerware/Bowl">Bowls</a>
          <a href="/category/Dinnerware/Serving%20Set">Serving Sets</a>
        </div></div>
        <div className="navGroup"><a href="/category/Kitchen%20Storage">Kitchen Storage</a><div className="navDropdown">
          <a href="/category/Kitchen%20Storage/Canister%20Set">Canister Sets</a>
          <a href="/category/Kitchen%20Storage/Storage%20Jar">Storage Jars</a>
          <a href="/category/Kitchen%20Storage/Organizer">Organizers</a>
        </div></div>
        <div className="navGroup"><a href="/category/Kitchenware">Kitchenware</a><div className="navDropdown">
          <a href="/category/Kitchenware/Serving%20Tray">Serving Trays</a>
          <a href="/category/Kitchenware/Cake%20Stand">Cake Stands</a>
          <a href="/category/Kitchenware/Kitchen%20Accessory">Kitchen Accessories</a>
        </div></div>
        <div className="navGroup"><a href="/category/Home%20Decor">Home Décor</a><div className="navDropdown">
          <a href="/category/Home%20Decor/Table%20Decor">Table Décor</a>
          <a href="/category/Home%20Decor/Decorative%20Accent">Decorative Accents</a>
        </div></div>
      </nav>
      <CartButton />
    </div></header>
    <CheckoutReturn />
    {children}
    <CartDrawer />
    <footer><div className="wrap">© TMBTY. Elegant kitchen & dining finds.</div></footer>
  </CartProvider></body></html>
}