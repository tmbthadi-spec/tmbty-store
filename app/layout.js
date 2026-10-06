import "./globals.css";
import { CartProvider } from "../components/CartProvider";
import CartButton from "../components/CartButton";
import CartDrawer from "../components/CartDrawer";
import CheckoutReturn from "../components/CheckoutReturn";

export const metadata = {
  metadataBase: new URL("https://tmbty.com"),
  title: { default: "TMBTY — Accessories, Handbags & Outfits", template: "%s | TMBTY" },
  description: "Shop stylish accessories, handbags and outfits at TMBTY.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TMBTY",
    title: "TMBTY — Accessories, Handbags & Outfits",
    description: "Shop stylish accessories, handbags and outfits at TMBTY."
  }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><CartProvider>
    <header><div className="wrap top">
      <a className="brand" href="/">TMBTY</a>
      <nav className="nav">
        <div className="navGroup"><a href="/category/Handbags">Handbags</a><div className="navDropdown">
          <a href="/category/Handbags/Crossbody%20Bag">Crossbody Bags</a>
          <a href="/category/Handbags/Shoulder%20Bag">Shoulder Bags</a>
          <a href="/category/Handbags/Tote%20Bag">Tote Bags</a>
          <a href="/category/Handbags/Clutch">Clutches</a>
          <a href="/category/Handbags/Wallet">Wallets</a>
          <a href="/category/Handbags/Backpack">Backpacks</a>
          <a href="/category/Handbags/Handbag%20Set">Bag Sets</a>
        </div></div>
        <div className="navGroup"><a href="/category/Outfits">Outfits</a><div className="navDropdown">
          <a href="/category/Outfits/Dress">Dresses</a>
          <a href="/category/Outfits/Two-Piece%20Set">Two-Piece Sets</a>
          <a href="/category/Outfits/Top">Tops</a>
          <a href="/category/Outfits/Skirt">Skirts</a>
          <a href="/category/Outfits/Pants">Pants</a>
          <a href="/category/Outfits/Jumpsuit">Jumpsuits</a>
          <a href="/category/Outfits/Sweater">Sweaters</a>
          <a href="/category/Outfits/Jacket">Jackets</a>
        </div></div>
        <div className="navGroup"><a href="/category/Accessories">Accessories</a><div className="navDropdown">
          <a href="/category/Accessories/Hair%20Claw">Hair Claws</a>
          <a href="/category/Accessories/Hair%20Clip">Hair Clips</a>
          <a href="/category/Accessories/Scrunchie">Scrunchies</a>
          <a href="/category/Accessories/Headband">Headbands</a>
          <a href="/category/Accessories/Accessory%20Set">Accessory Sets</a>
        </div></div>
      </nav>
      <CartButton />
    </div></header>
    <CheckoutReturn />
    {children}
    <CartDrawer />
    <footer><div className="wrap">© TMBTY. All rights reserved.</div></footer>
  </CartProvider></body></html>
}