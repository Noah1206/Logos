"use client";

import { useCallback, useMemo } from "react";
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

interface ConceptHierarchy {
  root: string;
  children: Array<{
    name: string;
    children: Array<{ name: string; children: unknown[] }>;
  }>;
}

interface KeyConcept {
  name: string;
  importance: string;
  parent_concept?: string | null;
  related_concepts?: string[];
}

interface StudyMindMapProps {
  conceptHierarchy: ConceptHierarchy | null;
  keyConcepts: KeyConcept[];
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

function getImportanceColor(importance: string) {
  switch (importance) {
    case "high": return { bg: "#FEE2E2", border: "#F87171", text: "#991B1B" };
    case "medium": return { bg: "#FEF3C7", border: "#FBBF24", text: "#92400E" };
    default: return { bg: "#F3F4F6", border: "#D1D5DB", text: "#374151" };
  }
}

function buildFromHierarchy(hierarchy: ConceptHierarchy, conceptMap: Map<string, KeyConcept>) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Root node
  nodes.push({
    id: hierarchy.root,
    data: { label: hierarchy.root },
    position: { x: 0, y: 0 },
    style: {
      background: "#1F2937",
      color: "#fff",
      border: "2px solid #111827",
      borderRadius: "12px",
      padding: "10px 16px",
      fontSize: "14px",
      fontWeight: 700,
    },
  });

  function addChildren(parentId: string, children: Array<{ name: string; children: unknown[] }>, depth: number) {
    for (const child of children) {
      const concept = conceptMap.get(child.name);
      const colors = getImportanceColor(concept?.importance || "low");

      nodes.push({
        id: child.name,
        data: { label: child.name },
        position: { x: 0, y: 0 },
        style: {
          background: colors.bg,
          color: colors.text,
          border: `2px solid ${colors.border}`,
          borderRadius: "12px",
          padding: "8px 14px",
          fontSize: depth > 1 ? "12px" : "13px",
          fontWeight: depth > 1 ? 500 : 600,
        },
      });

      edges.push({
        id: `e-${parentId}-${child.name}`,
        source: parentId,
        target: child.name,
        style: { stroke: "#9CA3AF", strokeWidth: 1.5 },
        type: "smoothstep",
      });

      if (child.children && child.children.length > 0) {
        addChildren(child.name, child.children as Array<{ name: string; children: unknown[] }>, depth + 1);
      }
    }
  }

  addChildren(hierarchy.root, hierarchy.children, 1);
  return { nodes, edges };
}

function buildFromConcepts(concepts: KeyConcept[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedNodes = new Set<string>();

  for (const concept of concepts) {
    if (addedNodes.has(concept.name)) continue;
    addedNodes.add(concept.name);

    const colors = getImportanceColor(concept.importance);
    nodes.push({
      id: concept.name,
      data: { label: concept.name },
      position: { x: 0, y: 0 },
      style: {
        background: colors.bg,
        color: colors.text,
        border: `2px solid ${colors.border}`,
        borderRadius: "12px",
        padding: "8px 14px",
        fontSize: "13px",
        fontWeight: 600,
      },
    });

    if (concept.parent_concept && !addedNodes.has(concept.parent_concept)) {
      addedNodes.add(concept.parent_concept);
      nodes.push({
        id: concept.parent_concept,
        data: { label: concept.parent_concept },
        position: { x: 0, y: 0 },
        style: {
          background: "#1F2937",
          color: "#fff",
          border: "2px solid #111827",
          borderRadius: "12px",
          padding: "10px 16px",
          fontSize: "14px",
          fontWeight: 700,
        },
      });
    }

    if (concept.parent_concept) {
      edges.push({
        id: `e-${concept.parent_concept}-${concept.name}`,
        source: concept.parent_concept,
        target: concept.name,
        style: { stroke: "#9CA3AF", strokeWidth: 1.5 },
        type: "smoothstep",
      });
    }

    for (const related of concept.related_concepts || []) {
      if (addedNodes.has(related)) {
        const edgeId = `e-${concept.name}-${related}`;
        if (!edges.find((e) => e.id === edgeId || e.id === `e-${related}-${concept.name}`)) {
          edges.push({
            id: edgeId,
            source: concept.name,
            target: related,
            style: { stroke: "#60A5FA", strokeWidth: 1, strokeDasharray: "5 5" },
            type: "smoothstep",
          });
        }
      }
    }
  }

  return { nodes, edges };
}

function applyDagreLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
}

export default function StudyMindMap({ conceptHierarchy, keyConcepts }: StudyMindMapProps) {
  const { t } = useTranslation();

  const { initialNodes, initialEdges } = useMemo(() => {
    const conceptMap = new Map(keyConcepts.map((c) => [c.name, c]));

    let result;
    if (conceptHierarchy) {
      result = buildFromHierarchy(conceptHierarchy, conceptMap);
    } else {
      result = buildFromConcepts(keyConcepts);
    }

    const layoutNodes = applyDagreLayout(result.nodes, result.edges);
    return { initialNodes: layoutNodes, initialEdges: result.edges };
  }, [conceptHierarchy, keyConcepts]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 100);
  }, []);

  if (initialNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-2xl border border-gray-200">
        <p className="text-gray-400 text-sm">{t("study.mindMap.empty")}</p>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
        <h2 className="font-bold text-gray-900">{t("study.tabs.mindmap")}</h2>
      </div>
      <div className="h-[500px] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit as any}
          fitView
          minZoom={0.3}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Background color="#E5E7EB" gap={20} />
          <Controls showInteractive={false} />
          <MiniMap
            style={{ background: "#F9FAFB" }}
            nodeColor={(node) => (node.style?.background as string) || "#D1D5DB"}
          />
        </ReactFlow>
      </div>
      {/* 범례 */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> {t("study.result.importance.high")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> {t("study.result.importance.medium")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> {t("study.result.importance.low")}
        </span>
      </div>
    </div>
  );
}
