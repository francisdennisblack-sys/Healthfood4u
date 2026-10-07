export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY || process.env.skey;
}