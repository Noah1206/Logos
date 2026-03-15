import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface GraphNode {
  id: string;
  data: { label: string; count: number; topics: string[] };
  position: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data?: { type: string };
}

// GET: 유저의 모든 Knowledge에서 지식 그래프 데이터 생성
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const knowledgeList = await prisma.knowledge.findMany({
    where: { userId: session.user.id },
    select: {
      keyConcepts: true,
      conceptRelationships: true,
      topic: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 노드: 개념명 → {count, topics} (중복 제거, 출현 횟수 집계)
  const nodeMap = new Map<string, { count: number; topics: Set<string> }>();
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const k of knowledgeList) {
    const topic = k.topic || "other";
    const concepts = (k.keyConcepts as string[]) || [];

    for (const concept of concepts) {
      const name = concept.trim();
      if (!name) continue;
      const existing = nodeMap.get(name);
      if (existing) {
        existing.count++;
        existing.topics.add(topic);
      } else {
        nodeMap.set(name, { count: 1, topics: new Set([topic]) });
      }
    }

    // concept_relationships에서 엣지 생성
    const relationships = (k.conceptRelationships as Array<{ from: string; to: string; type: string }>) || [];
    for (const rel of relationships) {
      const from = rel.from?.trim();
      const to = rel.to?.trim();
      if (!from || !to) continue;

      // 노드가 없으면 추가
      if (!nodeMap.has(from)) {
        nodeMap.set(from, { count: 1, topics: new Set([topic]) });
      }
      if (!nodeMap.has(to)) {
        nodeMap.set(to, { count: 1, topics: new Set([topic]) });
      }

      const edgeKey = `${from}->${to}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: `e-${edgeSet.size}`,
          source: from,
          target: to,
          data: { type: rel.type || "related" },
        });
      }
    }
  }

  // 노드 배열 생성 (위치는 프론트에서 dagre로 재계산)
  const nodes: GraphNode[] = [];
  let i = 0;
  for (const [name, data] of nodeMap) {
    nodes.push({
      id: name,
      data: {
        label: name,
        count: data.count,
        topics: Array.from(data.topics),
      },
      position: { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 },
    });
    i++;
  }

  return NextResponse.json({
    data: { nodes, edges },
    stats: {
      totalConcepts: nodes.length,
      totalConnections: edges.length,
      totalStudies: knowledgeList.length,
    },
  });
}
