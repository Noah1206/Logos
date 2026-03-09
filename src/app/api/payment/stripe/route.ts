import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getStripePackage } from "@/lib/stripe";

// Stripe Checkout Session 생성
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Login required." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { packageId } = body;

  const pkg = getStripePackage(packageId);
  if (!pkg) {
    return NextResponse.json(
      { success: false, error: "Invalid package." },
      { status: 400 }
    );
  }

  const paymentId = `stripe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // DB에 주문 생성 (PENDING 상태)
  await prisma.order.create({
    data: {
      userId: session.user.id,
      packageId: pkg.id,
      amount: pkg.priceUsd,
      credits: pkg.credits,
      status: "PENDING",
      paymentId,
    },
  });

  // Stripe Checkout Session 생성
  const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `LOGOS.ai ${pkg.name} (${pkg.credits} credits)`,
          },
          unit_amount: pkg.priceUsd,
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentId,
      userId: session.user.id,
      packageId: pkg.id,
    },
    success_url: `${origin}/pricing?payment=success`,
    cancel_url: `${origin}/pricing?payment=cancelled`,
  });

  return NextResponse.json({
    success: true,
    checkoutUrl: checkoutSession.url,
  });
}
