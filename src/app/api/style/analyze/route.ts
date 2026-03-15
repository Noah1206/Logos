import { auth } from "@/lib/auth";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "로그인이 필요합니다." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { blog_url } = body;

    if (!blog_url) {
      return new Response(
        JSON.stringify({ error: "블로그 URL이 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(`${FASTAPI_URL}/api/style/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blog_url, user_id: session.user.id }),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `분석 서버 오류: ${error}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // SSE 스트림 프록시
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
      JSON.stringify({ error: "분석 서버에 연결할 수 없습니다." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
