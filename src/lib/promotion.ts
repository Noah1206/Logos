// 현재 무제한 무료 - 항상 프로모션 활성 상태 반환
// 유료화 시 endDate를 실제 날짜로 변경하여 복원
export const PROMOTION = {
  enabled: true,
  startDate: new Date("2026-03-09T00:00:00+09:00"),
  endDate: new Date("2099-12-31T23:59:59+09:00"), // 무제한 무료
  message: "모든 기능 무제한 무료 이용 중!",
} as const;

export function isPromotionActive(): boolean {
  // 현재 무제한 무료 - 항상 true 반환
  return true;
}

/* 유료화 시 복원 - 기존 프로모션 체크 로직
export function isPromotionActive_ORIGINAL(): boolean {
  if (!PROMOTION.enabled) return false;
  const now = new Date();
  return now >= PROMOTION.startDate && now <= PROMOTION.endDate;
}
*/
