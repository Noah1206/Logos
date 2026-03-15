import { NextResponse } from "next/server";

// 현재 무제한 무료 - 결제 알림 비활성화
export async function POST() {
  return NextResponse.json(
    { success: false, error: "결제 시스템이 비활성화되어 있습니다." },
    { status: 503 }
  );
}

/* 유료화 시 복원 - 결제 알림 수신 등록
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST_ORIGINAL() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { paymentNotify: true },
  });

  return NextResponse.json({ success: true });
}
*/
