import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 유저의 모든 Knowledge — 변환 1개 = 노드 1개
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const knowledgeList = await prisma.knowledge.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      summary: true,
      keyConcepts: true,
      keywords: true,
      topic: true,
      subtopics: true,
      conceptRelationships: true,
      createdAt: true,
      conversion: {
        select: {
          title: true,
          sourceUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 노드: 변환 1개 = 1 노드
  const nodes = knowledgeList.map((k, i) => ({
    id: k.id,
    data: {
      label: k.conversion?.title || k.topic || "학습 노트",
      topic: k.topic || "other",
      summary: k.summary || "",
      keyConcepts: ((k.keyConcepts as string[]) || []).slice(0, 5),
      keywords: ((k.keywords as string[]) || []).slice(0, 4),
      createdAt: k.createdAt.toISOString(),
    },
    position: { x: 0, y: 0 },
  }));

  // 엣지: 공유 개념이 있는 노드끼리 연결
  const edges: Array<{ id: string; source: string; target: string; data: { shared: string[] } }> = [];
  const edgeSet = new Set<string>();

  for (let i = 0; i < knowledgeList.length; i++) {
    const aConcepts = new Set((knowledgeList[i].keyConcepts as string[]) || []);
    const aKeywords = new Set((knowledgeList[i].keywords as string[]) || []);

    for (let j = i + 1; j < knowledgeList.length; j++) {
      const bConcepts = (knowledgeList[j].keyConcepts as string[]) || [];
      const bKeywords = (knowledgeList[j].keywords as string[]) || [];

      // 공유 개념 + 키워드
      const shared: string[] = [];
      for (const c of bConcepts) if (aConcepts.has(c)) shared.push(c);
      for (const w of bKeywords) if (aKeywords.has(w)) shared.push(w);

      // 같은 토픽이면 연결
      const sameTopic = knowledgeList[i].topic === knowledgeList[j].topic && !!knowledgeList[i].topic;

      if (shared.length > 0 || sameTopic) {
        const key = `${knowledgeList[i].id}-${knowledgeList[j].id}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            id: `e-${edges.length}`,
            source: knowledgeList[i].id,
            target: knowledgeList[j].id,
            data: { shared: shared.slice(0, 3) },
          });
        }
      }
    }
  }

  return NextResponse.json({
    data: { nodes, edges },
    stats: {
      totalConcepts: knowledgeList.reduce((s, k) => s + ((k.keyConcepts as string[]) || []).length, 0),
      totalConnections: edges.length,
      totalStudies: knowledgeList.length,
    },
  });
}
