"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n";

interface StudyNotesTabProps {
  studyStructure: {
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
  };
}

export default function StudyNotesTab({ studyStructure }: StudyNotesTabProps) {
  const { t } = useTranslation();
  const [openQuestions, setOpenQuestions] = useState<Set<number>>(new Set());

  return (
    <div>
      {/* 핵심 요약 */}
      <section id="study-summary" className="mb-10 scroll-mt-20">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
          <h2 className="font-bold text-gray-900">{t("study.result.executiveSummary")}</h2>
        </div>
        <p className="text-gray-600 leading-[2] whitespace-pre-line">{studyStructure.executive_summary}</p>
      </section>

      {/* 핵심 개념 */}
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

      {/* 상세 노트 */}
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
            {i < studyStructure.detailed_notes.length - 1 && (
              <div className="border-b border-gray-100 mt-6" />
            )}
          </div>
        ))}
      </section>

      {/* 연습 문제 */}
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
                <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${openQuestions.has(i) ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openQuestions.has(i) && (
                <div className="px-5 pb-4 pl-14">
                  <p className="text-sm text-gray-600 leading-relaxed">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 관련 주제 */}
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
