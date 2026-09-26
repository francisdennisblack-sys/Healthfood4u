import type Stripe from "stripe";

export class CheckoutInputError extends Error {}

export type CheckoutItem = { lookupKey: string; name: string; quantity: number };
export type CheckoutQuote = {
  items: { name: string; priceId: string; quantity: number; unitAmount: number }[];
  currency: "usd";
  subtotal: number;
  shipping: number;
  total: number;
};

export function parseCheckoutItems(value: unknown): CheckoutItem[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    throw new CheckoutInputError("Your cart must contain between 1 and 50 products.");
  }

  const quantities = new Map<string, { lookupKey: string; name: string; quantity: number }>();
  for (const item of value) {
    if (!item || typeof item.name !== "string" || item.name.length > 200 ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new CheckoutInputError("Each product needs a valid name and a quantity from 1 to 99.");
    }
    const name = item.name.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug || slug === "scoprio") throw new CheckoutInputError("This product cannot be purchased.");
    const lookupKey = `healthfood4u_${slug}`;
    const existing = quantities.get(lookupKey);
    const currentQty = (existing?.quantity ?? 0) + item.quantity;
    if (currentQty > 99) throw new CheckoutInputError("The maximum quantity per product is 99.");
    quantities.set(lookupKey, { lookupKey, name, quantity: currentQty });
  }
  return [...quantities.values()];
}

export async function getCheckoutQuote(stripe: Stripe, items: CheckoutItem[]): Promise<CheckoutQuote> {
  const pricesByLookupKey = new Map<string, Stripe.Price>();
  const pricesByName = new Map<string, Stripe.Price>();

  const storePrice = (price: Stripe.Price) => {
    if (price.lookup_key) {
      pricesByLookupKey.set(price.lookup_key, price);
    }
    if (price.product && typeof price.product === "object" && !price.product.deleted && price.product.name) {
      const normalizedName = price.product.name.toLowerCase().trim();
      if (!pricesByName.has(normalizedName)) {
        pricesByName.set(normalizedName, price);
      }
    }
  };

  for (let offset = 0; offset < items.length; offset += 10) {
    const result = await stripe.prices.list({
      active: true,
      lookup_keys: items.slice(offset, offset + 10).map(item => item.lookupKey),
      expand: ["data.product"],
      limit: 100,
    });
    for (const price of result.data) {
      storePrice(price);
    }
  }

  const missing = items.filter(item => !pricesByLookupKey.has(item.lookupKey) && !pricesByName.has(item.name.toLowerCase().trim()));
  if (missing.length > 0) {
    const allActive = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 100,
    });
    for (const price of allActive.data) {
      storePrice(price);
    }
  }

  const lines = items.map(item => {
    const price = pricesByLookupKey.get(item.lookupKey) ?? pricesByName.get(item.name.toLowerCase().trim());
    const product = price?.product;
    if (!price || !price.active || price.type !== "one_time" || price.currency !== "usd" ||
        price.billing_scheme !== "per_unit" || !Number.isSafeInteger(price.unit_amount) ||
        price.unit_amount! <= 0 || !product || typeof product === "string" ||
        product.deleted || !product.active) {
      throw new CheckoutInputError(`A purchasable USD Stripe price is missing for ${item.name}. Please contact the shop.`);
    }
    return { name: product.name, priceId: price.id, quantity: item.quantity, unitAmount: price.unit_amount! };
  });
  const subtotal = lines.reduce((total, item) => total + item.unitAmount * item.quantity, 0);
  const shipping = 599;
  if (!Number.isSafeInteger(subtotal) || subtotal + shipping > 99999999) {
    throw new CheckoutInputError("This order exceeds the checkout limit.");
  }
  return { items: lines, currency: "usd", subtotal, shipping, total: subtotal + shipping };
}

export function checkoutSessionParameters(
  quote: CheckoutQuote,
  siteUrl: string,
  uiMode: "hosted" | "embedded" = "hosted",
): Stripe.Checkout.SessionCreateParams {
  const origin = new URL(siteUrl).origin;
  const returnUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;

  const commonParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: quote.items.map(item => ({ price: item.priceId, quantity: item.quantity })),
    billing_address_collection: "required",
    shipping_address_collection: { allowed_countries: ["US", "CA"] },
    phone_number_collection: { enabled: true },
    shipping_options: [{
      shipping_rate_data: {
        display_name: "Standard delivery",
        type: "fixed_amount",
        fixed_amount: { amount: quote.shipping, currency: quote.currency },
        delivery_estimate: {
          minimum: { unit: "business_day", value: 3 },
          maximum: { unit: "business_day", value: 5 },
        },
      },
    }],
  };

  if (uiMode === "embedded") {
    return {
      ...commonParams,
      ui_mode: "embedded_page",
      return_url: returnUrl,
    };
  }

  return {
    ...commonParams,
    success_url: returnUrl,
    cancel_url: `${origin}/checkout`,
  };
}