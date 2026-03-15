import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "로그인이 필요합니다." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const profile = await prisma.writingStyleProfile.findUnique({
      where: { userId: session.user.id },
    });

    return Response.json({ data: profile });
  } catch {
    return new Response(
      JSON.stringify({ error: "스타일 프로필을 불러올 수 없습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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
    const { blogUrl, blogId, styleProfile, postsAnalyzed } = body;

    const profile = await prisma.writingStyleProfile.upsert({
      where: { userId: session.user.id },
      update: {
        blogUrl,
        blogId,
        styleProfile,
        postsAnalyzed,
        status: "COMPLETED",
        analyzedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        blogUrl,
        blogId,
        styleProfile,
        postsAnalyzed,
        status: "COMPLETED",
        analyzedAt: new Date(),
      },
    });

    return Response.json({ data: profile });
  } catch {
    return new Response(
      JSON.stringify({ error: "스타일 프로필 저장에 실패했습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "로그인이 필요합니다." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.writingStyleProfile.deleteMany({
      where: { userId: session.user.id },
    });

    return Response.json({ success: true });
  } catch {
    return new Response(
      JSON.stringify({ error: "삭제에 실패했습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
