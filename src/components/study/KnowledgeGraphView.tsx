"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { useTranslation } from "@/i18n";
import StudyStatsCard from "./StudyStatsCard";

/* ─── Types ─── */

interface NodeData {
  label: string;
  count: number;
  topics: string[];
  summary?: string;
  keywords?: string[];
  [key: string]: unknown;
}

interface GraphData {
  nodes: Array<{
    id: string;
    data: NodeData;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: { type: string; label?: string };
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

/* ─── Obsidian-style color palette ─── */

const ACCENT: Record<string, { border: string; tag: string; tagBg: string }> = {
  food:      { border: "#EF4444", tag: "#FCA5A5", tagBg: "rgba(239,68,68,0.15)" },
  fitness:   { border: "#10B981", tag: "#6EE7B7", tagBg: "rgba(16,185,129,0.15)" },
  beauty:    { border: "#EC4899", tag: "#F9A8D4", tagBg: "rgba(236,72,153,0.15)" },
  education: { border: "#3B82F6", tag: "#93C5FD", tagBg: "rgba(59,130,246,0.15)" },
  tech:      { border: "#8B5CF6", tag: "#C4B5FD", tagBg: "rgba(139,92,246,0.15)" },
  business:  { border: "#F59E0B", tag: "#FCD34D", tagBg: "rgba(245,158,11,0.15)" },
  lifestyle: { border: "#F97316", tag: "#FDBA74", tagBg: "rgba(249,115,22,0.15)" },
  other:     { border: "#7f6df2", tag: "#C4B5FD", tagBg: "rgba(127,109,242,0.15)" },
};

const FILTER_PILL: Record<string, string> = {
  food: "bg-red-500/20 text-red-300 border-red-500/30",
  fitness: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  beauty: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  education: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  tech: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  business: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  lifestyle: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

/* ─── Custom Card Node (Obsidian Canvas style) ─── */

const CARD_W = 240;
const CARD_MIN_H = 72;

const ConceptCardNode = memo(({ data }: NodeProps) => {
  const d = data as NodeData;
  const topic = d.topics?.[0] || "other";
  const a = ACCENT[topic] || ACCENT.other;

  return (
    <div
      style={{
        width: CARD_W,
        minHeight: CARD_MIN_H,
        background: "#262626",
        borderRadius: 8,
        borderLeft: `3px solid ${a.border}`,
        boxShadow: `0 0 16px rgba(0,0,0,0.4), 0 0 1px ${a.border}40`,
        padding: "12px 14px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        cursor: "grab",
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ background: "#555", width: 6, height: 6, border: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "#555", width: 6, height: 6, border: "none" }} />

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#e5e5e5", lineHeight: 1.3, marginBottom: 4 }}>
        {d.label}
      </div>

      {/* Topic tag */}
      <div
        style={{
          display: "inline-block",
          fontSize: 10,
          fontWeight: 600,
          color: a.tag,
          background: a.tagBg,
          padding: "1px 6px",
          borderRadius: 3,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: d.summary || (d.keywords && d.keywords.length > 0) ? 8 : 0,
        }}
      >
        {topic}
      </div>

      {/* Summary (truncated) */}
      {d.summary && (
        <div
          style={{
            fontSize: 11,
            color: "#888",
            lineHeight: 1.5,
            marginBottom: d.keywords && d.keywords.length > 0 ? 8 : 0,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {d.summary}
        </div>
      )}

      {/* Keywords pills */}
      {d.keywords && d.keywords.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {d.keywords.slice(0, 3).map((kw: string, i: number) => (
            <span
              key={i}
              style={{
                fontSize: 9,
                color: "#777",
                background: "#333",
                borderRadius: 3,
                padding: "1px 5px",
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Count badge */}
      {d.count > 1 && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontSize: 9,
            fontWeight: 700,
            color: "#999",
            background: "#333",
            borderRadius: 10,
            padding: "1px 6px",
            minWidth: 18,
            textAlign: "center",
          }}
        >
          {d.count}
        </div>
      )}
    </div>
  );
});
ConceptCardNode.displayName = "ConceptCardNode";

const nodeTypes = { conceptCard: ConceptCardNode };

/* ─── Layout ─── */

function applyDagreLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: CARD_W + 40, height: 120 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - (CARD_W + 40) / 2, y: pos.y - 60 },
    };
  });
}

/* ─── Main Component ─── */

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

    // Card-style nodes
    const styledNodes: Node[] = filteredNodes.map((n) => ({
      id: n.id,
      type: "conceptCard",
      data: n.data,
      position: n.position,
    }));

    // Edges — Obsidian-style thin lines
    const styledEdges: Edge[] = graphData.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => {
        const isPrereq = e.data?.type === "prerequisite";
        const isExtends = e.data?.type === "extends";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label || "",
          labelStyle: { fill: "#666", fontSize: 10 },
          labelBgStyle: { fill: "#1e1e1e", fillOpacity: 0.8 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 3,
          style: {
            stroke: isPrereq ? "#EF4444" : isExtends ? "#3B82F6" : "#444",
            strokeWidth: isPrereq || isExtends ? 1.5 : 1,
            strokeDasharray: !isPrereq && !isExtends ? "6 4" : undefined,
          },
          type: "smoothstep",
          animated: isPrereq,
          markerEnd: {
            type: "arrowclosed" as const,
            color: isPrereq ? "#EF4444" : isExtends ? "#3B82F6" : "#444",
            width: 14,
            height: 14,
          },
        };
      });

    const layoutNodes =
      styledNodes.length > 0 ? applyDagreLayout(styledNodes, styledEdges) : [];

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

      {graphStats && (
        <p className="text-sm text-gray-400 ml-8 mb-8">
          {graphStats.totalStudies} {t("study.stats.studies")} · {graphStats.totalConcepts}{" "}
          {t("study.stats.concepts")} · {graphStats.totalConnections}{" "}
          {t("study.stats.connections")}
        </p>
      )}

      {graphStats && <StudyStatsCard stats={graphStats} />}

      {/* Topic filters */}
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
                  ? FILTER_PILL[topic] || FILTER_PILL.other
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* Graph Canvas — Obsidian Canvas dark */}
      <div className="rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.15)] border border-gray-200/60">
        <div className="h-[600px] relative">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-[#1a1a1a]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "0s" }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "0.3s" }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "0.6s" }} />
              </div>
            </div>
          ) : flowNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-[#1a1a1a]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#252525] border border-[#333] flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <p className="text-[#bbb] font-semibold text-[15px]">{t("study.graph.empty")}</p>
                <p className="text-[#666] text-sm mt-2 max-w-[280px] leading-relaxed">
                  {t("study.graph.emptyDesc")}
                </p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onInit={onInit as any}
              fitView
              minZoom={0.15}
              maxZoom={2.5}
              attributionPosition="bottom-left"
              style={{ background: "#1a1a1a" }}
              defaultEdgeOptions={{ type: "smoothstep" }}
            >
              <Background color="#282828" gap={30} size={1} />
              <Controls showInteractive={false} />
              <MiniMap
                style={{
                  background: "#222",
                  borderRadius: 8,
                  border: "1px solid #333",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}
                maskColor="rgba(0,0,0,0.55)"
                nodeColor={() => "#7f6df2"}
              />
            </ReactFlow>
          )}
        </div>
      </div>

      {/* Legend */}
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
