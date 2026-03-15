import { NextResponse } from "next/server";

// 현재 무제한 무료 - 결제 비활성화
export async function POST() {
  return NextResponse.json(
    { success: false, error: "결제 시스템이 비활성화되어 있습니다. 현재 모든 기능이 무료입니다." },
    { status: 503 }
  );
}

/* 유료화 시 복원 - Stripe Checkout Session 생성
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getStripePackage } from "@/lib/stripe";

export async function POST_ORIGINAL(request: Request) {
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
*/
