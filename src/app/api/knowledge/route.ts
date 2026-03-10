import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 사용자의 지식 목록 조회
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (topic) where.topic = topic;

  const knowledge = await prisma.knowledge.findMany({
    where,
    include: {
      conversion: {
        select: { title: true, sourceUrl: true, mode: true, platform: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: knowledge });
}
