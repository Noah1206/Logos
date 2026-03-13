import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPromotionActive } from "@/lib/promotion";
import { getTrialStatus } from "@/lib/trial";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const promoActive = isPromotionActive();

    if (!promoActive) {
      const session = await auth();

      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { credits: true, freeTrialStartedAt: true },
        });

        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: "사용자를 찾을 수 없습니다." }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const trial = getTrialStatus(user.freeTrialStartedAt);

        if (trial.active) {
          // 무료체험 기간 중: 첫 변환이면 시작일 기록
          if (!user.freeTrialStartedAt) {
            await prisma.user.update({
              where: { id: session.user.id },
              data: { freeTrialStartedAt: new Date() },
            });
          }
        } else if (user.credits > 0) {
          // 무료체험 끝남 + 크레딧 있음: 크레딧 차감
          await prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: 1 } },
          });
        } else {
          // 무료체험 끝남 + 크레딧 없음
          return new Response(
            JSON.stringify({ success: false, error: "trial_ended" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } else {
        // 게스트: 쿠키로 1회 제한
        const guestUsed = req.cookies.get("guest_used")?.value;
        if (guestUsed) {
          return new Response(
            JSON.stringify({ success: false, error: "무료 체험을 이미 사용하셨습니다. 로그인 후 이용해주세요." }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    const isGuest = !promoActive && !(await auth())?.user?.id;

    const body = await req.json();

    const response = await fetch(`${FASTAPI_URL}/api/convert/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ success: false, error: `FastAPI 오류: ${error}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // SSE 스트림을 그대로 프록시
    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    };

    // 게스트 사용 시 쿠키 설정 (30일 유지)
    if (isGuest) {
      headers["Set-Cookie"] = "guest_used=1; Path=/; Max-Age=2592000; SameSite=Lax";
    }

    return new Response(response.body, { headers });
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "백엔드 서버에 연결할 수 없습니다.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
