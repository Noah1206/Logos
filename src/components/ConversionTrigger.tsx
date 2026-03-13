"use client";

import { useEffect, useState, useCallback } from "react";
import { useTrial } from "@/hooks/useTrial";

const VISIBLE_DURATION = 5000;

export default function ConversionTrigger({ onUpgrade }: { onUpgrade?: () => void }) {
  const trial = useTrial();
  const [phase, setPhase] = useState<"hidden" | "visible" | "gone">("hidden");

  const show = useCallback(() => {
    setPhase("hidden");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("visible"));
    });
    const timer = setTimeout(() => setPhase("gone"), VISIBLE_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // 페이지 진입 시
  useEffect(() => {
    if (!trial || !trial.started) return;
    return show();
  }, [trial, show]);

  // 새 변환 감지 (conversionCount 변경)
  useEffect(() => {
    if (!trial || !trial.started || !trial.conversionCount) return;
    return show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial?.conversionCount]);

  if (!trial || !trial.started) return null;

  const { days, conversionCount, active } = trial;

  // 체험 종료 → 상시 노출
  if (!active) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
          <span className="text-[13px] text-gray-900">
            무료체험 종료 · 총 <strong>{conversionCount}건</strong> 변환
          </span>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="text-[13px] text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              업그레이드
            </button>
          )}
        </div>
      </div>
    );
  }

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

  const isVisible = phase === "visible";

  return (
    <div
      className="mb-6 overflow-hidden transition-all duration-500 ease-out"
      style={{
        maxHeight: isVisible ? 60 : 0,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(-12px)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
        <span className="text-[13px] text-gray-900">{text}</span>
        {showUpgrade && onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-[13px] text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
          >
            업그레이드
          </button>
        )}
      </div>
    </div>
  );
}
