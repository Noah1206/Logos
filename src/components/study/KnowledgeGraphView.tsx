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

/* ─── Color palette (light) ─── */

const ACCENT: Record<string, { border: string; tag: string; tagBg: string }> = {
  food:      { border: "#EF4444", tag: "#DC2626", tagBg: "#FEF2F2" },
  fitness:   { border: "#10B981", tag: "#059669", tagBg: "#ECFDF5" },
  beauty:    { border: "#EC4899", tag: "#DB2777", tagBg: "#FDF2F8" },
  education: { border: "#3B82F6", tag: "#2563EB", tagBg: "#EFF6FF" },
  tech:      { border: "#8B5CF6", tag: "#7C3AED", tagBg: "#F5F3FF" },
  business:  { border: "#F59E0B", tag: "#D97706", tagBg: "#FFFBEB" },
  lifestyle: { border: "#F97316", tag: "#EA580C", tagBg: "#FFF7ED" },
  other:     { border: "#6366F1", tag: "#4F46E5", tagBg: "#EEF2FF" },
};

/* ─── Custom Study Card Node (white) ─── */

const CARD_W = 340;

const StudyCardNode = memo(({ data }: NodeProps) => {
  const d = data as StudyNodeData;
  const topic = d.topic || "other";
  const a = ACCENT[topic] || ACCENT.other;
  const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "";

  return (
    <div
      style={{
        width: CARD_W,
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #E5E7EB",
        borderLeft: `4px solid ${a.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        padding: "18px 20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        cursor: "grab",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#D1D5DB", width: 7, height: 7, border: "2px solid #fff" }} />
      <Handle type="target" position={Position.Left} id="lt" style={{ background: "#D1D5DB", width: 7, height: 7, border: "2px solid #fff" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "#D1D5DB", width: 7, height: 7, border: "2px solid #fff" }} />
      <Handle type="source" position={Position.Right} id="rs" style={{ background: "#D1D5DB", width: 7, height: 7, border: "2px solid #fff" }} />

      {/* Title */}
      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.4, marginBottom: 8 }}>
        {d.label}
      </div>

      {/* Topic tag + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: a.tag,
            background: a.tagBg,
            padding: "3px 8px",
            borderRadius: 5,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {topic}
        </span>
        {date && (
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{date}</span>
        )}
      </div>

      {/* Summary */}
      {d.summary && (
        <div
          style={{
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 1.6,
            marginBottom: 12,
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {d.keyConcepts.map((c: string, i: number) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                color: "#6B7280",
                background: "#F3F4F6",
                borderRadius: 5,
                padding: "3px 8px",
                border: "1px solid #E5E7EB",
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
    return [{ ...nodes[0], position: { x: -CARD_W / 2, y: -80 } }];
  }

  const N = nodes.length;
  const idIdx = new Map(nodes.map((n, i) => [n.id, i]));

  const NW = CARD_W + 60;
  const NH = 220;

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

  const px = new Float64Array(N);
  const py = new Float64Array(N);
  const vx = new Float64Array(N);
  const vy = new Float64Array(N);

  const initR = Math.max(300, N * 60);
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

  const ITERS = 250;
  const EDGE_LEN = 500;
  const REPULSION = 1800000;
  const EDGE_STR = 0.004;
  const CENTER_G = 0.003;
  const DAMPING = 0.88;

  for (let iter = 0; iter < ITERS; iter++) {
    const alpha = 1 - iter / ITERS;

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
            const p = ox / 2 + 10;
            px[i] -= dx > 0 ? p : -p;
            px[j] += dx > 0 ? p : -p;
          } else {
            const p = oy / 2 + 10;
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
    position: { x: px[i] - halfW, y: py[i] - 80 },
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
        labelStyle: { fill: "#9CA3AF", fontSize: 11, fontWeight: 500 },
        labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        style: { stroke: "#D1D5DB", strokeWidth: 1.5 },
        type: "smoothstep",
        markerEnd: { type: "arrowclosed" as const, color: "#D1D5DB", width: 14, height: 14 },
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
    setTimeout(() => instance.fitView({ padding: 0.25, maxZoom: 1 }), 100);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-32">
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
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="h-[700px]">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0s" }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0.3s" }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0.6s" }} />
              </div>
            </div>
          ) : flowNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <p className="text-gray-900 font-semibold text-[15px]">{t("study.graph.empty")}</p>
                <p className="text-gray-400 text-sm mt-2 max-w-[280px] leading-relaxed">{t("study.graph.emptyDesc")}</p>
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
              fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
              minZoom={0.02}
              maxZoom={2}
              attributionPosition="bottom-left"
              style={{ background: "#FAFAFA" }}
              defaultEdgeOptions={{ type: "smoothstep" }}
            >
              <Background color="#E5E7EB" gap={24} size={1} />
              <Controls showInteractive={false} />
              <MiniMap
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
                maskColor="rgba(250,250,250,0.7)"
                nodeColor={() => "#6366F1"}
              />
            </ReactFlow>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-5 text-xs text-gray-400">
        <span className="flex items-center gap-2">
          <span className="w-5 h-0 border-t-[1.5px] border-gray-300" />
          {t("study.graph.legend.related")}
        </span>
      </div>
    </div>
  );
}
