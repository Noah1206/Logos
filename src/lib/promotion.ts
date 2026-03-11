// 48시간 무료 프로모션 설정
// 시작: 2026-03-09, 종료: 2026-03-11 23:59:59 KST
export const PROMOTION = {
  enabled: true,
  startDate: new Date("2026-03-09T00:00:00+09:00"),
  endDate: new Date("2026-03-13T23:59:59+09:00"),
  message: "오픈 기념 48시간 무료 이벤트 진행 중!",
} as const;

export function isPromotionActive(): boolean {
  if (!PROMOTION.enabled) return false;
  const now = new Date();
  return now >= PROMOTION.startDate && now <= PROMOTION.endDate;
}
