"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

type ReportTab = "detailed" | "core" | "easy" | "script";
type ContentTab = "recommend" | "summary" | "background" | "quote" | "infographic" | "full";

function ResultContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>("detailed");
  const [activeContentTab, setActiveContentTab] = useState<ContentTab>("full");
  const [isAdvancedModel, setIsAdvancedModel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // 샘플 결과 데이터
  const resultData = {
    platform: "Instagram",
    title: "오늘의 운동 루틴 공개!",
    toc: [
      { id: 1, title: "운동 루틴의 중요성", level: 1 },
      { id: 2, title: "효과적인 운동 시간", level: 2 },
      { id: 3, title: "운동 전 워밍업의 필요성", level: 2 },
      { id: 4, title: "본 운동 구성하기", level: 1 },
      { id: 5, title: "마무리 스트레칭", level: 2 },
    ],
    content: `이 콘텐츠는 '매일 운동하는 습관'이 건강에 미치는 긍정적 영향을 탐구합니다. 단순히 몸매 관리라는 외적 목표를 넘어, 운동이 가져오는 **삶의 실제적인 변화와 에너지**에 대해 성찰하게 합니다.

꾸준한 운동이 주는 멘탈 케어 효과, 일상의 활력 증진을 강조하며, 운동인의 **자기 성찰과 행동의 중요성**을 일깨워줍니다. 이 짧은 메시지를 통해 당신의 건강이 단순한 외모를 넘어선 **능동적인 삶의 원동력**이 될 수 있도록 돕는 깊은 통찰을 얻을 수 있습니다.`,
    sections: [
      {
        title: "1. 운동 루틴의 중요성",
        subsections: [
          {
            title: "1.1. 효과적인 운동 시간",
            content: `"아침 운동이 좋다"는 말은 오늘날에도 널리 받아들여지는 개념이다.`,
          },
          {
            title: "1.2. 운동 전 워밍업의 필요성",
            content: `워밍업은 부상 방지와 운동 효율을 높이는 핵심 단계입니다.`,
          },
        ],
      },
    ],
  };

  useEffect(() => {
    if (!url) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    const timer = setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsComplete(true);
      }, 300);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [url]);

  const handleGoBack = () => {
    window.location.href = "/";
  };

  const handleCopyContent = () => {
    const fullContent = `${resultData.title}\n\n${resultData.content}\n\n${resultData.sections.map(s => `${s.title}\n${s.subsections.map(sub => `${sub.title}\n${sub.content}`).join('\n\n')}`).join('\n\n')}`;
    navigator.clipboard.writeText(fullContent);
    alert("클립보드에 복사되었습니다!");
  };

  const reportTabs: { key: ReportTab; label: string; star?: boolean }[] = [
    { key: "detailed", label: "자세한 리포트", star: true },
    { key: "core", label: "핵심 리포트", star: true },
    { key: "easy", label: "쉬운 리포트", star: true },
    { key: "script", label: "스크립트", star: true },
  ];

  const contentTabs: { key: ContentTab; label: string }[] = [
    { key: "recommend", label: "추천" },
    { key: "summary", label: "요약" },
    { key: "background", label: "배경지식" },
    { key: "quote", label: "인용리포트" },
    { key: "infographic", label: "인포그래픽" },
    { key: "full", label: "몸 전체" },
  ];

  if (!url) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">변환할 URL이 없습니다.</p>
          <button
            onClick={handleGoBack}
            className="text-gray-900 font-medium hover:underline"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {!isComplete ? (
        /* Loading State */
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-sm">S2B</span>
          </div>
          <p className="text-gray-900 font-medium mb-8">블로그 글을 생성하고 있어요</p>
          <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-4">잠시만 기다려주세요...</p>
        </div>
      ) : (
        /* Result State */
        <div className="animate-fade-in">
          {/* Header with Platform */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGoBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 className="text-2xl font-bold text-gray-900">{resultData.platform}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">고급모델</span>
                  <button
                    onClick={() => setIsAdvancedModel(!isAdvancedModel)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isAdvancedModel ? "bg-violet-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isAdvancedModel ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Report Tabs */}
              <div className="flex items-center gap-2 mb-3">
                {reportTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveReportTab(tab.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                      activeReportTab === tab.key
                        ? "bg-violet-100 text-violet-700 border border-violet-200"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                    {tab.star && <span className="text-violet-400">☆</span>}
                  </button>
                ))}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Content Tabs */}
              <div className="flex items-center gap-1 border-b border-gray-100 -mx-6 px-6">
                {contentTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveContentTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium transition-all relative ${
                      activeContentTab === tab.key
                        ? "text-violet-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                    {activeContentTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="max-w-5xl mx-auto px-6 py-8 pb-32">
            {/* Editor Placeholder */}
            <div className="text-gray-400 text-sm mb-6">
              글을 작성하세요. 블록을 추가하려면 '/'를 입력하세요
            </div>

            {/* Table of Contents */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">목차</h3>
              <div className="space-y-1">
                {resultData.toc.map((item) => (
                  <div
                    key={item.id}
                    className={`text-sm text-violet-600 hover:text-violet-800 cursor-pointer ${
                      item.level === 2 ? "pl-6" : ""
                    }`}
                  >
                    {item.level === 1 ? `${item.id}. ` : `${Math.floor(item.id)}.${item.id % 1 || item.id - Math.floor(item.id / 2)}. `}
                    {item.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-8">
                {resultData.content}
              </p>

              {/* Sections */}
              {resultData.sections.map((section, idx) => (
                <div key={idx} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                    <button className="text-sm text-gray-400 hover:text-gray-600">
                      원문 보기
                    </button>
                  </div>
                  {section.subsections.map((sub, subIdx) => (
                    <div key={subIdx} className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{sub.title}</h3>
                        <span className="text-xs text-gray-400">[{subIdx + 1}]</span>
                        <button className="text-sm text-gray-400 hover:text-gray-600 ml-auto">
                          원문 보기
                        </button>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{sub.content}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Export Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-5xl mx-auto px-6 py-4">
              {showExportModal ? (
                <div className="bg-violet-50 rounded-xl p-4 mb-4 relative">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h4 className="font-semibold text-gray-900 mb-1">공유 & 내보내기 & 복사할 수 있어요!</h4>
                  <p className="text-sm text-gray-600">
                    마음에 드셨다면, 링크, PDF, Notion, DOCX, Markdown 등으로 가져갈 수 있어요.
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm text-gray-600">다시 생성</span>
                  </button>
                  <span className="text-sm text-gray-400">일반모델</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Notion */}
                  <button className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 2.022c-.42-.327-.98-.514-1.634-.42L3.12 2.808c-.466.093-.56.28-.466.514l1.805 1.352zm.793 2.895v13.728c0 .7.327 1.026 1.073.98l14.568-.793c.747-.047 .84-.513.84-1.073V6.056c0-.56-.187-.84-.7-.793l-15.168.793c-.56.047-.613.327-.613.747zm14.335.7c.093.42 0 .84-.42.887l-.7.14v10.204c-.607.326-1.167.513-1.634.513-.746 0-.933-.234-1.493-.933l-4.569-7.162v6.929l1.447.326s0 .84-1.167.84l-3.22.187c-.094-.187 0-.653.327-.747l.84-.22V9.252l-1.166-.093c-.094-.42.14-1.026.793-1.073l3.453-.234 4.756 7.282v-6.463l-1.213-.14c-.094-.513.233-.887.7-.933l3.266-.187zm-16.55-5.35l13.4-.98c1.634-.14 2.053-.047 3.08.746l4.248 2.988c.7.513.933.653.933 1.213v14.054c0 1.12-.42 1.773-1.867 1.867l-15.495.933c-1.073.047-1.587-.093-2.147-.793l-3.407-4.429c-.607-.793-.887-1.353-.887-2.006V4.392c0-.84.42-1.54 1.307-1.634l.835-.013z"/>
                    </svg>
                  </button>
                  {/* Share */}
                  <button
                    onClick={() => setShowExportModal(!showExportModal)}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                  {/* Download */}
                  <button className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  {/* Copy */}
                  <button
                    onClick={handleCopyContent}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full w-1/3 animate-pulse" />
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
