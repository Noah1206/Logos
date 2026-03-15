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
import "@xyflow/react/dist/style.css";
import { useTranslation } from "@/i18n";
import StudyStatsCard from "./StudyStatsCard";

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

/* ─── Color palette ─── */

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

/* ─── Custom Study Card Node ─── */

const CARD_W = 280;

const StudyCardNode = memo(({ data }: NodeProps) => {
  const d = data as StudyNodeData;
  const topic = d.topic || "other";
  const a = ACCENT[topic] || ACCENT.other;
  const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "";

  return (
    <div
      style={{
        width: CARD_W,
        background: "#262626",
        borderRadius: 10,
        borderLeft: `3px solid ${a.border}`,
        boxShadow: `0 2px 20px rgba(0,0,0,0.4), 0 0 1px ${a.border}40`,
        padding: "14px 16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        cursor: "grab",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "transparent", width: 8, height: 8, border: "none" }} />
      <Handle type="target" position={Position.Left} id="lt" style={{ background: "transparent", width: 8, height: 8, border: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "transparent", width: 8, height: 8, border: "none" }} />
      <Handle type="source" position={Position.Right} id="rs" style={{ background: "transparent", width: 8, height: 8, border: "none" }} />

      {/* Header: title + date */}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5", lineHeight: 1.35, marginBottom: 6, paddingRight: 4 }}>
        {d.label}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        {/* Topic tag */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: a.tag,
            background: a.tagBg,
            padding: "2px 7px",
            borderRadius: 4,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {topic}
        </span>
        {date && (
          <span style={{ fontSize: 10, color: "#555" }}>{date}</span>
        )}
      </div>

      {/* Summary */}
      {d.summary && (
        <div
          style={{
            fontSize: 11.5,
            color: "#888",
            lineHeight: 1.55,
            marginBottom: 10,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {d.summary}
        </div>
      )}

      {/* Key concepts */}
      {d.keyConcepts && d.keyConcepts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {d.keyConcepts.map((c: string, i: number) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                color: "#999",
                background: "#333",
                borderRadius: 4,
                padding: "2px 7px",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
StudyCardNode.displayName = "StudyCardNode";

const nodeTypes = { studyCard: StudyCardNode };

/* ─── Layout: Force-directed, center-out, no overlap ─── */

function applyForceLayout(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: { x: -CARD_W / 2, y: -60 } }];
  }

  const N = nodes.length;
  const idIdx = new Map(nodes.map((n, i) => [n.id, i]));

  const NW = CARD_W + 50;
  const NH = 180;

  // Find root: most connected node
  const connCount = new Map<string, number>();
  for (const n of nodes) connCount.set(n.id, 0);
  for (const e of edges) {
    if (idIdx.has(e.source)) connCount.set(e.source, (connCount.get(e.source) || 0) + 1);
    if (idIdx.has(e.target)) connCount.set(e.target, (connCount.get(e.target) || 0) + 1);
  }
  let rootIdx = 0;
  let maxC = -1;
  for (const [id, c] of connCount) {
    if (c > maxC) { maxC = c; rootIdx = idIdx.get(id)!; }
  }

  // Init positions
  const px = new Float64Array(N);
  const py = new Float64Array(N);
  const vx = new Float64Array(N);
  const vy = new Float64Array(N);

  const initR = Math.max(250, N * 50);
  for (let i = 0; i < N; i++) {
    if (i === rootIdx) {
      px[i] = 0; py[i] = 0;
    } else {
      const idx = i > rootIdx ? i - 1 : i;
      const a = (idx / (N - 1)) * 2 * Math.PI;
      px[i] = Math.cos(a) * initR;
      py[i] = Math.sin(a) * initR;
    }
  }

  // Simulation
  const ITERS = 250;
  const EDGE_LEN = 420;
  const REPULSION = 1200000;
  const EDGE_STR = 0.004;
  const CENTER_G = 0.003;
  const DAMPING = 0.88;

  for (let iter = 0; iter < ITERS; iter++) {
    const alpha = 1 - iter / ITERS;

    // Repulsion
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let dx = px[j] - px[i];
        let dy = py[j] - py[i];
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) { dx = Math.random() * 2 - 1; dy = Math.random() * 2 - 1; dist = 1.41; }

        const minD = Math.sqrt(NW * NW + NH * NH);
        const overlap = dist < minD ? 4 : 1;
        const f = (REPULSION * alpha * overlap) / (dist * dist);
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

    // Root gravity
    vx[rootIdx] -= px[rootIdx] * CENTER_G;
    vy[rootIdx] -= py[rootIdx] * CENTER_G;

    for (let i = 0; i < N; i++) {
      vx[i] *= DAMPING; vy[i] *= DAMPING;
      px[i] += vx[i]; py[i] += vy[i];
    }
  }

  // Overlap resolution
  for (let pass = 0; pass < 80; pass++) {
    let any = false;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = px[j] - px[i];
        const dy = py[j] - py[i];
        const ox = NW - Math.abs(dx);
        const oy = NH - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          any = true;
          if (ox < oy) {
            const p = ox / 2 + 8;
            px[i] -= dx > 0 ? p : -p;
            px[j] += dx > 0 ? p : -p;
          } else {
            const p = oy / 2 + 8;
            py[i] -= dy > 0 ? p : -p;
            py[j] += dy > 0 ? p : -p;
          }
        }
      }
    }
    if (!any) break;
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
    }));

    const styledEdges: Edge[] = graphData.edges.map((e) => {
      const shared = e.data?.shared || [];
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: shared.length > 0 ? shared[0] : "",
        labelStyle: { fill: "#666", fontSize: 10 },
        labelBgStyle: { fill: "#1a1a1a", fillOpacity: 0.85 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 3,
        style: { stroke: "#444", strokeWidth: 1, strokeDasharray: "6 4" },
        type: "smoothstep",
        markerEnd: { type: "arrowclosed" as const, color: "#444", width: 12, height: 12 },
      };
    });

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
    setTimeout(() => instance.fitView({ padding: 0.2, maxZoom: 1 }), 100);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onClose} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg transition-colors">
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
          {graphStats.totalStudies} {t("study.stats.studies")} · {graphStats.totalConcepts} {t("study.stats.concepts")} · {graphStats.totalConnections} {t("study.stats.connections")}
        </p>
      )}

      {graphStats && <StudyStatsCard stats={graphStats} />}

      {/* Graph */}
      <div className="rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.15)] border border-gray-200/60">
        <div className="h-[600px]">
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
                <p className="text-[#666] text-sm mt-2 max-w-[280px] leading-relaxed">{t("study.graph.emptyDesc")}</p>
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
              fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
              minZoom={0.02}
              maxZoom={2}
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
      </div>
    </div>
  );
}
