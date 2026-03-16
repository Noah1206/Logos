export interface StudyPrerequisite {
  topic: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface BackgroundKnowledge {
  overview: string;
  prerequisites: StudyPrerequisite[];
  context: string;
}

export interface StudyConcept {
  name: string;
  definition: string;
  importance: "high" | "medium" | "low";
  parent_concept?: string | null;
  related_concepts?: string[];
  example?: string;
}

export interface DetailedNote {
  topic: string;
  content: string;
  key_takeaways?: string[];
  deeper_analysis?: string;
  visual_suggestion?: "concept_diagram" | "comparison_chart" | "process_flow" | "timeline" | "hierarchy" | "none";
}

export interface StudyQuestion {
  question: string;
  answer: string;
  difficulty?: "basic" | "intermediate" | "advanced";
  hint?: string;
}

export interface RecommendedResource {
  type: "youtube_search" | "further_reading";
  topic?: string;
  search_query?: string;
  description?: string;
}

export interface StudyStructure {
  executive_summary: string;
  key_concepts: StudyConcept[];
  detailed_notes: DetailedNote[];
  study_questions: StudyQuestion[];
  related_topics: string[];
  background_knowledge?: BackgroundKnowledge;
  recommended_resources?: RecommendedResource[];
  concept_hierarchy?: {
    root: string;
    children: Array<{ name: string; children: Array<{ name: string; children: unknown[] }> }>;
  };
}
