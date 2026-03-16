"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTranslation } from "@/i18n";

/* ─── Types ─── */

interface StudyNodeData {
  label: string;
  topic: string;
  summary: string;
  keyConcepts: string[];
  keywords: string[];
  createdAt: string;
  [key: string]: unknown;
}

interface GraphData {
  nodes: Array<{
    id: string;
    data: StudyNodeData;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: { shared: string[] };
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

/* ─── Topic colors ─── */

const TOPIC_DOT: Record<string, string> = {
  food: "#F87171",
  fitness: "#34D399",
  beauty: "#F472B6",
  education: "#60A5FA",
  tech: "#A78BFA",
  business: "#FBBF24",
  lifestyle: "#FB923C",
  other: "#818CF8",
};

/* ─── Custom Node ─── */

const CARD_W = 260;

const StudyCardNode = memo(({ data }: NodeProps) => {
  const d = data as StudyNodeData;
  const topic = d.topic || "other";
  const dot = TOPIC_DOT[topic] || TOPIC_DOT.other;
  const date = d.createdAt
    ? new Date(d.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div
      style={{
        width: CARD_W,
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #F0F0F0",
        padding: "16px 18px",
        cursor: "default",
        transition: "box-shadow 0.2s ease",
      }}
      className="hover:shadow-md"
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="target" position={Position.Left} id="lt" style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} id="rs" style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Title */}
      <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.5, marginBottom: 8 }}>
        {d.label}
      </p>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: d.summary ? 10 : 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "#999", fontWeight: 500 }}>{topic}</span>
        {date && (
          <>
            <span style={{ fontSize: 11, color: "#DDD" }}>|</span>
            <span style={{ fontSize: 11, color: "#BBB" }}>{date}</span>
          </>
        )}
      </div>

      {/* Summary - 2 lines max */}
      {d.summary && (
        <p
          style={{
            fontSize: 12,
            color: "#888",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {d.summary}
        </p>
      )}
    </div>
  );
});
StudyCardNode.displayName = "StudyCardNode";

const nodeTypes = { studyCard: StudyCardNode };

/* ─── Force-directed layout ─── */

function applyForceLayout(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: { x: -CARD_W / 2, y: -60 } }];
  }

  const N = nodes.length;
  const idIdx = new Map(nodes.map((n, i) => [n.id, i]));

  const NW = CARD_W + 40;
  const NH = 140;

  const px = new Float64Array(N);
  const py = new Float64Array(N);
  const vx = new Float64Array(N);
  const vy = new Float64Array(N);

  // Scatter initial positions in a circle with jitter
  const initR = Math.max(250, N * 50);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
    const r = initR * (0.5 + Math.random() * 0.5);
    px[i] = Math.cos(a) * r;
    py[i] = Math.sin(a) * r;
  }

  const ITERS = 300;
  const REPULSION = 800000;
  const EDGE_LEN = 400;
  const EDGE_STR = 0.005;
  const CENTER_G = 0.002;
  const DAMPING = 0.85;

  for (let iter = 0; iter < ITERS; iter++) {
    const alpha = 1 - iter / ITERS;

    // Repulsion (all pairs)
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let dx = px[j] - px[i];
        let dy = py[j] - py[i];
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) {
          dx = (Math.random() - 0.5) * 2;
          dy = (Math.random() - 0.5) * 2;
          dist = Math.sqrt(dx * dx + dy * dy);
        }
        const f = (REPULSION * alpha) / (dist * dist);
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        vx[i] -= fx; vy[i] -= fy;
        vx[j] += fx; vy[j] += fy;
      }
    }

    // Edge attraction
    for (const e of edges) {
      const i = idIdx.get(e.source);
      const j = idIdx.get(e.target);
      if (i === undefined || j === undefined) continue;
      const dx = px[j] - px[i];
      const dy = py[j] - py[i];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;
      const diff = dist - EDGE_LEN;
      const f = diff * EDGE_STR * alpha;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      vx[i] += fx; vy[i] += fy;
      vx[j] -= fx; vy[j] -= fy;
    }

    // Center gravity (all nodes)
    for (let i = 0; i < N; i++) {
      vx[i] -= px[i] * CENTER_G * alpha;
      vy[i] -= py[i] * CENTER_G * alpha;
    }

    // Apply velocity
    for (let i = 0; i < N; i++) {
      vx[i] *= DAMPING;
      vy[i] *= DAMPING;
      px[i] += vx[i];
      py[i] += vy[i];
    }
  }

  // Overlap resolution — push apart using distance, not axis-aligned (prevents linearization)
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = px[j] - px[i];
        const dy = py[j] - py[i];
        const overlapX = NW - Math.abs(dx);
        const overlapY = NH - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          // Push apart along the line connecting centers (keeps 2D spread)
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) dist = 1;
          const push = Math.min(overlapX, overlapY) * 0.6;
          const ppx = (dx / dist) * push;
          const ppy = (dy / dist) * push;
          px[i] -= ppx; py[i] -= ppy;
          px[j] += ppx; py[j] += ppy;
        }
      }
    }
    if (!moved) break;
  }

  const halfW = CARD_W / 2;
  return nodes.map((n, i) => ({
    ...n,
    position: { x: px[i] - halfW, y: py[i] - 60 },
  }));
}

/* ─── Main Component ─── */

export default function KnowledgeGraphView({ onClose }: KnowledgeGraphViewProps) {
  const { t } = useTranslation();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!graphData) return { flowNodes: [], flowEdges: [] };

    const styledNodes: Node[] = graphData.nodes.map((n) => ({
      id: n.id,
      type: "studyCard",
      data: n.data,
      position: n.position,
      draggable: false,
    }));

    const styledEdges: Edge[] = graphData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      style: { stroke: "#E5E5E5", strokeWidth: 1 },
      type: "default",
    }));

    const laid = styledNodes.length > 0 ? applyForceLayout(styledNodes, styledEdges) : [];
    return { flowNodes: laid, flowEdges: styledEdges };
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const onInit = useCallback((instance: { fitView: (o?: { padding?: number; maxZoom?: number }) => void }) => {
    setTimeout(() => instance.fitView({ padding: 0.3, maxZoom: 1 }), 80);
  }, []);

  return (
    <div className="mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {t("study.graph.title")}
          </h1>
        </div>
        {graphStats && (
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{t("study.stats.studies")} <strong className="text-gray-600 font-semibold">{graphStats.totalStudies}</strong></span>
            <span>{t("study.stats.concepts")} <strong className="text-gray-600 font-semibold">{graphStats.totalConcepts}</strong></span>
            <span>{t("study.stats.connections")} <strong className="text-gray-600 font-semibold">{graphStats.totalConnections}</strong></span>
          </div>
        )}
      </div>

      {/* Graph */}
      <div className="rounded-xl overflow-hidden border border-gray-100" style={{ background: "#FAFAFA" }}>
        <div style={{ height: "calc(100vh - 160px)", minHeight: 500 }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
            </div>
          ) : flowNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-gray-400">{t("study.graph.empty")}</p>
                <p className="text-xs text-gray-300 mt-1">{t("study.graph.emptyDesc")}</p>
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
              fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
              minZoom={0.05}
              maxZoom={2}
              attributionPosition="bottom-left"
              style={{ background: "#FAFAFA" }}
              defaultEdgeOptions={{ type: "default" }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#EBEBEB" gap={20} size={0.5} />
              <Controls
                showInteractive={false}
                position="bottom-left"
                style={{ borderRadius: 8, border: "1px solid #F0F0F0", boxShadow: "none", overflow: "hidden" }}
              />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
