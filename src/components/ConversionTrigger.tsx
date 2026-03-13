"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrial } from "@/hooks/useTrial";

export default function ConversionTrigger() {
  const trial = useTrial();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (!trial || !trial.started || dismissed) return null;

  const { days, conversionCount, active } = trial;

  let emoji: string;
  let title: string;
  let desc: string;
  let accent = "border-gray-200 bg-white";
  let titleColor = "text-gray-900";
  let descColor = "text-gray-500";
  let showPricing = false;

  if (!active) {
    emoji = "📦";
    title = "7일 무료체험이 끝났어요";
    desc = "990원으로 계속하기";
    accent = "border-red-200 bg-red-50";
    titleColor = "text-red-800";
    descColor = "text-red-600";
    showPricing = true;
  } else if (days <= 1) {
    emoji = "⏰";
    title = "오늘 자정에 체험이 끝나요";
    desc = `지금까지 ${conversionCount}개 변환했어요`;
    accent = "border-amber-300 bg-amber-50";
    titleColor = "text-amber-900";
    descColor = "text-amber-700";
    showPricing = true;
  } else if (days <= 2) {
    emoji = "👍";
    title = `체험이 ${days}일 뒤 끝나요`;
    desc = `지금까지 ${conversionCount}개 변환했어요`;
    accent = "border-amber-200 bg-amber-50/50";
    titleColor = "text-amber-800";
    descColor = "text-amber-600";
  } else {
    emoji = "✨";
    title = `무료체험 중 · D-${days}`;
    desc = "오늘도 무제한 사용 가능해요";
  }

  return (
    <div className="fixed right-5 top-5 z-40 animate-[slideIn_0.4s_ease-out]">
      <div
        className={`relative rounded-2xl border ${accent} shadow-lg px-5 py-5 flex flex-col items-center gap-3 min-w-[180px] max-w-[200px]`}
      >
        {/* 닫기 */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이모지 */}
        <span className="text-2xl mt-1">{emoji}</span>

        {/* 텍스트 */}
        <div className="text-center">
          <p className={`text-[13px] font-semibold leading-snug ${titleColor}`}>
            {title}
          </p>
          <p className={`text-[11px] leading-snug mt-1.5 ${descColor}`}>
            {desc}
          </p>
        </div>

        {/* 요금제 버튼 */}
        {showPricing && (
          <button
            onClick={() => router.push("/pricing")}
            className="w-full mt-1 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors"
          >
            요금제 보기 →
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
