import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// 인증이 필요한 페이지 경로
const protectedPages = ["/result", "/dashboard", "/tone", "/study"];

// 인증이 필요한 API 경로 (webhook은 제외)
const protectedApi = [
  "/api/convert",
  "/api/conversions",
  "/api/knowledge",
  "/api/study",
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
];

function isPublicPath(pathname: string): boolean {
  return publicApi.some((p) => pathname.startsWith(p));
}

function isProtectedPage(pathname: string): boolean {
  return protectedPages.some((p) => pathname.startsWith(p));
}

function isProtectedApi(pathname: string): boolean {
  return protectedApi.some((p) => pathname.startsWith(p));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 공개 경로는 통과
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user;

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
});

export const config = {
  matcher: [
    // 보호된 페이지
    "/result/:path*",
    "/dashboard/:path*",
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
