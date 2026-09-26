import Stripe from "stripe";
import { CheckoutInputError, checkoutSessionParameters, getCheckoutQuote, parseCheckoutItems } from "@/lib/stripeCheckout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Checkout must be opened from this website." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  try {
    if (!body || !["quote", "pay"].includes(body.action)) throw new CheckoutInputError("Invalid checkout action.");
    const items = parseCheckoutItems(body.items);
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return Response.json({ error: "Checkout is not configured yet. Please contact the shop." }, { status: 503 });
    }
    const stripe = new Stripe(secretKey, { timeout: 15000, maxNetworkRetries: 1 });
    const quote = await getCheckoutQuote(stripe, items);
    const automaticTax = process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true";
    if (body.action === "quote") {
      return Response.json({ ...quote, automaticTax }, { headers: { "Cache-Control": "no-store" } });
    }

    const siteUrl = process.env.SITE_URL || request.headers.get("origin") || "http://localhost:3001";
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || "";
    const uiMode = body.uiMode === "hosted" ? "hosted" : "embedded";

    const session = await stripe.checkout.sessions.create({
      ...checkoutSessionParameters(quote, siteUrl, uiMode),
      automatic_tax: { enabled: automaticTax },
      metadata: { storefront: "healthfood4u" },
    });

    if (uiMode === "embedded" && session.client_secret) {
      return Response.json(
        {
          clientSecret: session.client_secret,
          publishableKey,
          url: session.url ?? undefined,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CheckoutInputError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Stripe checkout failed:", error);
    const details = error instanceof Error ? error.message : "Checkout configuration or network error";
    return Response.json({ error: `Checkout error: ${details}` }, { status: 502 });
  }
}