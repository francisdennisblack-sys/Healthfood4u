"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type StripeEmbeddedCheckout } from "@stripe/stripe-js";

export default function StripeCheckoutModal({
  clientSecret,
  publishableKey,
  url,
  onClose,
}: {
  clientSecret: string;
  publishableKey?: string;
  url?: string;
  onClose: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unmounted = false;

    async function initCheckout() {
      const key = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!key) {
        setLoading(false);
        return;
      }

      try {
        const stripe = await loadStripe(key);
        if (unmounted || !stripe) return;

        const stripeObj = stripe as unknown as {
          createEmbeddedCheckoutPage?: (options: { clientSecret: string }) => Promise<StripeEmbeddedCheckout>;
          initEmbeddedCheckout?: (options: { clientSecret: string }) => Promise<StripeEmbeddedCheckout>;
        };

        const createEmbedded = stripeObj.createEmbeddedCheckoutPage ?? stripeObj.initEmbeddedCheckout;

        if (typeof createEmbedded !== "function") {
          throw new Error("Stripe Embedded Checkout is not available.");
        }

        const embeddedCheckout = await createEmbedded({ clientSecret });
        if (unmounted) {
          embeddedCheckout.destroy();
          return;
        }

        checkoutRef.current = embeddedCheckout;
        if (mountRef.current) {
          embeddedCheckout.mount(mountRef.current);
          setLoading(false);
        }
      } catch (err) {
        if (!unmounted) {
          console.error("Embedded Stripe checkout initialization failed:", err);
          setError(err instanceof Error ? err.message : "Embedded checkout failed to initialize.");
          setLoading(false);
        }
      }
    }

    void initCheckout();

    return () => {
      unmounted = true;
      if (checkoutRef.current) {
        try {
          checkoutRef.current.destroy();
        } catch {
          // ignore cleanup errors
        }
        checkoutRef.current = null;
      }
    };
  }, [clientSecret, publishableKey]);

  const keyAvailable = Boolean(publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  return (
    <div
      className="panel-backdrop stripe-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Stripe Checkout"
      onClick={onClose}
    >
      <div
        className="panel-sheet stripe-modal-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="panel-close"
          aria-label="Close checkout window"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="panel-content stripe-modal-content">
          <div ref={mountRef} id="stripe-checkout-mount" className="stripe-checkout-mount" />
        </div>
      </div>
    </div>
  );
}
