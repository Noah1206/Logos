import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 공개 공유 결과 조회 (비로그인 접근 가능)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const conversion = await prisma.conversion.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      title: true,
      mode: true,
      platform: true,
      resultJson: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  if (!conversion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: conversion });
}
