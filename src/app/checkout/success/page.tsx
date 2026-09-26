import Link from "next/link";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let heading = "Payment not confirmed";
  let message = "We could not confirm this payment. Check your Stripe receipt before trying again.";
  let total: string | null = null;
  let customerName: string | null = null;
  let shippingAddressText: string | null = null;
  let isPaid = false;

  if (process.env.STRIPE_SECRET_KEY && typeof sessionId === "string" && /^cs_[a-zA-Z0-9_]+$/.test(sessionId) && sessionId.length < 256) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 15000, maxNetworkRetries: 1 });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.storefront === "healthfood4u" && session.status === "complete") {
        if (session.payment_status === "paid") {
          isPaid = true;
          heading = "Order confirmed!";
          message = "Thank you for your purchase. An order confirmation email has been sent.";
          customerName = session.customer_details?.name || null;
          const rawSession = session as unknown as { shipping_details?: { address?: Stripe.Address } };
          const shipping = rawSession.shipping_details?.address || session.customer_details?.address;
          if (shipping) {
            shippingAddressText = [
              shipping.line1,
              shipping.line2,
              `${shipping.city || ""}, ${shipping.state || ""} ${shipping.postal_code || ""}`.trim(),
              shipping.country,
            ].filter(Boolean).join(", ");
          }
          if (session.amount_total !== null && session.currency) {
            total = new Intl.NumberFormat("en-US", { style: "currency", currency: session.currency }).format(session.amount_total / 100);
          }
        } else {
          heading = "Payment processing";
          message = "Your payment is still processing. Please do not pay again.";
        }
      }
    } catch {
      message = "Payment confirmation is temporarily unavailable. Check your Stripe receipt before trying again.";
    }
  }

  return (
    <main className="page-shell checkout-page-shell">
      <section className="stripe-checkout-content">
        <h1>{heading}</h1>
        <p>{message}</p>
        {customerName && <p>Customer: {customerName}</p>}
        {shippingAddressText && <p>Ship to: {shippingAddressText}</p>}
        {total && <p>Total paid: {total}</p>}
        {isPaid && (
          <script
            dangerouslySetInnerHTML={{
              __html: `try { localStorage.removeItem("healthfood4u_cart"); window.dispatchEvent(new Event("storage")); } catch(e){}`,
            }}
          />
        )}
        <Link href="/" className="secondary-button">Continue shopping</Link>
      </section>
    </main>
  );
}