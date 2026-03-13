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

      if (!session?.user?.id) {
        return new Response(
          JSON.stringify({ success: false, error: "로그인이 필요합니다." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      {
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
    }

    const body = await req.json();

    const response = await fetch(`${FASTAPI_URL}/api/study/stream`, {
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

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "백엔드 서버에 연결할 수 없습니다." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
