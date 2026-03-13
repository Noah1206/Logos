import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
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
