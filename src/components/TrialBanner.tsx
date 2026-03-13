"use client";

import { useTrial } from "@/hooks/useTrial";

export default function TrialBanner({ onUpgrade }: { onUpgrade?: () => void }) {
  const trial = useTrial();

  if (!trial) return null;

  // 체험 중 or 시작 전
  if (trial.active || !trial.started) {
    return (
      <div className="mt-3 px-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-400">무료체험</span>
          <span className="text-[11px] text-gray-500 font-medium">{trial.days}일 남음</span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${(trial.days / 7) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // 체험 종료 + 크레딧 없음
  if (trial.credits <= 0) {
    return (
      <button
        onClick={onUpgrade}
        className="w-full mt-3 py-2.5 bg-[#FEF9C3] hover:bg-[#FEF08A] text-gray-900 text-xs font-medium rounded-lg transition-colors"
      >
        무료체험 종료 · 요금제 선택하기
      </button>
    );
  }

  return null;
}
