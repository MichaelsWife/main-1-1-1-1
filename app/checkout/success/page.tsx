import Link from "next/link";
export default function CheckoutSuccessPage() {
  return <main className="content-page narrow"><p className="eyebrow">CHECKOUT COMPLETE</p><h1>Thank you.</h1><p>Your payment was submitted securely. We’re confirming it now; your order status will update in your account once Stripe notifies us.</p><Link className="button dark-button" href="/account">View your account</Link></main>;
}
