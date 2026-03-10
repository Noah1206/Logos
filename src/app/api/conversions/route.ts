import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 변환 히스토리 목록 (페이지네이션, mode 필터)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const where: Record<string, unknown> = { userId: session.user.id };
  if (mode) where.mode = mode;

  const conversions = await prisma.conversion.findMany({
    where,
    include: { knowledge: true },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = conversions.length > limit;
  const data = hasMore ? conversions.slice(0, limit) : conversions;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({ data, nextCursor, hasMore });
}

// POST: 변환 결과 저장
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    sourceUrl,
    sourceType,
    platform,
    mode,
    tone,
    title,
    resultContent,
    resultJson,
    transcript,
    creditUsed = 1,
  } = body;

  const conversion = await prisma.conversion.create({
    data: {
      userId: session.user.id,
      sourceUrl,
      sourceType,
      platform,
      mode,
      tone,
      title,
      resultContent,
      resultJson,
      transcript,
      creditUsed,
      status: "COMPLETED",
    },
  });

  return NextResponse.json({ data: conversion });
}
