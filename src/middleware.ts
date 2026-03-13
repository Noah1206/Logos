import { NextRequest, NextResponse } from "next/server";

// PrismaAdapter(DB 세션)는 Edge Runtime에서 동작하지 않으므로
// 세션 쿠키 존재 여부로 인증을 판별합니다.
// 실제 세션 유효성은 각 API 핸들러의 auth() 호출에서 2차 검증됩니다.

const SESSION_COOKIE = "authjs.session-token";
const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";

// 인증이 필요한 페이지 경로 (임시 비활성화 — 무료 테스트 기간)
const protectedPages: string[] = [];  // "/result", "/tone", "/study" 임시 제거

// 인증이 필요한 API 경로 (임시 비활성화 — 무료 테스트 기간)
const protectedApi = [
  // "/api/convert",       // 임시 제거
  "/api/conversions",
  "/api/knowledge",
  // "/api/study",         // 임시 제거
  "/api/think",
  "/api/generate-video",
  "/api/payment/request",
  "/api/payment/confirm",
  "/api/payment/stripe",
];

// 인증 없이 접근 가능한 경로 (webhook 등)
const publicApi = [
  "/api/auth",
  "/api/payment/webhook",
  "/api/payment/stripe/webhook",
  "/api/frames",
  "/api/share",
];

function hasSessionCookie(req: NextRequest): boolean {
  return !!(
    req.cookies.get(SESSION_COOKIE)?.value ||
    req.cookies.get(SECURE_SESSION_COOKIE)?.value
  );
}

function isPublicPath(pathname: string): boolean {
  return publicApi.some((p) => pathname.startsWith(p));
}

function isProtectedPage(pathname: string): boolean {
  return protectedPages.some((p) => pathname.startsWith(p));
}

function isProtectedApi(pathname: string): boolean {
  return protectedApi.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로는 통과
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = hasSessionCookie(req);

  // 보호된 페이지: 미인증 시 메인으로 리다이렉트
  if (isProtectedPage(pathname) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 보호된 API: 미인증 시 401
  if (isProtectedApi(pathname) && !isLoggedIn) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 보호된 페이지
    "/result/:path*",
    "/tone/:path*",
    "/study/:path*",
    // 보호된 API (auth, webhook, frames 제외)
    "/api/convert/:path*",
    "/api/conversions/:path*",
    "/api/knowledge/:path*",
    "/api/study/:path*",
    "/api/think/:path*",
    "/api/generate-video/:path*",
    "/api/payment/request/:path*",
    "/api/payment/confirm/:path*",
    "/api/payment/stripe",
  ],
};
