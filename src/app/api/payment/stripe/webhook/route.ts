import { NextResponse } from "next/server";

// 현재 무제한 무료 - Stripe 웹훅 비활성화
export async function POST() {
  return NextResponse.json(
    { error: "결제 시스템이 비활성화되어 있습니다." },
    { status: 503 }
  );
}

/* 유료화 시 복원 - Stripe Webhook 처리
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function POST_ORIGINAL(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Stripe webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const paymentId = session.metadata?.paymentId;
    if (!paymentId) {
      console.error("Stripe webhook: missing paymentId in metadata");
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { paymentId },
    });

    if (!order) {
      console.error(`Stripe webhook: order not found for paymentId ${paymentId}`);
      return NextResponse.json({ received: true });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ received: true });
    }

    const paidAmount = session.amount_total;
    if (paidAmount !== order.amount) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      console.error(
        `Stripe webhook: amount mismatch. Expected ${order.amount}, got ${paidAmount}`
      );
      return NextResponse.json({ received: true });
    }

    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentId,
          transactionId: session.payment_intent as string,
          amount: paidAmount!,
          status: "PAID",
          rawResponse: JSON.stringify(session),
        },
      });

      await tx.user.update({
        where: { id: order.userId },
        data: { credits: { increment: order.credits } },
      });
    });

    console.log(`Stripe payment completed: ${paymentId}, credits: ${order.credits}`);
  }

  return NextResponse.json({ received: true });
}
*/
