"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { useTranslation } from "@/i18n";

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

interface KnowledgeGraphViewProps {
  onClose: () => void;
}

const TOPIC_COLORS: Record<string, string> = {
  food: "#F87171",
  fitness: "#34D399",
  beauty: "#F472B6",
  education: "#60A5FA",
  tech: "#A78BFA",
  business: "#FBBF24",
  lifestyle: "#FB923C",
  other: "#9CA3AF",
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
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/knowledge/graph")
      .then((r) => r.json())
      .then((data) => {
        setGraphData(data.data);
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
      const size = Math.max(10, Math.min(18, 10 + n.data.count * 2));

      return {
        id: n.id,
        data: { label: n.data.label },
        position: n.position,
        style: {
          background: "#1A1A2E",
          color: "#fff",
          border: `2px solid ${color}`,
          borderRadius: "12px",
          padding: "6px 12px",
          fontSize: `${size}px`,
          fontWeight: n.data.count > 1 ? 700 : 500,
          boxShadow: `0 0 ${n.data.count * 4}px ${color}40`,
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
          stroke: e.data?.type === "prerequisite" ? "#F87171" :
                  e.data?.type === "extends" ? "#60A5FA" : "#4B5563",
          strokeWidth: 1.5,
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

  // Sync when flowNodes/flowEdges change
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 100);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0D0D1A] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h2 className="text-lg font-bold text-white">{t("study.graph.title")}</h2>
          {graphData && (
            <span className="text-sm text-gray-500 ml-2">
              {flowNodes.length} {t("study.stats.concepts")} · {flowEdges.length} {t("study.stats.connections")}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 토픽 필터 */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-800 overflow-x-auto">
          <button
            onClick={() => setTopicFilter(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-shrink-0 ${
              !topicFilter ? "bg-white text-gray-900" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {t("study.graph.all")}
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setTopicFilter(topic === topicFilter ? null : topic)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex-shrink-0 ${
                topicFilter === topic
                  ? "text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
              style={topicFilter === topic ? { background: TOPIC_COLORS[topic] || TOPIC_COLORS.other } : {}}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* 그래프 */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full" />
          </div>
        ) : flowNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-gray-500 text-lg">{t("study.graph.empty")}</p>
              <p className="text-gray-600 text-sm mt-2">{t("study.graph.emptyDesc")}</p>
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
            <Background color="#1F2937" gap={30} />
            <Controls
              showInteractive={false}
              style={{ background: "#1A1A2E", border: "1px solid #374151", borderRadius: "8px" }}
            />
          </ReactFlow>
        )}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-800 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-gray-500 rounded" style={{ borderTop: "2px dashed #4B5563" }} /> related
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-red-400 rounded" /> prerequisite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-400 rounded" /> extends
        </span>
      </div>
    </div>
  );
}
