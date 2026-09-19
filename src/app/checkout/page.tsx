"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  name: string;
  price: string;
  icon: string;
  image?: string;
  quantity: number;
};

const STORAGE_KEY = "healthfood4u_cart";

function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setCartItems(getCartItems());
  }, []);

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

  return (
    <main className="page-shell checkout-page-shell">
      <section className="checkout-layout">
        <div className="checkout-panel">
          <p className="eyebrow">Secure checkout</p>
          <h1>Shipping &amp; payment</h1>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="firstName">First name</label>
              <input id="firstName" type="text" defaultValue="Alex" />
            </div>
            <div className="form-field">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" type="text" defaultValue="Morgan" />
            </div>
            <div className="form-field full">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" defaultValue="alex@example.com" />
            </div>
            <div className="form-field full">
              <label htmlFor="address">Street address</label>
              <input id="address" type="text" defaultValue="214 Willow Lane" />
            </div>
            <div className="form-field">
              <label htmlFor="city">City</label>
              <input id="city" type="text" defaultValue="Austin" />
            </div>
            <div className="form-field">
              <label htmlFor="state">State</label>
              <select id="state" defaultValue="TX">
                <option value="TX">Texas</option>
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="FL">Florida</option>
              </select>
            </div>
            <div className="form-field full">
              <label htmlFor="card">Card details</label>
              <input id="card" type="text" defaultValue="4242 4242 4242 4242" />
            </div>
          </div>

          <div className="checkout-divider" />

          <div>
            <p className="eyebrow">Shipping method</p>
            <div className="shipping-option-list">
              <div className="shipping-option">
                <div>
                  <strong>Standard delivery</strong>
                  <span>3–5 business days</span>
                </div>
                <strong>$5.99</strong>
              </div>
              <div className="shipping-option">
                <div>
                  <strong>Express delivery</strong>
                  <span>1–2 business days</span>
                </div>
                <strong>$12.99</strong>
              </div>
            </div>
          </div>
        </div>

        <aside className="checkout-summary">
          <h2>Order summary</h2>

          <div className="summary-list">
            {cartItems.map((item) => (
              <div key={`${item.name}-${item.icon}`} className="summary-item">
                <div className="summary-item-name">
                  <span className="summary-item-icon" aria-hidden="true">{item.icon}</span>
                  <strong>{item.name}</strong>
                </div>
                <span className="summary-item-price">{item.price}</span>
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <div className="checkout-total-row">
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div className="checkout-total-row">
              <span>Shipping</span>
              <strong>${shipping.toFixed(2)}</strong>
            </div>
            <div className="checkout-total-row total">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>

          <button className="primary-button wide checkout-button" type="button">
            Pay now
          </button>
        </aside>
      </section>
    </main>
  );
}
