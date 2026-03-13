import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// POST: 공유 토큰 생성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversion = await prisma.conversion.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!conversion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 이미 토큰이 있으면 재사용
  if (conversion.shareToken) {
    return NextResponse.json({ shareToken: conversion.shareToken });
  }

  // 새 토큰 생성
  const shareToken = randomBytes(16).toString("hex");
  await prisma.conversion.update({
    where: { id },
    data: { shareToken },
  });

  return NextResponse.json({ shareToken });
}
