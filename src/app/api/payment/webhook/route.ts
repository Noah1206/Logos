import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// PortOne V2 API: paymentId로 결제 정보 조회
async function getPaymentFromPortOneV2(paymentId: string) {
  const res = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
      },
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`결제 조회 실패 (${res.status}): ${errorBody}`);
  }

  return res.json();
}

// 웹훅 서명 검증 (HMAC-SHA256)
async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!secret) return true; // 시크릿 미설정 시 스킵

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computed = Buffer.from(sig).toString("base64");
    return computed === signature;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // 웹훅 서명 검증
  const rawBody = await request.text();
  const webhookSignature = request.headers.get("webhook-signature") ?? "";
  const isValid = await verifyWebhookSignature(rawBody, webhookSignature);

  if (!isValid) {
    return NextResponse.json({ success: false, error: "서명 검증 실패" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // V2 웹훅 형식: { type: "Transaction.Paid", data: { paymentId, ... } }
  const paymentId = body.data?.paymentId ?? body.merchant_uid;
  const webhookType = body.type;

  if (!paymentId) {
    return NextResponse.json({ success: false, error: "paymentId 누락" }, { status: 400 });
  }

  // Transaction.Paid 이벤트만 처리
  if (webhookType && webhookType !== "Transaction.Paid") {
    return NextResponse.json({ success: true, message: "이벤트 무시" });
  }

  const order = await prisma.order.findUnique({
    where: { paymentId },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "주문 없음" }, { status: 404 });
  }

  if (order.status === "PAID") {
    return NextResponse.json({ success: true });
  }

  // V2 API로 결제 상태 검증
  let payment;
  try {
    payment = await getPaymentFromPortOneV2(paymentId);
  } catch {
    return NextResponse.json({ success: false, error: "결제 조회 실패" }, { status: 502 });
  }

  if (payment.status !== "PAID") {
    return NextResponse.json({ success: false, error: "결제 미완료" }, { status: 400 });
  }

  const paidAmount = payment.amount?.total ?? payment.amount;
  if (paidAmount !== order.amount) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ success: false, error: "금액 불일치" }, { status: 400 });
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
        transactionId: payment.id ?? paymentId,
        amount: paidAmount,
        status: "PAID",
        rawResponse: JSON.stringify(payment),
      },
    });

    await tx.user.update({
      where: { id: order.userId },
      data: { credits: { increment: order.credits } },
    });
  });

  return NextResponse.json({ success: true });
}
