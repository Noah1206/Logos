"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import StudyTabBar from "./StudyTabBar";
import StudyNotesTab from "./StudyNotesTab";
import StudyTimeline from "./StudyTimeline";
import StudyExportPanel from "./StudyExportPanel";

const StudyMindMap = dynamic(() => import("./StudyMindMap"), { ssr: false });

interface StudyResultViewProps {
  studyResult: {
    study_structure: {
      title: string;
      executive_summary: string;
      key_concepts: Array<{
        name: string;
        definition: string;
        importance: string;
        parent_concept?: string | null;
        related_concepts?: string[];
      }>;
      detailed_notes: Array<{
        topic: string;
        content: string;
        key_takeaways?: string[];
      }>;
      study_questions: Array<{ question: string; answer: string }>;
      related_topics: string[];
      concept_hierarchy?: Record<string, unknown> | null;
    };
    study_content: string;
    timestamp_segments?: Array<{ start: number; end: number; text: string }> | null;
  };
  sourceUrl?: string;
}

export default function StudyResultView({ studyResult, sourceUrl }: StudyResultViewProps) {
  const [activeTab, setActiveTab] = useState("notes");

  const { study_structure: ss } = studyResult;

  // 마인드맵 표시 가능 여부: concept_hierarchy 또는 parent_concept/related_concepts 있으면
  const hasMindMap = !!(
    ss.concept_hierarchy ||
    ss.key_concepts.some((c) => c.parent_concept || (c.related_concepts && c.related_concepts.length > 0))
  );

  // 타임라인 표시 가능 여부
  const hasTimeline = !!(studyResult.timestamp_segments && studyResult.timestamp_segments.length > 0);

  return (
    <div>
      <StudyTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasTimeline={hasTimeline}
        hasMindMap={hasMindMap}
      />

      {activeTab === "notes" && (
        <StudyNotesTab studyStructure={ss} />
      )}

      {activeTab === "mindmap" && hasMindMap && (
        <StudyMindMap
          conceptHierarchy={ss.concept_hierarchy as any || null}
          keyConcepts={ss.key_concepts}
        />
      )}

      {activeTab === "timeline" && hasTimeline && (
        <StudyTimeline
          segments={studyResult.timestamp_segments!}
          sourceUrl={sourceUrl}
        />
      )}

      {activeTab === "export" && (
        <StudyExportPanel
          studyContent={studyResult.study_content}
          title={ss.title}
        />
      )}
    </div>
  );
}
