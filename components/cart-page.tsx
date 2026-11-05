"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";

function money(cents: number, currency = "USD") { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100); }
export default function CartPage() {
  const { items, remove, setQuantity } = useCart();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const requestId = useRef<string | null>(null);
  const [address, setAddress] = useState({ fullName: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "US" });
  const total = items.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);

  async function beginCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setBusy(true);
    try {
      requestId.current ??= crypto.randomUUID();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutRequestId: requestId.current, items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })), shippingAddress: address }),
      });
      const result = await response.json();
      if (response.status === 401) { window.location.href = "/login?next=/cart"; return; }
      if (!response.ok || typeof result.checkoutUrl !== "string") throw new Error(result.error || "Secure checkout could not be started.");
      window.location.assign(result.checkoutUrl);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); setBusy(false); }
  }

  if (!items.length) return <main className="content-page"><p className="eyebrow">YOUR BAG</p><h1>Your bag is taking a breather.</h1><p>Find something you love and it’ll be waiting here.</p><Link href="/" className="button dark-button">Continue shopping</Link></main>;
  return <main className="content-page"><p className="eyebrow">YOUR BAG</p><h1>Almost yours.</h1>
    {items.map(({ product, quantity }) => <div className="cart-line" key={product.id}><div><strong>{product.name}</strong><p>{money(product.priceCents, product.currency)} each</p></div><div className="quantity-controls"><button type="button" onClick={() => setQuantity(product.id, quantity - 1)} aria-label="Decrease quantity">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity(product.id, quantity + 1)} aria-label="Increase quantity">+</button><button type="button" className="remove-button" onClick={() => remove(product.id)}>Remove</button></div><strong>{money(product.priceCents * quantity, product.currency)}</strong></div>)}
    <div className="cart-total"><span>Estimated subtotal</span><strong>{money(total, items[0].product.currency)}</strong></div>
    <form className="checkout-form" onSubmit={beginCheckout}><h2>Shipping details</h2><p>Sign in is required. Final product prices are recalculated on the server. Shipping and tax are not yet included.</p><div className="form-grid"><label>Full name<input required minLength={2} maxLength={100} value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} /></label><label>Country code<input required minLength={2} maxLength={2} value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value.toUpperCase() })} /></label><label className="wide">Address<input required minLength={3} maxLength={150} value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} /></label><label className="wide">Apartment, suite, etc. (optional)<input maxLength={150} value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} /></label><label>City<input required minLength={2} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></label><label>State / region<input required minLength={2} value={address.region} onChange={(e) => setAddress({ ...address, region: e.target.value })} /></label><label>Postal code<input required minLength={3} value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} /></label></div><button className="button dark-button" disabled={busy}>{busy ? "Redirecting to secure payment…" : "Continue to secure payment"}</button>{message && <p role="alert" className="form-message">{message}</p>}</form>
    <Link href="/" className="text-link">← Continue shopping</Link>
  </main>;
}
