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
  name: "LOGOS.ai",
  alternateName: "로고스 AI",
  url: "https://logos.builders",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-powered tool that converts YouTube Shorts and Instagram Reels into SEO-optimized blog posts in seconds. 유튜브 쇼츠·인스타 릴스를 AI로 블로그 글·영상으로 자동 변환.",
  offers: [
    {
      "@type": "Offer",
      name: "Starter Pack",
      price: "9900",
      priceCurrency: "KRW",
      description: "10 conversions / 10건 변환",
    },
    {
      "@type": "Offer",
      name: "Pro Pack",
      price: "29000",
      priceCurrency: "KRW",
      description: "50 conversions / 50건 변환",
    },
  ],
  inLanguage: ["ko", "en"],
  audience: {
    "@type": "Audience",
    audienceType: "Small business owners, creators, marketers, 자영업자, 크리에이터, 1인 마케터",
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
    default: "LOGOS.ai – 영상↔블로그 AI 자동 변환 | 쇼츠·릴스를 블로그로",
    template: "%s | LOGOS.ai",
  },
  description:
    "유튜브 쇼츠·인스타 릴스를 네이버 블로그 SEO 글로 자동 변환. 블로그를 숏폼 영상으로도 변환. AI가 1분 안에 완성, 건당 990원.",
  keywords: [
    // English keywords
    "AI blog writer",
    "video to blog converter",
    "YouTube Shorts to blog",
    "Instagram Reels to blog",
    "AI content converter",
    "blog to video",
    "short form video to article",
    "AI SEO blog generator",
    "content repurposing tool",
    "video transcription to blog",
    // Korean keywords
    "쇼츠 블로그 변환",
    "릴스 블로그 변환",
    "AI 블로그 글쓰기",
    "영상 블로그 자동변환",
    "네이버 블로그 SEO",
    "블로그 자동화",
    "콘텐츠 자동화",
    "블로그 영상 변환",
    "AI 콘텐츠 변환",
    "유튜브 쇼츠 블로그",
  ],
  authors: [{ name: "LOGOS.ai" }],
  creator: "LOGOS.ai",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    url: "https://logos.builders",
    siteName: "LOGOS.ai",
    title: "LOGOS.ai – 영상↔블로그 AI 자동 변환",
    description:
      "쇼츠·릴스를 블로그 글로, 블로그를 영상으로. AI가 1분 안에 자동 변환해드려요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LOGOS.ai – 영상↔블로그 AI 자동 변환",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LOGOS.ai – 영상↔블로그 AI 자동 변환",
    description: "쇼츠·릴스를 블로그 글로, 블로그를 영상으로. AI가 1분 안에 자동 변환해드려요.",
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
    <html lang="ko" className={poppins.variable}>
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
