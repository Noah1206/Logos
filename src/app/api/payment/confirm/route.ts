import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ConfirmPaymentResponse } from "@/types";

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// V1 API: 액세스 토큰 발급
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

// V1 API: imp_uid로 결제 정보 조회
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ConfirmPaymentResponse>(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { paymentId, impUid } = body;

  if (!paymentId || !impUid) {
    return NextResponse.json<ConfirmPaymentResponse>(
      { success: false, error: "paymentId와 impUid가 필요합니다." },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { paymentId },
  });

  if (!order) {
    return NextResponse.json<ConfirmPaymentResponse>(
      { success: false, error: "주문을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (order.userId !== session.user.id) {
    return NextResponse.json<ConfirmPaymentResponse>(
      { success: false, error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  // 이미 처리된 주문 (멱등성)
  if (order.status === "PAID") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    return NextResponse.json<ConfirmPaymentResponse>({
      success: true,
      credits: user?.credits ?? 0,
    });
  }

  // V1 API로 결제 상태 조회
  let payment;
  try {
    const accessToken = await getAccessToken();
    payment = await getPaymentByImpUid(impUid, accessToken);
  } catch {
    return NextResponse.json<ConfirmPaymentResponse>(
      { success: false, error: "결제 정보 조회에 실패했습니다." },
      { status: 502 }
    );
  }

  // 결제 상태 확인
  if (payment.status !== "paid") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json<ConfirmPaymentResponse>(
      { success: false, error: `결제가 완료되지 않았습니다. (${payment.status})` },
      { status: 400 }
    );
  }

  // 금액 검증
  if (payment.amount !== order.amount) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json<ConfirmPaymentResponse>(
      { success: false, error: "결제 금액이 일치하지 않습니다." },
      { status: 400 }
    );
  }

  // 트랜잭션: Order 업데이트 + Payment 생성 + 크레딧 추가
  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        paymentId,
        transactionId: impUid,
        amount: payment.amount,
        status: "PAID",
        rawResponse: JSON.stringify(payment),
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: session.user.id },
      data: { credits: { increment: order.credits } },
      select: { credits: true },
    });

    return updatedUser;
  });

  return NextResponse.json<ConfirmPaymentResponse>({
    success: true,
    credits: result.credits,
  });
}
