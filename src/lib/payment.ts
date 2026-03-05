export const CREDIT_PACKAGES = {
  starter: {
    id: "starter",
    name: "스타터 팩",
    credits: 10,
    price: 9900,
    pricePerCredit: 990,
  },
  pro: {
    id: "pro",
    name: "프로 팩",
    credits: 50,
    price: 29000,
    pricePerCredit: 580,
  },
} as const;

export type PackageId = keyof typeof CREDIT_PACKAGES;

export function getPackage(packageId: string) {
  return CREDIT_PACKAGES[packageId as PackageId] ?? null;
}
