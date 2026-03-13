"use client";

import { useTrial } from "@/hooks/useTrial";

export default function TrialBanner({ onUpgrade }: { onUpgrade?: () => void }) {
  const trial = useTrial();

  if (!trial) return null;

  // 체험 중 or 시작 전
  if (trial.active || !trial.started) {
    const pct = (trial.days / 7) * 100;
    const barColor = trial.days >= 5
      ? "bg-[#4F46E5]"
      : trial.days >= 3
        ? "bg-[#F59E0B]"
        : "bg-[#EF4444]";
    const textColor = trial.days >= 5
      ? "text-[#4F46E5]"
      : trial.days >= 3
        ? "text-[#D97706]"
        : "text-[#DC2626]";

    return (
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-gray-400">무료체험</span>
          <span className={`text-[11px] font-semibold ${textColor}`}>{trial.days}일 남음</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="w-full mt-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors"
          >
            업그레이드
          </button>
        )}
      </div>
    );
  }

  // 체험 종료
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-gray-400">무료체험</span>
        <span className="text-[11px] font-semibold text-[#DC2626]">종료됨</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gray-200" style={{ width: "0%" }} />
      </div>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="w-full mt-3 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          요금제 선택하기
        </button>
      )}
    </div>
  );
}
