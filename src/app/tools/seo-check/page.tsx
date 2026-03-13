import type { Metadata } from "next";
import SeoCheckClient from "./SeoCheckClient";

export const metadata: Metadata = {
  title: "무료 블로그 SEO 점수 체크기 | LOGOS.ai",
  description: "블로그 글의 SEO 점수를 무료로 분석하세요. 글 길이, 소제목 구조, 키워드 밀도, 이모지, 해시태그 등 9가지 항목을 실시간으로 체크합니다.",
  openGraph: {
    title: "무료 블로그 SEO 점수 체크기 | LOGOS.ai",
    description: "블로그 글의 SEO 점수를 무료로 분석하세요. 9가지 항목을 실시간으로 체크합니다.",
    type: "website",
    siteName: "LOGOS.ai",
    url: "https://logos.builders/tools/seo-check",
  },
};

export default function SeoCheckPage() {
  return <SeoCheckClient />;
}
