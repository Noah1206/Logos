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
    // ended
    emoji = "📦";
    title = "7일 무료체험이 끝났어요";
    desc = "990원으로 계속하기";
    accent = "border-red-200 bg-red-50";
    titleColor = "text-red-800";
    descColor = "text-red-600";
    showPricing = true;
  } else if (days <= 1) {
    // lastDay
    emoji = "⏰";
    title = "오늘 자정에 체험이 끝나요";
    desc = `지금까지 ${conversionCount}개 변환했어요`;
    accent = "border-amber-300 bg-amber-50";
    titleColor = "text-amber-900";
    descColor = "text-amber-700";
    showPricing = true;
  } else if (days <= 2) {
    // warning
    emoji = "👍";
    title = `체험이 ${days}일 뒤 끝나요`;
    desc = `지금까지 ${conversionCount}개 변환했어요`;
    accent = "border-amber-200 bg-amber-50/50";
    titleColor = "text-amber-800";
    descColor = "text-amber-600";
  } else {
    // normal
    emoji = "✨";
    title = `무료체험 중 · D-${days}`;
    desc = "오늘도 무제한 사용 가능해요";
  }

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 animate-[slideIn_0.4s_ease-out]">
      <div
        className={`relative w-[52px] rounded-2xl border ${accent} shadow-sm px-2 py-4 flex flex-col items-center gap-3 cursor-default`}
      >
        {/* 닫기 */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shadow-sm"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이모지 */}
        <span className="text-lg">{emoji}</span>

        {/* 세로 텍스트 */}
        <div
          className="flex flex-col items-center gap-[2px]"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          <span className={`text-[11px] font-semibold leading-tight ${titleColor}`}>
            {title}
          </span>
          <span className={`text-[10px] leading-tight mt-1 ${descColor}`}>
            {desc}
          </span>
        </div>

        {/* 요금제 버튼 */}
        {showPricing && (
          <button
            onClick={() => router.push("/pricing")}
            className="w-9 h-9 rounded-xl bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(20px, -50%);
          }
          to {
            opacity: 1;
            transform: translate(0, -50%);
          }
        }
      `}</style>
    </div>
  );
}
