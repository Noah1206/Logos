import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ShareContent from "./ShareContent";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  const conversion = await prisma.conversion.findUnique({
    where: { shareToken: token },
    select: { title: true, resultJson: true },
  });

  if (!conversion) {
    return { title: "LOGOS.ai" };
  }

  const json = conversion.resultJson as Record<string, unknown> | null;
  const summary = (json?.summary as string) || "";
  const title = conversion.title || "LOGOS.ai로 생성된 블로그 글";
  const description = summary.slice(0, 150) || "영상 하나로 블로그 글 완성 - LOGOS.ai";

  return {
    title: `${title} | LOGOS.ai`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "LOGOS.ai",
      url: `https://logos.builders/share/${token}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const conversion = await prisma.conversion.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      title: true,
      mode: true,
      platform: true,
      resultJson: true,
      createdAt: true,
    },
  });

  if (!conversion) {
    notFound();
  }

  return <ShareContent conversion={conversion} />;
}
