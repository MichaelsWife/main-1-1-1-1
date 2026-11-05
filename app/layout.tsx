import type { Metadata } from "next";
import Link from "next/link";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Rapture — Modern essentials",
  description: "Thoughtfully designed essentials for everyday life.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <header className="site-header">
            <Link href="/" className="wordmark">therapture<span>®</span></Link>
            <nav aria-label="Main navigation">
              <Link href="/">Shop</Link><Link href="/account">Account</Link><Link href="/cart">Bag <CartCount /></Link>
            </nav>
          </header>
          {children}
          <footer className="site-footer"><span>therapture®</span><span>Thoughtful goods, made for everyday.</span></footer>
        </CartProvider>
      </body>
    </html>
  );
}

function CartCount() {
  // The count is rendered client-side in the nav to avoid reading browser storage on the server.
  return <span className="cart-count"><CartCountClient /></span>;
}

import CartCountClient from "@/components/cart-count";
