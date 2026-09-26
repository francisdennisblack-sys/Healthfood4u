"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import StripeCheckoutModal from "@/components/StripeCheckoutModal";

type CartItem = {
  name: string;
  price: string;
  icon: string;
  image: string;
  quantity: number;
};

const STORAGE_KEY = "healthfood4u_cart";

const productImageMap: Record<string, string> = {
  "Lemon Mint Water": "/assets/healthfood/product-07.jpg",
  "Nature Fuel Granola": "/assets/healthfood/product-08.jpg",
  "Berry Core Bites": "/assets/healthfood/product-06.jpg",
  "Omega Seed Box": "/assets/healthfood/omega-seed-box-screenshot.png",
  "Celery Bundle": "/assets/healthfood/product-10.jpg",
  "Organic Greens Box": "/assets/healthfood/product-05.jpg",
  "Citrus Glow Pack": "/assets/healthfood/product-02.jpg",
  "Protein Balance Kit": "/assets/healthfood/product-09.jpg",
  "Daily Gut Blend": "/assets/healthfood/product-04.jpg",
  "Two Avocados": "/assets/healthfood/product-01.jpg",
  "Plant Protein Shake": "/assets/healthfood/product-03.svg",
  "Superfood Snack Duo": "/assets/healthfood/product-11.jpg",
  "Scoprio": "/assets/healthfood/one-orange.png",
};

const quickAddItems = [
  { name: "Lemon Mint Water", icon: "🍋", image: productImageMap["Lemon Mint Water"], price: "$12" },
  { name: "Nature Fuel Granola", icon: "🌾", image: productImageMap["Nature Fuel Granola"], price: "$14" },
  { name: "Berry Core Bites", icon: "🫐", image: productImageMap["Berry Core Bites"], price: "$19" },
  { name: "Omega Seed Box", icon: "🌱", image: productImageMap["Omega Seed Box"], price: "$17" },
  { name: "Celery Bundle", icon: "🥬", image: productImageMap["Celery Bundle"], price: "$10" },
];

function getCartItems(storedValue?: string): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = storedValue ?? window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as Array<Partial<CartItem>>;
    return parsed.filter((item) => item.name !== "Scoprio").map((item) => ({
      name: item.name ?? "Healthy Product",
      price: item.price ?? "$0",
      icon: item.icon ?? "•",
      image: item.image ?? productImageMap[item.name ?? ""] ?? "/assets/healthfood/product-01.jpg",
      quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
    }));
  } catch {
    return [];
  }
}

export default function CartPage() {
  const [cartItems, setCartItems] = useLocalStorageState<CartItem[]>(STORAGE_KEY, [], getCartItems);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [stripeSession, setStripeSession] = useState<{ clientSecret?: string; publishableKey?: string; url?: string } | null>(null);

  const subtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const amount = Number.parseFloat(item.price.replace(/[^\d.]/g, "")) || 0;
        return total + amount * item.quantity;
      }, 0),
    [cartItems],
  );

  const shipping = cartItems.length > 0 ? 5.99 : 0;
  const total = subtotal + shipping;

  const handlePay = async () => {
    if (paying || cartItems.length === 0) return;
    setPaying(true);
    setPayError("");
    try {
      const items = cartItems.map((item) => ({ name: item.name, quantity: item.quantity }));
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", items }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Checkout could not be opened.");
      }

      if (result.clientSecret) {
        setStripeSession({ clientSecret: result.clientSecret, publishableKey: result.publishableKey, url: result.url });
        setPaying(false);
      } else if (typeof result.url === "string") {
        window.location.assign(result.url);
      } else {
        throw new Error("Stripe did not return a valid checkout session.");
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Checkout could not be opened.");
      setPaying(false);
    }
  };

  const addQuickItem = (item: { name: string; price: string; icon: string; image: string }) => {
    const nextCart = getCartItems();
    const index = nextCart.findIndex((existing) => existing.name === item.name);

    if (index >= 0) {
      nextCart[index].quantity += 1;
    } else {
      nextCart.push({ ...item, quantity: 1 });
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
    setCartItems(nextCart);
  };

  const removeCartItem = (name: string) => {
    const nextCart = getCartItems().filter((item) => item.name !== name);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
    setCartItems(nextCart);
  };

  return (
    <main className="page-shell cart-page-shell">
      {cartItems.length === 0 ? (
        <section className="empty-cart-page" aria-live="polite">
          <div className="empty-cart-produce" aria-hidden="true">
            {["🥑", "🍋", "🥕", "🥦", "🍅", "🍓"].map((produce) => (
              <span key={produce}>{produce}</span>
            ))}
          </div>
          <div className="empty-cart-message">
            <h1>Your cart is empty.</h1>
          </div>
          <Link href="/" className="secondary-button">Continue shopping</Link>
        </section>
      ) : (
        <section className="cart-shell">
          <div className="cart-main-stack">
            <div className="cart-panel">
              <div className="cart-header-row">
                <div className="cart-header-bag">
                  <svg className="large-cart-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="19" r="1.5" />
                    <circle cx="17" cy="19" r="1.5" />
                    <path d="M3 4h2l2.6 9.5a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 7H7" />
                  </svg>
                  <span className="cart-item-count">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)} item
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="cart-items-scroll">
                {cartItems.map((item) => (
                  <div key={`${item.name}-${item.icon}`} className="cart-item-row">
                    <div className="cart-product-visual" aria-hidden="true">
                      <img src={item.image} alt={item.name} className="cart-product-image" />
                    </div>
                    <div className="cart-product-meta">
                      <strong>{item.name}</strong>
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <div className="cart-product-price">{item.price}</div>
                    <button
                      type="button"
                      className="cart-remove-button"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeCartItem(item.name)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7 7h10l-.9 11.1A2 2 0 0 1 14.1 20H9.9a2 2 0 0 1-2-1.9L7 7Zm2.5-1.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V5h-5v-.5ZM4 7h16M10 10v6M14 10v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <aside className="summary-panel">
            <div className="summary-top-row">
              <span className="summary-close">×</span>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Standard delivery</span>
              <span>$5.99</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>

            <button
              type="button"
              className="primary-button pay-button"
              onClick={handlePay}
              disabled={paying}
              aria-label={`Pay $${total.toFixed(2)}`}
            >
              <span>{paying ? "Loading..." : `Pay $${total.toFixed(2)}`}</span>
            </button>

            {payError && <p role="alert" style={{ color: "#d93838", fontSize: "0.85rem", marginTop: "8px", textAlign: "center" }}>{payError}</p>}

            <p className="summary-disclaimer">
              By continuing to checkout, I agree to the Terms &amp; Conditions and have read the Privacy Policy.
            </p>
          </aside>
        </section>
      )}

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
