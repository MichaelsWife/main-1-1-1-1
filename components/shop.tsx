"use client";
import { useState } from "react";
import type { Product } from "@/lib/store";
import { useCart } from "@/components/cart-provider";
import Link from "next/link";

function money(cents: number, currency = "USD") { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100); }
export default function Shop({ products }: { products: Product[] }) {
  const { add } = useCart();
  const [added, setAdded] = useState<string | null>(null);
  return <main className="store-main">
    <section className="store-hero"><p className="eyebrow">THE EVERYDAY COLLECTION</p><h1>Better things<br /><em>for daily life.</em></h1><p>Considered essentials, chosen to make the ordinary feel a little more special.</p><Link className="button dark-button" href="#products">Explore the collection <span>↓</span></Link></section>
    <section className="collection" id="products"><div className="section-heading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Shop the collection</h2></div><span>{products.length} items</span></div>
      {products.length === 0 ? <div className="empty-catalog"><h3>Your collection is getting ready.</h3><p>Connect MongoDB and add products to the <code>products</code> collection. See README for the seed command.</p></div> : <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div className="product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>{product.category.slice(0, 1).toUpperCase()}</span>}<span className="category-pill">{product.category}</span></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.description}</p></div><div className="product-buy"><strong>{money(product.priceCents, product.currency)}</strong><button type="button" className="add-button" onClick={() => { add(product); setAdded(product.id); window.setTimeout(() => setAdded(null), 1200); }}>{added === product.id ? "Added ✓" : "Add to bag +"}</button></div></div></article>)}</div>}
    </section>
    <section className="shop-note"><span>01 — MADE WITH INTENTION</span><p>Good design isn’t just how something looks.<br />It’s how it fits into your life.</p></section>
  </main>;
}
