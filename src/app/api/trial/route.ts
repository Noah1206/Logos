import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 현재 무료 전환 - 항상 active 반환
// 유료화 시 아래 주석 해제하고 이 코드 제거
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ active: false, daysLeft: 0, started: false });
  }

  return NextResponse.json({
    active: true,
    daysLeft: 9999,
    started: true,
    credits: 9999,
    conversionCount: 0,
  });
}

/* 유료화 시 복원
import { prisma } from "@/lib/prisma";
import { getTrialStatus } from "@/lib/trial";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ active: false, daysLeft: 0, started: false });
  }

  const [user, conversionCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { freeTrialStartedAt: true, credits: true },
    }),
    prisma.conversion.count({
      where: { userId: session.user.id },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ active: false, daysLeft: 0, started: false });
  }

  const trial = getTrialStatus(user.freeTrialStartedAt);

  return NextResponse.json({
    ...trial,
    credits: user.credits,
    conversionCount,
  });
}
*/
