"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface TrialData {
  active: boolean;
  daysLeft: number;
  started: boolean;
  credits: number;
}

export default function TrialBanner() {
  const { data: session, status } = useSession();
  const [trial, setTrial] = useState<TrialData | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/trial")
      .then((r) => r.json())
      .then(setTrial)
      .catch(() => {});
  }, [session]);

  if (status === "loading") return null;

  // 게스트
  if (!session?.user) {
    return (
      <div className="max-w-4xl mx-auto px-8 mt-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            런칭 기념 <span className="text-gray-600 font-medium">7일 무료체험</span> 진행 중
          </p>
          <button
            onClick={() => signIn()}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-4 decoration-gray-300"
          >
            로그인하고 시작하기
          </button>
        </div>
      </div>
    );
  }

  if (!trial) return null;
  if (trial.credits > 0 && !trial.active) return null;

  // 체험 시작 전 or 체험 중
  if (!trial.started || trial.active) {
    const days = trial.started ? trial.daysLeft : 7;
    return (
      <div className="max-w-4xl mx-auto px-8 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-[3px]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-[6px] h-[6px] rounded-full ${
                    i < days ? "bg-gray-900" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              무료체험 <span className="text-gray-900 font-medium">{days}일 남음</span>
            </p>
          </div>
          <a
            href="/pricing"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            요금제 보기 →
          </a>
        </div>
      </div>
    );
  }

  // 체험 종료
  return (
    <div className="max-w-4xl mx-auto px-8 mt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          무료체험이 종료되었어요
        </p>
        <a
          href="/pricing"
          className="text-sm text-gray-900 font-medium hover:underline underline-offset-4 transition-colors"
        >
          요금제 선택하기 →
        </a>
      </div>
    </div>
  );
}
