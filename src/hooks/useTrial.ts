// 유료화 시 복원 - 트라이얼 상태 확인 훅
// 현재 무료 전환으로 전체 주석 처리

/*
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface TrialData {
  active: boolean;
  daysLeft: number;
  started: boolean;
  credits: number;
  conversionCount: number;
}

export function useTrial() {
  const { data: session } = useSession();
  const [trial, setTrial] = useState<TrialData | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/trial")
      .then((r) => r.json())
      .then(setTrial)
      .catch(() => {});
  }, [session]);

  if (!trial || !session?.user) return null;

  const days = trial.started ? trial.daysLeft : 7;

  return { ...trial, days };
}
*/
