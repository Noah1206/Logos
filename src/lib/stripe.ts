import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Stripe용 USD 크레딧 패키지
export const STRIPE_PACKAGES = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    credits: 10,
    priceUsd: 799, // $7.99 (cents)
    priceDisplay: "$7.99",
  },
  pro: {
    id: "pro",
    name: "Pro Pack",
    credits: 50,
    priceUsd: 2399, // $23.99 (cents)
    priceDisplay: "$23.99",
  },
} as const;

export type StripePackageId = keyof typeof STRIPE_PACKAGES;

export function getStripePackage(packageId: string) {
  return STRIPE_PACKAGES[packageId as StripePackageId] ?? null;
}
