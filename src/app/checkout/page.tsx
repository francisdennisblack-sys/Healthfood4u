"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import type { CheckoutQuote } from "@/lib/stripeCheckout";
import StripeCheckoutModal from "@/components/StripeCheckoutModal";

type CartItem = { name: string; quantity: number };
type QuoteResult = { key: string; quote: (CheckoutQuote & { automaticTax: boolean }) | null; error: string };

const STORAGE_KEY = "healthfood4u_cart";

function getCartItems(storedValue?: string): CartItem[] {
  try {
    const parsed = JSON.parse(storedValue ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.name === "string" && item.name !== "Scoprio") : [];
  } catch {
    return [];
  }
}

const formatAmount = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);

export default function CheckoutPage() {
  const [cartItems] = useLocalStorageState<CartItem[]>(STORAGE_KEY, [], getCartItems);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [paymentError, setPaymentError] = useState({ key: "", message: "" });
  const [paying, setPaying] = useState(false);
  const [retry, setRetry] = useState(0);
  const [stripeSession, setStripeSession] = useState<{ clientSecret?: string; publishableKey?: string; url?: string } | null>(null);
  const itemsJson = JSON.stringify(cartItems.map(item => ({ name: item.name, quantity: item.quantity })));
  const requestKey = `${retry}:${itemsJson}`;
  const quote = quoteResult?.key === requestKey ? quoteResult.quote : null;
  const error = (paymentError.key === requestKey ? paymentError.message : "") ||
    (quoteResult?.key === requestKey ? quoteResult.error : "");

  useEffect(() => {
    const controller = new AbortController();
    if (itemsJson === "[]") return;

    async function loadQuote() {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "quote", items: JSON.parse(itemsJson) }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Prices could not be loaded.");
        if (!controller.signal.aborted) setQuoteResult({ key: requestKey, quote: result, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setQuoteResult({ key: requestKey, quote: null, error: error instanceof Error ? error.message : "Prices could not be loaded." });
      }
    }
    void loadQuote();
    return () => controller.abort();
  }, [itemsJson, requestKey]);

  async function pay() {
    if (paying || !quote) return;
    setPaying(true);
    setPaymentError({ key: requestKey, message: "" });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", items: JSON.parse(itemsJson) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Checkout could not be opened.");
      if (result.clientSecret) {
        setStripeSession({ clientSecret: result.clientSecret, publishableKey: result.publishableKey, url: result.url });
        setPaying(false);
      } else if (typeof result.url === "string") {
        window.location.assign(result.url);
      } else {
        throw new Error("Stripe did not return a valid checkout session.");
      }
    } catch (error) {
      setPaymentError({ key: requestKey, message: error instanceof Error ? error.message : "Checkout could not be opened." });
      setPaying(false);
    }
  }

  return (
    <main className="page-shell checkout-page-shell">
      <section className="stripe-checkout-content">
        <Link href="/cart" className="secondary-button">Back to cart</Link>
        {cartItems.length === 0 ? (
          <p>Your cart is empty. <Link href="/">Continue shopping</Link></p>
        ) : (
          <>
            {!quote && !error && <p role="status">Loading current prices...</p>}
            {quote && (
              <>
                <div className="summary-list">
                  {quote.items.map(item => (
                    <div className="summary-item" key={item.priceId}>
                      <div className="summary-item-name"><span>{item.name}</span><span>Qty: {item.quantity}</span></div>
                      <span className="summary-item-price">{formatAmount(item.unitAmount * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="checkout-total">
                  <div className="checkout-total-row"><span>Subtotal</span><span>{formatAmount(quote.subtotal)}</span></div>
                  <div className="checkout-total-row"><span>Standard delivery</span><span>{formatAmount(quote.shipping)}</span></div>
                  <div className="checkout-total-row total"><span>{quote.automaticTax ? "Total before tax" : "Total"}</span><span>{formatAmount(quote.total)}</span></div>
                </div>
              </>
            )}
            {error && <p role="alert">{error}</p>}
            {!quote && error && <button type="button" className="secondary-button" onClick={() => setRetry(current => current + 1)}>Try again</button>}
            <button className="primary-button pay-button" type="button" onClick={pay} disabled={!quote || paying}>
              {paying ? "Loading..." : quote ? `Pay ${formatAmount(quote.total)}` : "Pay"}
            </button>
          </>
        )}
      </section>

      {stripeSession && stripeSession.clientSecret && (
        <StripeCheckoutModal
          clientSecret={stripeSession.clientSecret}
          publishableKey={stripeSession.publishableKey}
          url={stripeSession.url}
          onClose={() => setStripeSession(null)}
        />
      )}
    </main>
  );
}
