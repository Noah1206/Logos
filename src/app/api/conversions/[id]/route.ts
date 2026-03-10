import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 단일 변환 상세
export async function GET(
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
    include: { knowledge: true },
  });

  if (!conversion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: conversion });
}

// DELETE: 변환 삭제
export async function DELETE(
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

  await prisma.conversion.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
