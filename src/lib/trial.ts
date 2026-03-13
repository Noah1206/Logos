const TRIAL_DAYS = 7;

export interface TrialStatus {
  active: boolean;
  daysLeft: number;
  started: boolean;
}

export function getTrialStatus(freeTrialStartedAt: Date | null): TrialStatus {
  if (!freeTrialStartedAt) {
    return { active: false, daysLeft: TRIAL_DAYS, started: false };
  }

  const now = new Date();
  const elapsed = now.getTime() - new Date(freeTrialStartedAt).getTime();
  const daysLeft = Math.max(0, Math.ceil((TRIAL_DAYS * 86400000 - elapsed) / 86400000));

  return {
    active: daysLeft > 0,
    daysLeft,
    started: true,
  };
}
