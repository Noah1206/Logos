import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, topicFilter } = await req.json();

    // 사용자의 Knowledge 데이터 조회
    const where: Record<string, unknown> = { userId: session.user.id };
    if (topicFilter) where.topic = topicFilter;

    const knowledgeEntries = await prisma.knowledge.findMany({
      where,
      include: {
        conversion: {
          select: { title: true, sourceUrl: true, mode: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // FastAPI로 스트리밍 요청
    const response = await fetch(`${FASTAPI_URL}/api/think`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        knowledge_context: knowledgeEntries,
        topic_filter: topicFilter,
      }),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `FastAPI error: ${error}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
