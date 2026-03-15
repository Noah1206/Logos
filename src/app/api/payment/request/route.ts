// 유료화 시 복원 - 결제 요청 API
// 현재 무료 전환으로 전체 주석 처리

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "결제 시스템이 비활성화되어 있습니다. 현재 무료로 이용 가능합니다." },
    { status: 503 }
  );
}

/* 유료화 시 복원
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPackage } from "@/lib/payment";
import type { CreateOrderRequest, CreateOrderResponse } from "@/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<CreateOrderResponse>(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const body = (await request.json()) as CreateOrderRequest;
  const pkg = getPackage(body.packageId);

  if (!pkg) {
    return NextResponse.json<CreateOrderResponse>(
      { success: false, error: "유효하지 않은 패키지입니다." },
      { status: 400 }
    );
  }

  const paymentId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      packageId: pkg.id,
      amount: pkg.price,
      credits: pkg.credits,
      status: "PENDING",
      paymentId,
    },
  });

  return NextResponse.json<CreateOrderResponse>({
    success: true,
    orderId: order.id,
    paymentId,
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
    orderName: `LOGOS.ai ${pkg.name} (${pkg.credits}크레딧)`,
    totalAmount: pkg.price,
  });
}
*/
