export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY || process.env.skey;
}

export function getStripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.pkey;
}