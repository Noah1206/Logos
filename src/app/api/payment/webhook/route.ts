import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://api.iamport.kr/users/getToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imp_key: process.env.PORTONE_API_KEY,
      imp_secret: process.env.PORTONE_API_SECRET,
    }),
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`토큰 발급 실패: ${data.message}`);
  }
  return data.response.access_token;
}

async function getPaymentByImpUid(impUid: string, accessToken: string) {
  const res = await fetch(`https://api.iamport.kr/payments/${impUid}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`결제 조회 실패: ${data.message}`);
  }
  return data.response;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { imp_uid, merchant_uid } = body;

  if (!imp_uid || !merchant_uid) {
    return NextResponse.json({ success: false, error: "필수 파라미터 누락" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { paymentId: merchant_uid },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "주문 없음" }, { status: 404 });
  }

  if (order.status === "PAID") {
    return NextResponse.json({ success: true });
  }

  let payment;
  try {
    const accessToken = await getAccessToken();
    payment = await getPaymentByImpUid(imp_uid, accessToken);
  } catch {
    return NextResponse.json({ success: false, error: "결제 조회 실패" }, { status: 502 });
  }

  if (payment.status !== "paid") {
    return NextResponse.json({ success: false, error: "결제 미완료" }, { status: 400 });
  }

  if (payment.amount !== order.amount) {
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
        paymentId: merchant_uid,
        transactionId: imp_uid,
        amount: payment.amount,
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
