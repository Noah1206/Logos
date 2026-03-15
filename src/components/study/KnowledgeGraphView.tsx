"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { useTranslation } from "@/i18n";
import StudyStatsCard from "./StudyStatsCard";

interface GraphData {
  nodes: Array<{
    id: string;
    data: { label: string; count: number; topics: string[] };
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: { type: string };
  }>;
}

interface GraphStats {
  totalConcepts: number;
  totalConnections: number;
  totalStudies: number;
}

interface KnowledgeGraphViewProps {
  onClose: () => void;
}

const TOPIC_COLORS: Record<string, string> = {
  food: "#EF4444",
  fitness: "#10B981",
  beauty: "#EC4899",
  education: "#3B82F6",
  tech: "#8B5CF6",
  business: "#F59E0B",
  lifestyle: "#F97316",
  other: "#6B7280",
};

const TOPIC_BG: Record<string, string> = {
  food: "bg-red-50 text-red-700 border-red-200",
  fitness: "bg-emerald-50 text-emerald-700 border-emerald-200",
  beauty: "bg-pink-50 text-pink-700 border-pink-200",
  education: "bg-blue-50 text-blue-700 border-blue-200",
  tech: "bg-violet-50 text-violet-700 border-violet-200",
  business: "bg-amber-50 text-amber-700 border-amber-200",
  lifestyle: "bg-orange-50 text-orange-700 border-orange-200",
  other: "bg-gray-50 text-gray-600 border-gray-200",
};

function applyDagreLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 120 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 160, height: 50 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return { ...node, position: { x: pos.x - 80, y: pos.y - 25 } };
  });
}

export default function KnowledgeGraphView({ onClose }: KnowledgeGraphViewProps) {
  const { t } = useTranslation();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/knowledge/graph")
      .then((r) => r.json())
      .then((res) => {
        setGraphData(res.data);
        setGraphStats(res.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const { flowNodes, flowEdges, topics } = useMemo(() => {
    if (!graphData) return { flowNodes: [], flowEdges: [], topics: [] as string[] };

    const allTopics = new Set<string>();
    graphData.nodes.forEach((n) => n.data.topics.forEach((t: string) => allTopics.add(t)));

    let filteredNodes = graphData.nodes;
    if (topicFilter) {
      filteredNodes = graphData.nodes.filter((n) =>
        n.data.topics.includes(topicFilter)
      );
    }
    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    const styledNodes: Node[] = filteredNodes.map((n) => {
      const primaryTopic = n.data.topics[0] || "other";
      const color = TOPIC_COLORS[primaryTopic] || TOPIC_COLORS.other;
      const size = Math.max(12, Math.min(16, 12 + n.data.count));

      return {
        id: n.id,
        data: { label: n.data.label },
        position: n.position,
        style: {
          background: "#fff",
          color: "#111827",
          border: `2px solid ${color}`,
          borderRadius: "12px",
          padding: "8px 14px",
          fontSize: `${size}px`,
          fontWeight: n.data.count > 1 ? 700 : 500,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        },
      };
    });

    const styledEdges: Edge[] = graphData.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        style: {
          stroke: e.data?.type === "prerequisite" ? "#EF4444" :
                  e.data?.type === "extends" ? "#3B82F6" : "#D1D5DB",
          strokeWidth: e.data?.type === "related" ? 1 : 2,
          strokeDasharray: e.data?.type === "related" ? "5 5" : undefined,
        },
        type: "smoothstep",
        animated: e.data?.type === "prerequisite",
      }));

    const layoutNodes = styledNodes.length > 0 ? applyDagreLayout(styledNodes, styledEdges) : [];

    return { flowNodes: layoutNodes, flowEdges: styledEdges, topics: Array.from(allTopics) };
  }, [graphData, topicFilter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 100);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-32">
      {/* 헤더 — 뒤로가기 + 제목 */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onClose}
          className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {t("study.graph.title")}
        </h1>
      </div>

      {/* 통계 서브텍스트 */}
      <div className="flex items-center gap-3 mb-8 text-sm text-gray-400 ml-8">
        {graphStats && (
          <>
            <span>{graphStats.totalStudies} {t("study.stats.studies")}</span>
            <span>·</span>
            <span>{graphStats.totalConcepts} {t("study.stats.concepts")}</span>
            <span>·</span>
            <span>{graphStats.totalConnections} {t("study.stats.connections")}</span>
          </>
        )}
      </div>

      {/* 학습 통계 카드 */}
      {graphStats && (
        <StudyStatsCard stats={graphStats} />
      )}

      {/* 토픽 필터 */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setTopicFilter(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex-shrink-0 ${
              !topicFilter
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {t("study.graph.all")}
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setTopicFilter(topic === topicFilter ? null : topic)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex-shrink-0 ${
                topicFilter === topic
                  ? TOPIC_BG[topic] || TOPIC_BG.other
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* 그래프 영역 */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <div className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-400">{t("common.processing")}</p>
              </div>
            </div>
          ) : flowNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium">{t("study.graph.empty")}</p>
                <p className="text-gray-400 text-sm mt-1">{t("study.graph.emptyDesc")}</p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onInit={onInit as any}
              fitView
              minZoom={0.2}
              maxZoom={3}
              attributionPosition="bottom-left"
            >
              <Background color="#F3F4F6" gap={20} />
              <Controls showInteractive={false} />
              <MiniMap
                style={{ background: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB" }}
                nodeColor={(node) => {
                  const border = (node.style?.border as string) || "";
                  const match = border.match(/#[0-9A-Fa-f]{6}/);
                  return match ? match[0] : "#D1D5DB";
                }}
              />
            </ReactFlow>
          )}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-5 mt-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-dashed border-gray-300" /> {t("study.graph.legend.related")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-red-400" /> {t("study.graph.legend.prerequisite")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-blue-400" /> {t("study.graph.legend.extends")}
        </span>
      </div>
    </div>
  );
}
