import "./globals.css";
import { CartProvider } from "../components/CartProvider";
import CartButton from "../components/CartButton";
import CartDrawer from "../components/CartDrawer";
import CheckoutReturn from "../components/CheckoutReturn";

export const metadata = {
  metadataBase: new URL("https://tmbty.com"),
  title: { default: "TMBTY — Jewelry, Handbags, Outfits & Accessories", template: "%s | TMBTY" },
  description: "Shop stylish jewelry, handbags, outfits and accessories at TMBTY.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TMBTY",
    title: "TMBTY — Jewelry, Handbags, Outfits & Accessories",
    description: "Shop stylish jewelry, handbags, outfits and accessories at TMBTY."
  }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><CartProvider>
    <header><div className="wrap top">
      <a className="brand" href="/">TMBTY</a>
      <nav className="nav">
        <a href="/category/Jewelry">Jewelry</a>
        <a href="/category/Handbags">Handbags</a>
        <a href="/category/Outfits">Outfits</a>
        <a href="/category/Accessories">Accessories</a>
      </nav>
      <CartButton />
    </div></header>
    <CheckoutReturn />
    {children}
    <CartDrawer />
    <footer><div className="wrap">© TMBTY. All rights reserved.</div></footer>
  </CartProvider></body></html>
}