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

  // 로딩 중
  if (status === "loading") return null;

  // 게스트(미로그인) → 가입 유도 배너
  if (!session?.user) {
    return (
      <div className="max-w-4xl mx-auto px-8 mt-6">
        <div className="flex items-center justify-between px-5 py-4 border border-gray-200 rounded-xl bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎉</span>
            <p className="text-sm text-gray-700 font-medium">
              런칭 기념 · <span className="text-gray-900 font-bold">7일 무료체험</span> 진행 중!
            </p>
          </div>
          <button
            onClick={() => signIn()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium transition-all"
          >
            로그인하고 시작하기
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // 로그인했지만 API 응답 대기 중
  if (!trial) return null;

  // 크레딧이 있으면 배너 불필요
  if (trial.credits > 0 && !trial.active) return null;

  // 아직 체험 시작 안 했으면 안내
  if (!trial.started) {
    return (
      <div className="max-w-4xl mx-auto px-8 mt-6">
        <div className="flex items-center justify-between px-5 py-4 border border-gray-200 rounded-xl bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎉</span>
            <p className="text-sm text-gray-700 font-medium">
              7일 무료체험이 시작되었어요! 기간 내 무제한으로 이용하세요.
            </p>
          </div>
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">7일 남음</span>
        </div>
      </div>
    );
  }

  // 체험 중
  if (trial.active) {
    return (
      <div className="max-w-4xl mx-auto px-8 mt-6">
        <div className="flex items-center justify-between px-5 py-4 border border-gray-200 rounded-xl bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-lg">⏳</span>
            <p className="text-sm text-gray-700 font-medium">
              무료체험 중 · <span className="text-gray-900 font-bold">{trial.daysLeft}일 남음</span>
            </p>
          </div>
          <a
            href="/pricing"
            className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
          >
            요금제 보기
          </a>
        </div>
      </div>
    );
  }

  // 체험 종료 + 크레딧 없음
  return (
    <div className="max-w-4xl mx-auto px-8 mt-6">
      <div className="flex items-center justify-between px-5 py-4 border border-gray-200 rounded-xl bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-lg">📌</span>
          <p className="text-sm text-gray-700">
            7일 무료체험이 끝났어요
          </p>
        </div>
        <a
          href="/pricing"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium transition-all"
        >
          990원으로 계속하기
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
