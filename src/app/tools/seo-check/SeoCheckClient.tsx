"use client";

import { useState, useMemo } from "react";
import LanguageToggle from "@/components/LanguageToggle";

interface CheckItem {
  label: string;
  score: number;
  maxScore: number;
  feedback: string;
  status: "good" | "warning" | "bad";
}

function analyzeSeo(text: string): CheckItem[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const totalChars = text.length;
  const totalWords = text.replace(/\s+/g, " ").trim().split(" ").length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const emojis = text.match(emojiRegex) || [];
  const hashtagRegex = /#[\w가-힣]+/g;
  const hashtags = text.match(hashtagRegex) || [];
  const headingRegex = /^(#{1,3}\s|[A-Z가-힣].{0,50}$)/gm;
  const headings = text.match(headingRegex)?.filter((h) => h.startsWith("#") || (h.length < 50 && h.length > 2)) || [];
  // 소제목: ## 또는 짧은 독립 행 (볼드 마커 ** 포함)
  const subheadingRegex = /^(##\s.+|\*\*.+\*\*)$/gm;
  const subheadings = text.match(subheadingRegex) || [];
  const sentences = text.split(/[.!?。]+/).filter((s) => s.trim().length > 3);
  const avgSentenceLen = sentences.length > 0 ? sentences.reduce((a, s) => a + s.trim().length, 0) / sentences.length : 0;
  const ctaKeywords = ["문의", "연락", "방문", "클릭", "확인", "신청", "예약", "구매", "가입", "댓글", "공유", "좋아요", "저장", "구독", "팔로우", "DM", "카톡", "전화"];
  const hasCta = ctaKeywords.some((kw) => text.includes(kw));

  const results: CheckItem[] = [];

  // 1. 글 길이 (200-2000자 최적)
  {
    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    if (totalChars >= 800) {
      score = 15;
      status = "good";
      feedback = `${totalChars.toLocaleString()}자로 충분한 길이입니다. 네이버 상위 노출에 유리해요.`;
    } else if (totalChars >= 400) {
      score = 10;
      status = "warning";
      feedback = `${totalChars.toLocaleString()}자입니다. 800자 이상이면 SEO에 더 유리해요.`;
    } else if (totalChars >= 100) {
      score = 5;
      status = "warning";
      feedback = `${totalChars.toLocaleString()}자로 짧습니다. 400자 이상 작성을 권장합니다.`;
    } else {
      score = 0;
      status = "bad";
      feedback = "글이 너무 짧습니다. 최소 400자 이상 작성해주세요.";
    }
    results.push({ label: "글 길이", score, maxScore: 15, feedback, status });
  }

  // 2. 소제목 구조
  {
    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    const subCount = subheadings.length + headings.filter((h) => h.startsWith("#")).length;
    if (subCount >= 3) {
      score = 15;
      status = "good";
      feedback = `소제목 ${subCount}개로 잘 구분되어 있습니다. 가독성이 좋아요.`;
    } else if (subCount >= 1) {
      score = 8;
      status = "warning";
      feedback = `소제목이 ${subCount}개입니다. 3개 이상이면 체류시간이 늘어나요.`;
    } else {
      score = 0;
      status = "bad";
      feedback = "소제목이 없습니다. ##이나 **볼드**로 섹션을 나눠보세요.";
    }
    results.push({ label: "소제목 구조", score, maxScore: 15, feedback, status });
  }

  // 3. 단락 구성
  {
    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    if (paragraphs.length >= 4) {
      score = 10;
      status = "good";
      feedback = `${paragraphs.length}개 단락으로 잘 구성되어 있습니다.`;
    } else if (paragraphs.length >= 2) {
      score = 6;
      status = "warning";
      feedback = `${paragraphs.length}개 단락입니다. 4개 이상으로 나누면 읽기 편해요.`;
    } else {
      score = 2;
      status = "bad";
      feedback = "단락 구분이 부족합니다. 빈 줄로 문단을 나눠보세요.";
    }
    results.push({ label: "단락 구성", score, maxScore: 10, feedback, status });
  }

  // 4. 키워드 밀도 (반복 단어 분석)
  {
    const words = text.replace(/[^\w가-힣\s]/g, "").split(/\s+/).filter((w) => w.length >= 2);
    const freq: Record<string, number> = {};
    words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxFreq = topWords[0]?.[1] || 0;
    const density = words.length > 0 ? (maxFreq / words.length) * 100 : 0;

    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    if (density >= 1 && density <= 5) {
      score = 10;
      status = "good";
      feedback = `핵심 키워드 "${topWords[0]?.[0]}"이(가) ${maxFreq}회 반복되어 적절합니다.`;
    } else if (density > 5) {
      score = 5;
      status = "warning";
      feedback = `"${topWords[0]?.[0]}"이(가) 과도하게 반복됩니다 (${maxFreq}회). 자연스럽게 줄여보세요.`;
    } else if (words.length < 10) {
      score = 2;
      status = "bad";
      feedback = "글이 너무 짧아 키워드 분석이 어렵습니다.";
    } else {
      score = 5;
      status = "warning";
      feedback = "주요 키워드가 뚜렷하지 않습니다. 핵심 키워드를 2-5회 반복해보세요.";
    }
    results.push({ label: "키워드 밀도", score, maxScore: 10, feedback, status });
  }

  // 5. 이모지 활용
  {
    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    if (emojis.length >= 3 && emojis.length <= 15) {
      score = 10;
      status = "good";
      feedback = `이모지 ${emojis.length}개 사용으로 적절합니다. 시선을 끌어요.`;
    } else if (emojis.length >= 1) {
      score = 6;
      status = "warning";
      feedback = `이모지 ${emojis.length}개입니다. 3-15개 사이가 네이버에서 효과적이에요.`;
    } else {
      score = 0;
      status = "bad";
      feedback = "이모지가 없습니다. 포인트마다 이모지를 추가하면 체류시간이 늘어요.";
    }
    results.push({ label: "이모지 활용", score, maxScore: 10, feedback, status });
  }

  // 6. 해시태그
  {
    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    if (hashtags.length >= 5 && hashtags.length <= 10) {
      score = 10;
      status = "good";
      feedback = `해시태그 ${hashtags.length}개로 검색 노출에 유리합니다.`;
    } else if (hashtags.length >= 1) {
      score = 5;
      status = "warning";
      feedback = `해시태그 ${hashtags.length}개입니다. 5-7개가 최적이에요.`;
    } else {
      score = 0;
      status = "bad";
      feedback = "해시태그가 없습니다. #키워드 형태로 5-7개 추가하세요.";
    }
    results.push({ label: "해시태그", score, maxScore: 10, feedback, status });
  }

  // 7. CTA (행동 유도)
  {
    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    if (hasCta) {
      score = 10;
      status = "good";
      feedback = "행동 유도 문구가 포함되어 있습니다. 전환율에 도움이 돼요.";
    } else {
      score = 0;
      status = "bad";
      feedback = "CTA가 없습니다. '문의', '예약', '방문' 등 행동 유도 문구를 추가하세요.";
    }
    results.push({ label: "CTA (행동 유도)", score, maxScore: 10, feedback, status });
  }

  // 8. 문장 길이
  {
    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    if (sentences.length === 0) {
      score = 0;
      status = "bad";
      feedback = "문장을 분석할 수 없습니다.";
    } else if (avgSentenceLen <= 60) {
      score = 10;
      status = "good";
      feedback = `평균 문장 길이 ${Math.round(avgSentenceLen)}자로 읽기 편합니다.`;
    } else if (avgSentenceLen <= 80) {
      score = 6;
      status = "warning";
      feedback = `평균 문장 길이 ${Math.round(avgSentenceLen)}자입니다. 60자 이하로 줄이면 가독성이 좋아져요.`;
    } else {
      score = 3;
      status = "bad";
      feedback = `평균 문장 길이 ${Math.round(avgSentenceLen)}자로 길어요. 문장을 나눠보세요.`;
    }
    results.push({ label: "문장 길이", score, maxScore: 10, feedback, status });
  }

  // 9. 가독성 (줄바꿈 비율)
  {
    let score = 0;
    let feedback = "";
    let status: "good" | "warning" | "bad" = "bad";
    const lineBreakRatio = lines.length > 0 ? text.split("\n").length / lines.length : 0;
    if (lineBreakRatio >= 1.3) {
      score = 10;
      status = "good";
      feedback = "적절한 줄바꿈으로 가독성이 좋습니다.";
    } else if (lineBreakRatio >= 1.1) {
      score = 5;
      status = "warning";
      feedback = "줄바꿈을 더 넣으면 모바일에서 읽기 편해져요.";
    } else {
      score = 2;
      status = "bad";
      feedback = "줄바꿈이 부족합니다. 2-3문장마다 빈 줄을 넣어보세요.";
    }
    results.push({ label: "가독성", score, maxScore: 10, feedback, status });
  }

  return results;
}

export default function SeoCheckClient() {
  const [text, setText] = useState("");

  const results = useMemo(() => {
    if (text.trim().length < 10) return null;
    return analyzeSeo(text);
  }, [text]);

  const totalScore = results ? results.reduce((a, r) => a + r.score, 0) : 0;
  const maxTotal = 100;

  const scoreColor =
    totalScore >= 80 ? "text-green-600" :
    totalScore >= 50 ? "text-amber-500" :
    "text-red-500";

  const scoreLabel =
    totalScore >= 80 ? "우수" :
    totalScore >= 50 ? "보통" :
    "개선 필요";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-7 w-7 translate-y-[3px]" />
              <span className="text-[22px] font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>LOGOS.ai</span>
            </a>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* 타이틀 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            블로그 SEO 점수 체크기
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            블로그 글을 붙여넣으면 네이버 SEO 최적화 점수를 무료로 분석해드려요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 입력 영역 */}
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="블로그 글 내용을 붙여넣으세요..."
              className="w-full h-[500px] p-5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-gray-400">{text.length.toLocaleString()}자</span>
              {text.length > 0 && (
                <button onClick={() => setText("")} className="text-xs text-gray-400 hover:text-gray-600">
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 결과 영역 */}
          <div>
            {!results ? (
              <div className="h-[500px] bg-white border border-gray-200 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-3">
                    <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>
                  <p className="text-sm text-gray-400">왼쪽에 블로그 글을 입력하면<br />SEO 점수가 표시됩니다</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                {/* 총점 */}
                <div className="text-center pb-5 border-b border-gray-100">
                  <div className={`text-5xl font-bold ${scoreColor}`}>
                    {totalScore}
                    <span className="text-lg text-gray-400 font-normal">/{maxTotal}</span>
                  </div>
                  <div className={`text-sm font-medium mt-1 ${scoreColor}`}>
                    {scoreLabel}
                  </div>
                  {/* 프로그레스 바 */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        totalScore >= 80 ? "bg-green-500" :
                        totalScore >= 50 ? "bg-amber-400" :
                        "bg-red-400"
                      }`}
                      style={{ width: `${totalScore}%` }}
                    />
                  </div>
                </div>

                {/* 항목별 결과 */}
                <div className="space-y-3">
                  {results.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.status === "good" ? "bg-green-100" :
                        item.status === "warning" ? "bg-amber-100" :
                        "bg-red-100"
                      }`}>
                        {item.status === "good" ? (
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        ) : item.status === "warning" ? (
                          <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-gray-900">{item.label}</span>
                          <span className={`text-xs font-medium ${
                            item.status === "good" ? "text-green-600" :
                            item.status === "warning" ? "text-amber-600" :
                            "text-red-500"
                          }`}>
                            {item.score}/{item.maxScore}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-3 bg-white border border-gray-200 rounded-2xl px-8 py-6">
            <p className="text-sm text-gray-600 font-medium">
              SEO 점수가 낮다면? AI가 자동으로 최적화해드려요
            </p>
            <a
              href="/"
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              LOGOS.ai로 자동 SEO 최적화 글 만들기 →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
