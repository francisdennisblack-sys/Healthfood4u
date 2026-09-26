This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Stripe Checkout Setup

The cart's Pay button now opens `/checkout`. The server fetches current Stripe
prices, multiplies them by the selected quantities, and creates a Stripe-hosted
Checkout Session. Browser-stored prices are never used to charge a customer.
Stripe collects email, billing address, shipping address, and payment details.
Delivery is currently US-only, with $5.99 standard shipping (3-5 business days).

### 1. Create Stripe Prices

Start in a Stripe sandbox/test environment. In **Product catalog**, add each
website product with an active, one-time, per-unit USD price. Open its price
details and assign the corresponding **lookup key** below. The key belongs to
the price, not the product's metadata or its `prod_...` ID.

| Website product | Stripe price lookup key |
| --- | --- |
| Organic Greens Box | `healthfood4u_organic-greens-box` |
| Citrus Glow Pack | `healthfood4u_citrus-glow-pack` |
| Protein Balance Kit | `healthfood4u_protein-balance-kit` |
| Daily Gut Blend | `healthfood4u_daily-gut-blend` |
| Two Avocados | `healthfood4u_two-avocados` |
| Berry Core Bites | `healthfood4u_berry-core-bites` |
| Nature Fuel Granola | `healthfood4u_nature-fuel-granola` |
| Lemon Mint Water | `healthfood4u_lemon-mint-water` |
| Plant Protein Shake | `healthfood4u_plant-protein-shake` |
| Superfood Snack Duo | `healthfood4u_superfood-snack-duo` |
| Omega Seed Box | `healthfood4u_omega-seed-box` |
| Feed Box | `healthfood4u_feed-box` |
| Celery Bundle | `healthfood4u_celery-bundle` |
| Chicken Bell Pepper Stir Fry | `healthfood4u_chicken-bell-pepper-stir-fry` |
| Tofu Pho Bowl | `healthfood4u_tofu-pho-bowl` |
| Tomato Harvest Box | `healthfood4u_tomato-harvest-box` |
| 8-Ounce Salmon with Lemon | `healthfood4u_8-ounce-salmon-with-lemon` |
| 8 Ounce Steak | `healthfood4u_8-ounce-steak` |
| Berry Nut Pack | `healthfood4u_berry-nut-pack` |

To change an amount later, create a new price and transfer the same lookup key
to it. Checkout reads the key again for each quote and payment session. Products
without a matching purchasable price cannot proceed to payment. Creating a new
Stripe product does not automatically add a storefront card: the storefront
catalog remains in Firebase/code. Its displayed prices and cart subtotal are
estimates; the checkout page loads authoritative prices from Stripe.

### 2. Configure Server Environment Variables

Enter these privately in `.env.local` for development and in **Vercel project >
Settings > Environment Variables** for deployment. Never paste secret keys into
chat or use a `NEXT_PUBLIC_` prefix for them.

```dotenv
STRIPE_SECRET_KEY=your_Stripe_secret_key
SITE_URL=http://localhost:3001
STRIPE_AUTOMATIC_TAX_ENABLED=false
```

Use a sandbox/test secret key locally. For production, use the live secret key,
live products/prices with matching lookup keys, and
`SITE_URL=https://healthfood4u.com`. Restart development after changing variables;
redeploy Vercel after changing deployment variables. Hosted Checkout does not
require a browser publishable key. The existing fixed Payment Link is no longer
used by the cart.

The old arbitrary 8% tax estimate has been removed. Automatic tax is off by
default. Configure Stripe Tax, product tax codes, and applicable registrations
before setting `STRIPE_AUTOMATIC_TAX_ENABLED=true`. When enabled, Stripe computes
the tax using the collected address; the website quote is labeled before tax.

### 3. Verify Before Accepting Live Payments

- Add two units of a mapped product; confirm checkout uses twice its Stripe price.
- Change the browser cart's price field; the charged amount must not change.
- Continue to Stripe and confirm email, billing address, and delivery address are required.
- In sandbox/test mode only, complete payment with Stripe's test card
	`4242 4242 4242 4242`, a future expiry, and any valid test CVC.
- Confirm cancel returns to checkout and successful payment returns to a
	server-verified confirmation page. A URL parameter alone never proves payment.
- Check the payment and delivery address in the Stripe Dashboard.
- Resolve the dashboard's **Payouts paused > View task** requirement before relying on payouts.

This integration does not yet include webhook-driven order fulfillment,
inventory updates, or automatic cart clearing. Process paid orders from the
Stripe Dashboard; add a verified payment webhook before automating dispatch.

Run local pricing/address contract tests with:

```bash
node --experimental-strip-types --test src/lib/stripeCheckout.test.mjs
```
