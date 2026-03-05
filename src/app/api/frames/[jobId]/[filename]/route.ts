import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; filename: string }> }
) {
  const { jobId, filename } = await params;

  try {
    const response = await fetch(
      `${FASTAPI_URL}/api/frames/${jobId}/${filename}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "이미지를 찾을 수 없습니다" },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "이미지 서버에 연결할 수 없습니다" },
      { status: 503 }
    );
  }
}
