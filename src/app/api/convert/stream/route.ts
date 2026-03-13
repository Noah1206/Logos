import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPromotionActive } from "@/lib/promotion";
import { getTrialStatus } from "@/lib/trial";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const GUEST_COOKIE = "guest_converted";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const promoActive = isPromotionActive();

    const session = await auth();

    // 비로그인: 쿠키로 1회 허용
    if (!session?.user?.id) {
      const cookieStore = await cookies();
      const guestUsed = cookieStore.get(GUEST_COOKIE);

      if (guestUsed) {
        return new Response(
          JSON.stringify({ success: false, error: "login_required" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // 첫 게스트 변환 → 쿠키 설정 (30일 유지)
      cookieStore.set(GUEST_COOKIE, "1", {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }

    // 로그인 유저: 크레딧/체험 체크
    if (session?.user?.id && !promoActive) {
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
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...(!user.freeTrialStartedAt ? { freeTrialStartedAt: new Date() } : {}),
            freeTrialConversionCount: { increment: 1 },
          },
        });
      } else if (user.credits > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { credits: { decrement: 1 } },
        });
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "trial_ended" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

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
