"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

const tones = [
  {
    key: "일상" as const,
    label: "일상 블로그",
    emoji: "✨",
    desc: "감성 브이로그 스타일",
    features: [
      "자연스러운 구어체",
      "감성적인 이모지 활용",
      "일상 공유 톤앤매너",
      "친근한 말투",
    ],
  },
  {
    key: "자영업자" as const,
    label: "자영업자 블로그",
    emoji: "🏪",
    desc: "매장 홍보 스타일",
    features: [
      "매장/서비스 어필 중심",
      "위치·가격 정보 강조",
      "방문 유도 CTA 포함",
      "신뢰감 있는 톤",
    ],
  },
];

function ToneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url") || "";
  const [selected, setSelected] = useState<"일상" | "자영업자" | null>(null);

  const handleStart = () => {
    if (!selected || !url) return;
    router.push(`/result?url=${encodeURIComponent(url)}&tone=${encodeURIComponent(selected)}`);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-7 w-7 translate-y-[3px]" />
              <span className="text-[22px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="pt-16 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            블로그 톤 선택
          </h1>
          <p className="text-gray-500 text-sm md:text-base mb-12">
            어떤 스타일의 블로그 글을 원하시나요?
          </p>

          {/* Tone Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {tones.map((tone) => (
              <button
                key={tone.key}
                onClick={() => setSelected(tone.key)}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                  selected === tone.key
                    ? "border-[#4F46E5] bg-[#EEF2FF] shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                {/* Selected indicator */}
                {selected === tone.key && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-[#4F46E5] rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className="text-3xl mb-3">{tone.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{tone.label}</h3>
                <p className={`text-sm mb-4 ${selected === tone.key ? "text-[#4F46E5]" : "text-gray-500"}`}>
                  {tone.desc}
                </p>
                <ul className="space-y-1.5">
                  {tone.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`w-1 h-1 rounded-full ${selected === tone.key ? "bg-[#4F46E5]" : "bg-gray-300"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStart}
            disabled={!selected}
            className={`px-10 py-4 text-base font-medium rounded-full transition-all duration-200 ${
              selected
                ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] hover:scale-[0.98] active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            변환 시작
          </button>
        </div>
      </section>
    </main>
  );
}

export default function TonePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <ToneContent />
    </Suspense>
  );
}
