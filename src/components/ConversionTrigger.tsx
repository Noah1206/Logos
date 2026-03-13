"use client";

import { useTrial } from "@/hooks/useTrial";

export default function ConversionTrigger({ onUpgrade }: { onUpgrade?: () => void }) {
  const trial = useTrial();

  if (!trial || !trial.started) return null;

  const { days, conversionCount, active } = trial;

  // 체험 종료
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

  // 5~7일 남음: 여유로운 톤
  if (days >= 5) {
    return (
      <div className="mx-auto max-w-3xl mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎉</span>
            <span className="text-[13px] text-indigo-700 font-medium">
              {conversionCount}건 변환 완료! 무료체험 {days}일 남았어요
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3~4일 남음: 살짝 긴장감
  if (days >= 3) {
    return (
      <div className="mx-auto max-w-3xl mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span className="text-[13px] text-amber-800 font-medium">
              벌써 {conversionCount}건이나 활용하셨네요! 체험 기간 {days}일 남음
            </span>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              요금제 보기
            </button>
          )}
        </div>
      </div>
    );
  }

  // 1~2일 남음: 강한 긴박감
  return (
    <div className="mx-auto max-w-3xl mb-4">
      <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔥</span>
          <span className="text-[13px] text-red-700 font-medium">
            {conversionCount}건 변환 중! 체험이 곧 종료돼요 — {days}일 남음
          </span>
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            지금 업그레이드
          </button>
        )}
      </div>
    </div>
  );
}
