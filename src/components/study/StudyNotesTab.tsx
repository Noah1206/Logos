"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n";
import type { StudyStructure } from "@/types/study";

interface StudyNotesTabProps {
  studyStructure: StudyStructure;
}

export default function StudyNotesTab({ studyStructure }: StudyNotesTabProps) {
  const { t } = useTranslation();
  const [openQuestions, setOpenQuestions] = useState<Set<number>>(new Set());
  const [openHints, setOpenHints] = useState<Set<number>>(new Set());
  const [openDeeperAnalysis, setOpenDeeperAnalysis] = useState<Set<number>>(new Set());
  const [visualImages, setVisualImages] = useState<Record<number, string>>({});
  const [visualLoading, setVisualLoading] = useState<Set<number>>(new Set());
  const [visualErrors, setVisualErrors] = useState<Set<number>>(new Set());

  const handleGenerateVisual = async (noteIndex: number, topic: string, content: string, visualType: string) => {
    setVisualLoading((prev) => new Set(prev).add(noteIndex));
    setVisualErrors((prev) => { const next = new Set(prev); next.delete(noteIndex); return next; });

    try {
      const res = await fetch("/api/study/generate-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, content, visual_type: visualType }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      if (data.image_url) {
        setVisualImages((prev) => ({ ...prev, [noteIndex]: data.image_url }));
      } else {
        throw new Error("No image");
      }
    } catch {
      setVisualErrors((prev) => new Set(prev).add(noteIndex));
    } finally {
      setVisualLoading((prev) => { const next = new Set(prev); next.delete(noteIndex); return next; });
    }
  };

  const difficultyColor = (d?: string) => {
    switch (d) {
      case "basic": return "bg-green-50 text-green-600";
      case "intermediate": return "bg-amber-50 text-amber-600";
      case "advanced": return "bg-red-50 text-red-500";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div>
      {/* 1. 핵심 요약 */}
      <section id="study-summary" className="mb-10 scroll-mt-20">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
          <h2 className="font-bold text-gray-900">{t("study.result.executiveSummary")}</h2>
        </div>
        <p className="text-gray-600 leading-[2] whitespace-pre-line">{studyStructure.executive_summary}</p>
      </section>

      {/* 2. 배경 지식 (신규) */}
      {studyStructure.background_knowledge && (
        <section id="study-background" className="mb-10 scroll-mt-20">
          <div className="flex items-center gap-2 mt-10 mb-4">
            <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
            <h2 className="font-bold text-gray-900">{t("study.result.backgroundKnowledge")}</h2>
          </div>
          <p className="text-gray-600 leading-[2] whitespace-pre-line mb-4">
            {studyStructure.background_knowledge.overview}
          </p>

          {studyStructure.background_knowledge.prerequisites?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {t("study.result.prerequisites")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {studyStructure.background_knowledge.prerequisites.map((prereq, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{prereq.topic}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${difficultyColor(prereq.difficulty)}`}>
                          {t(`study.result.difficulty.${prereq.difficulty}`)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{prereq.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studyStructure.background_knowledge.context && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-1">{t("study.result.context")}</p>
              <p className="text-sm text-amber-600 leading-relaxed">{studyStructure.background_knowledge.context}</p>
            </div>
          )}
        </section>
      )}

      {/* 3. 핵심 개념 (강화 - example 추가) */}
      <section id="study-concepts" className="mb-10 scroll-mt-20">
        <div className="flex items-center gap-2 mt-10 mb-4">
          <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
          <h2 className="font-bold text-gray-900">{t("study.result.keyConcepts")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {studyStructure.key_concepts.map((concept, i) => (
            <div key={i} className="rounded-2xl bg-gray-50 border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  concept.importance === "high" ? "bg-red-400" :
                  concept.importance === "medium" ? "bg-amber-400" :
                  "bg-gray-300"
                }`} />
                <h3 className="text-sm font-bold text-gray-900">{concept.name}</h3>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  concept.importance === "high" ? "bg-red-50 text-red-500" :
                  concept.importance === "medium" ? "bg-amber-50 text-amber-600" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {t(`study.result.importance.${concept.importance}`)}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{concept.definition}</p>

              {concept.example && (
                <div className="mt-3 border-l-2 border-gray-300 pl-3">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{t("study.result.example")}</p>
                  <p className="text-sm text-gray-500 italic leading-relaxed">{concept.example}</p>
                </div>
              )}

              {concept.related_concepts && concept.related_concepts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {concept.related_concepts.map((rc, j) => (
                    <span key={j} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                      {rc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. 상세 노트 (대폭 강화) */}
      <section id="study-notes" className="mb-10 scroll-mt-20">
        <div className="flex items-center gap-2 mt-10 mb-4">
          <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
          <h2 className="font-bold text-gray-900">{t("study.result.detailedNotes")}</h2>
        </div>
        {studyStructure.detailed_notes.map((note, i) => (
          <div key={i} id={`study-note-${i}`} className="mb-6 scroll-mt-20">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-gray-300 text-xs font-mono">{String(i + 1).padStart(2, "0")}</span>
              {note.topic}
            </h3>
            <p className="text-gray-600 leading-[2] whitespace-pre-line">{note.content}</p>

            {note.key_takeaways && note.key_takeaways.length > 0 && (
              <div className="mt-3 bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2">{t("study.tabs.keyTakeaways")}</p>
                <ul className="space-y-1">
                  {note.key_takeaways.map((takeaway, j) => (
                    <li key={j} className="text-sm text-blue-600 flex items-start gap-2">
                      <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                      {takeaway}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 심층 분석 (접이식) */}
            {note.deeper_analysis && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    const next = new Set(openDeeperAnalysis);
                    next.has(i) ? next.delete(i) : next.add(i);
                    setOpenDeeperAnalysis(next);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${openDeeperAnalysis.has(i) ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {t("study.result.deeperAnalysis")}
                </button>
                {openDeeperAnalysis.has(i) && (
                  <div className="mt-2 bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-700 leading-relaxed whitespace-pre-line">{note.deeper_analysis}</p>
                  </div>
                )}
              </div>
            )}

            {/* 시각 자료 생성 버튼 */}
            {note.visual_suggestion && note.visual_suggestion !== "none" && (
              <div className="mt-3">
                {visualImages[i] ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img src={visualImages[i]} alt={`${note.topic} visual`} className="w-full" />
                  </div>
                ) : visualLoading.has(i) ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("study.result.generatingVisual")}
                  </div>
                ) : visualErrors.has(i) ? (
                  <p className="text-xs text-red-400 mt-1">{t("study.result.visualError")}</p>
                ) : (
                  <button
                    onClick={() => handleGenerateVisual(i, note.topic, note.content, note.visual_suggestion!)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:text-blue-500 transition-colors"
                  >
                    <span>✨</span>
                    {t("study.result.generateVisual")}
                  </button>
                )}
              </div>
            )}

            {i < studyStructure.detailed_notes.length - 1 && (
              <div className="border-b border-gray-100 mt-6" />
            )}
          </div>
        ))}
      </section>

      {/* 5. 연습 문제 (강화 - difficulty, hint) */}
      <section id="study-questions" className="mb-10 scroll-mt-20">
        <div className="flex items-center gap-2 mt-10 mb-4">
          <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
          <h2 className="font-bold text-gray-900">{t("study.result.studyQuestions")}</h2>
        </div>
        <div className="space-y-3">
          {studyStructure.study_questions.map((q, i) => (
            <div key={i} className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
              <button
                onClick={() => {
                  const next = new Set(openQuestions);
                  next.has(i) ? next.delete(i) : next.add(i);
                  setOpenQuestions(next);
                }}
                className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-100 transition-colors"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-gray-900 flex-1">{q.question}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {q.difficulty && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${difficultyColor(q.difficulty)}`}>
                      {t(`study.result.difficulty.${q.difficulty}`)}
                    </span>
                  )}
                  <svg className={`w-4 h-4 text-gray-400 mt-1 transition-transform ${openQuestions.has(i) ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {openQuestions.has(i) && (
                <div className="px-5 pb-4 pl-14">
                  {q.hint && (
                    <div className="mb-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = new Set(openHints);
                          next.has(i) ? next.delete(i) : next.add(i);
                          setOpenHints(next);
                        }}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                      >
                        {openHints.has(i) ? t("study.result.hideHint") : t("study.result.showHint")}
                      </button>
                      {openHints.has(i) && (
                        <p className="mt-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{q.hint}</p>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. 추가 학습 자료 (신규) */}
      {studyStructure.recommended_resources && studyStructure.recommended_resources.length > 0 && (
        <section id="study-resources" className="mb-10 scroll-mt-20">
          <div className="flex items-center gap-2 mt-10 mb-4">
            <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
            <h2 className="font-bold text-gray-900">{t("study.result.recommendedResources")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {studyStructure.recommended_resources.map((resource, i) => {
              const isYoutube = resource.type === "youtube_search";
              const searchUrl = isYoutube
                ? `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.search_query || resource.topic || "")}`
                : `https://www.google.com/search?q=${encodeURIComponent(resource.search_query || resource.topic || "")}`;

              return (
                <a
                  key={i}
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-xl border p-4 hover:shadow-sm transition-shadow block ${
                    isYoutube
                      ? "bg-red-50 border-red-100 hover:border-red-200"
                      : "bg-blue-50 border-blue-100 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isYoutube ? (
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.7 31.7 0 000 12a31.7 31.7 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.7 31.7 0 0024 12a31.7 31.7 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    <span className={`text-xs font-semibold ${isYoutube ? "text-red-600" : "text-blue-600"}`}>
                      {isYoutube ? t("study.result.youtubeSearch") : t("study.result.furtherReading")}
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${isYoutube ? "text-red-800" : "text-blue-800"}`}>
                    {resource.topic}
                  </p>
                  {resource.description && (
                    <p className={`text-xs mt-1 ${isYoutube ? "text-red-500" : "text-blue-500"}`}>
                      {resource.description}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. 관련 주제 (기존) */}
      {studyStructure.related_topics?.length > 0 && (
        <section id="study-related" className="mb-10 scroll-mt-20">
          <div className="flex items-center gap-2 mt-10 mb-4">
            <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
            <h2 className="font-bold text-gray-900">{t("study.result.relatedTopics")}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {studyStructure.related_topics.map((topic, i) => (
              <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                {topic}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
