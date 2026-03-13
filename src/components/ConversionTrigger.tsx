"use client";

import { useEffect, useState } from "react";
import { useTrial } from "@/hooks/useTrial";

const VISIBLE_DURATION = 4000; // 4초 동안 보여줌

export default function ConversionTrigger({ onUpgrade }: { onUpgrade?: () => void }) {
  const trial = useTrial();
  const [phase, setPhase] = useState<"enter" | "visible" | "exit" | "gone">("enter");

  useEffect(() => {
    if (!trial || !trial.started) return;

    // 슬라이드 다운
    const enterTimer = setTimeout(() => setPhase("visible"), 50);
    // 일정 시간 후 슬라이드 업
    const exitTimer = setTimeout(() => setPhase("exit"), VISIBLE_DURATION);
    // 애니메이션 끝나면 제거
    const goneTimer = setTimeout(() => setPhase("gone"), VISIBLE_DURATION + 500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(goneTimer);
    };
  }, [trial]);

  if (!trial || !trial.started || phase === "gone") return null;

  const { days, conversionCount, active } = trial;

  // 체험 종료 → 애니메이션 없이 상시 노출
  if (!active) {
    return (
      <div className="mx-auto max-w-3xl mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <span className="text-[13px] text-red-700 font-medium">
              무료체험이 종료되었어요. 총 {conversionCount}건을 변환하셨어요!
            </span>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              요금제 보기
            </button>
          )}
        </div>
      </div>
    );
  }

  const isVisible = phase === "visible";

  let emoji: string;
  let text: string;
  let bgClass: string;
  let borderClass: string;
  let textClass: string;
  let button: { label: string; bgClass: string } | null = null;

  if (days >= 5) {
    emoji = "🎉";
    text = `${conversionCount}건 변환 완료! 무료체험 ${days}일 남았어요`;
    bgClass = "bg-indigo-50";
    borderClass = "border-indigo-100";
    textClass = "text-indigo-700";
  } else if (days >= 3) {
    emoji = "⚡";
    text = `벌써 ${conversionCount}건이나 활용하셨네요! 체험 기간 ${days}일 남음`;
    bgClass = "bg-amber-50";
    borderClass = "border-amber-100";
    textClass = "text-amber-800";
    button = { label: "요금제 보기", bgClass: "bg-amber-600 hover:bg-amber-700" };
  } else {
    emoji = "🔥";
    text = `${conversionCount}건 변환 중! 체험이 곧 종료돼요 — ${days}일 남음`;
    bgClass = "bg-red-50";
    borderClass = "border-red-200";
    textClass = "text-red-700";
    button = { label: "지금 업그레이드", bgClass: "bg-red-600 hover:bg-red-700" };
  }

  return (
    <div
      className="mx-auto max-w-3xl mb-4 overflow-hidden transition-all duration-500 ease-out"
      style={{
        maxHeight: isVisible ? 80 : 0,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(-20px)",
      }}
    >
      <div className={`flex items-center justify-between px-4 py-3 ${bgClass} border ${borderClass} rounded-xl`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{emoji}</span>
          <span className={`text-[13px] ${textClass} font-medium`}>{text}</span>
        </div>
        {button && onUpgrade && (
          <button
            onClick={onUpgrade}
            className={`px-3 py-1.5 ${button.bgClass} text-white text-xs font-semibold rounded-lg transition-colors`}
          >
            {button.label}
          </button>
        )}
      </div>
    </div>
  );
}
