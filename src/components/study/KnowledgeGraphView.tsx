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

// Obsidian-inspired palette
const NODE_COLORS: Record<string, { bg: string; glow: string; text: string }> = {
  food: { bg: "#EF4444", glow: "rgba(239,68,68,0.35)", text: "#FCA5A5" },
  fitness: { bg: "#10B981", glow: "rgba(16,185,129,0.35)", text: "#6EE7B7" },
  beauty: { bg: "#EC4899", glow: "rgba(236,72,153,0.35)", text: "#F9A8D4" },
  education: { bg: "#3B82F6", glow: "rgba(59,130,246,0.35)", text: "#93C5FD" },
  tech: { bg: "#8B5CF6", glow: "rgba(139,92,246,0.35)", text: "#C4B5FD" },
  business: { bg: "#F59E0B", glow: "rgba(245,158,11,0.35)", text: "#FCD34D" },
  lifestyle: { bg: "#F97316", glow: "rgba(249,115,22,0.35)", text: "#FDBA74" },
  other: { bg: "#7f6df2", glow: "rgba(127,109,242,0.35)", text: "#C4B5FD" },
};

const FILTER_COLORS: Record<string, string> = {
  food: "bg-red-500/20 text-red-300 border-red-500/30",
  fitness: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  beauty: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  education: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  tech: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  business: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  lifestyle: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

function applyDagreLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 100, ranksep: 140 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 140, height: 40 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return { ...node, position: { x: pos.x - 70, y: pos.y - 20 } };
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

    // Obsidian-style glowing nodes on dark background
    const styledNodes: Node[] = filteredNodes.map((n) => {
      const primaryTopic = n.data.topics[0] || "other";
      const palette = NODE_COLORS[primaryTopic] || NODE_COLORS.other;
      const baseSize = Math.max(13, Math.min(16, 12 + n.data.count));

      return {
        id: n.id,
        data: { label: n.data.label },
        position: n.position,
        style: {
          background: `rgba(30,30,30,0.9)`,
          color: palette.text,
          border: `1.5px solid ${palette.bg}`,
          borderRadius: "20px",
          padding: "6px 16px",
          fontSize: `${baseSize}px`,
          fontWeight: n.data.count > 1 ? 600 : 400,
          boxShadow: `0 0 12px ${palette.glow}, 0 0 4px ${palette.glow}`,
          letterSpacing: "0.01em",
        },
      };
    });

    // Subtle glowing edges
    const styledEdges: Edge[] = graphData.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        style: {
          stroke:
            e.data?.type === "prerequisite" ? "#EF4444" :
            e.data?.type === "extends" ? "#3B82F6" : "#484849",
          strokeWidth: e.data?.type === "related" ? 1 : 1.5,
          strokeDasharray: e.data?.type === "related" ? "4 4" : undefined,
          opacity: 0.7,
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onClose}
          className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {t("study.graph.title")}
        </h1>
      </div>

      {/* Sub-stats */}
      {graphStats && (
        <p className="text-sm text-gray-400 ml-8 mb-8">
          {graphStats.totalStudies} {t("study.stats.studies")} · {graphStats.totalConcepts} {t("study.stats.concepts")} · {graphStats.totalConnections} {t("study.stats.connections")}
        </p>
      )}

      {/* Stats Cards — Lilys.ai style */}
      {graphStats && <StudyStatsCard stats={graphStats} />}

      {/* Topic Filter — floating over dark area */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setTopicFilter(null)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all flex-shrink-0 ${
              !topicFilter
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {t("study.graph.all")}
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setTopicFilter(topic === topicFilter ? null : topic)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all flex-shrink-0 ${
                topicFilter === topic
                  ? FILTER_COLORS[topic] || FILTER_COLORS.other
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* Graph Canvas — Obsidian dark style */}
      <div className="rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200/60">
        <div className="h-[560px] relative">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "0s" }} />
                <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "0.33s" }} />
                <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "0.66s" }} />
              </div>
            </div>
          ) : flowNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <p className="text-[#ccc] font-medium text-[15px]">{t("study.graph.empty")}</p>
                <p className="text-[#666] text-sm mt-2 max-w-[260px] leading-relaxed">{t("study.graph.emptyDesc")}</p>
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
              style={{ background: "#1e1e1e" }}
            >
              <Background color="#2a2a2a" gap={24} size={1} />
              <Controls
                showInteractive={false}
                style={{
                  background: "#2a2a2a",
                  borderRadius: "10px",
                  border: "1px solid #3a3a3a",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              />
              <MiniMap
                style={{
                  background: "#252525",
                  borderRadius: "10px",
                  border: "1px solid #3a3a3a",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                maskColor="rgba(0,0,0,0.6)"
                nodeColor={(node) => {
                  const border = (node.style?.border as string) || "";
                  const match = border.match(/#[0-9A-Fa-f]{6}/);
                  return match ? match[0] : "#7f6df2";
                }}
              />
            </ReactFlow>
          )}
        </div>
      </div>

      {/* Legend — minimal */}
      <div className="flex items-center gap-6 mt-5 text-xs text-gray-400">
        <span className="flex items-center gap-2">
          <span className="w-5 h-0 border-t border-dashed border-gray-400" />
          {t("study.graph.legend.related")}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 h-0 border-t-[1.5px] border-red-400" />
          {t("study.graph.legend.prerequisite")}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 h-0 border-t-[1.5px] border-blue-400" />
          {t("study.graph.legend.extends")}
        </span>
      </div>
    </div>
  );
}
