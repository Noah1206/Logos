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

  const days = trial.started ? trial.daysLeft : 14;

  return { ...trial, days };
}
