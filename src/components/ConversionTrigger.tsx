"use client";

import { useEffect, useState } from "react";
import { useTrial } from "@/hooks/useTrial";

const VISIBLE_DURATION = 4000;

export default function ConversionTrigger({ onUpgrade }: { onUpgrade?: () => void }) {
  const trial = useTrial();
  const [phase, setPhase] = useState<"enter" | "visible" | "exit" | "gone">("enter");

  useEffect(() => {
    if (!trial || !trial.started) return;

    const enterTimer = setTimeout(() => setPhase("visible"), 50);
    const exitTimer = setTimeout(() => setPhase("exit"), VISIBLE_DURATION);
    const goneTimer = setTimeout(() => setPhase("gone"), VISIBLE_DURATION + 500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(goneTimer);
    };
  }, [trial]);

  if (!trial || !trial.started || phase === "gone") return null;

  const { days, conversionCount, active } = trial;

  // 체험 종료 → 상시 노출
  if (!active) {
    return (
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          무료체험 종료 · 총 {conversionCount}건 변환
        </span>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
          >
            업그레이드
          </button>
        )}
      </div>
    );
  }

  const isVisible = phase === "visible";

  let text: string;
  let showUpgrade = false;

  if (days >= 5) {
    text = `${conversionCount}건 변환 완료 · 무료체험 ${days}일 남음`;
  } else if (days >= 3) {
    text = `${conversionCount}건 활용 중 · 체험 ${days}일 남음`;
    showUpgrade = true;
  } else {
    text = `${conversionCount}건 변환 · 체험 ${days}일 남음`;
    showUpgrade = true;
  }

  return (
    <div
      className="mb-6 overflow-hidden transition-all duration-500 ease-out"
      style={{
        maxHeight: isVisible ? 40 : 0,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(-10px)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{text}</span>
        {showUpgrade && onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
          >
            업그레이드
          </button>
        )}
      </div>
    </div>
  );
}
