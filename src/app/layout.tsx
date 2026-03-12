import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Providers from "./providers";
import JsonLd from "@/components/JsonLd";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Shorts2Blog",
  url: "https://logos.builders",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "유튜브 쇼츠·인스타 릴스를 네이버 블로그 SEO 최적화 글로 자동 변환하는 SaaS 서비스.",
  offers: [
    {
      "@type": "Offer",
      name: "스타터 팩",
      price: "9900",
      priceCurrency: "KRW",
      description: "10건 변환",
    },
    {
      "@type": "Offer",
      name: "프로 팩",
      price: "29000",
      priceCurrency: "KRW",
      description: "50건 변환",
    },
  ],
  inLanguage: "ko",
  audience: {
    "@type": "Audience",
    audienceType: "자영업자, 크리에이터, 1인 마케터",
  },
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://logos.builders"),
  title: {
    default: "쇼츠·릴스 → 네이버 블로그 자동 변환 | Shorts2Blog",
    template: "%s | Shorts2Blog",
  },
  description:
    "유튜브 쇼츠·인스타 릴스 링크 하나로 네이버 블로그 SEO 최적화 글을 1분 안에 자동 완성. 블로그 대행 월 100만원 → 건당 990원.",
  keywords: [
    "쇼츠 블로그 변환",
    "릴스 네이버 블로그",
    "블로그 자동화",
    "AI 블로그 글쓰기",
    "네이버 블로그 SEO",
    "유튜브 쇼츠 블로그",
    "콘텐츠 자동화",
  ],
  authors: [{ name: "Shorts2Blog" }],
  creator: "Shorts2Blog",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://logos.builders",
    siteName: "Shorts2Blog",
    title: "영상 → 블로그 글, 1분이면 끝 | Shorts2Blog",
    description:
      "쇼츠·릴스 링크만 넣으면 네이버 SEO 최적화 블로그 글 자동 완성. 학원장·자영업자·크리에이터를 위한 콘텐츠 자동화 도구.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Shorts2Blog - 쇼츠·릴스를 네이버 블로그로 자동 변환",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "영상 → 블로그 글, 1분이면 끝 | Shorts2Blog",
    description: "쇼츠·릴스 링크만 넣으면 네이버 SEO 최적화 블로그 글 자동 완성.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        <meta name="naver-site-verification" content="d0ed4eea36a855fadaa71837054d71ee6740c9ad" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-F32JVK9158"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F32JVK9158');
          `}
        </Script>
      </head>
      <body>
        <Script
          src="https://cdn.iamport.kr/v1/iamport.js"
          strategy="beforeInteractive"
        />
        <JsonLd data={jsonLd} />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
