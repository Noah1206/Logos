import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

// POST: conversion ID → FastAPI 호출 → Knowledge 테이블 저장
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversionId } = await req.json();

  // 변환 결과 조회
  const conversion = await prisma.conversion.findFirst({
    where: { id: conversionId, userId: session.user.id },
  });

  if (!conversion) {
    return NextResponse.json({ error: "Conversion not found" }, { status: 404 });
  }

  // 이미 지식이 추출되어 있으면 스킵
  const existing = await prisma.knowledge.findUnique({
    where: { conversionId },
  });
  if (existing) {
    return NextResponse.json({ data: existing });
  }

  // FastAPI로 지식 추출 요청
  const content = conversion.resultContent || "";
  const transcript = conversion.transcript || "";

  if (!content && !transcript) {
    return NextResponse.json({ error: "No content to extract" }, { status: 400 });
  }

  try {
    const fastapiRes = await fetch(`${FASTAPI_URL}/api/extract-knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, transcript }),
    });

    if (!fastapiRes.ok) {
      const error = await fastapiRes.text();
      return NextResponse.json({ error: `Extraction failed: ${error}` }, { status: 500 });
    }

    const result = await fastapiRes.json();

    // Knowledge 테이블에 저장
    const knowledge = await prisma.knowledge.create({
      data: {
        conversionId,
        userId: session.user.id,
        summary: result.summary,
        keyConcepts: result.key_concepts,
        keywords: result.keywords,
        topic: result.topic,
        subtopics: result.subtopics,
      },
    });

    return NextResponse.json({ data: knowledge });
  } catch {
    return NextResponse.json({ error: "Knowledge extraction service unavailable" }, { status: 503 });
  }
}
