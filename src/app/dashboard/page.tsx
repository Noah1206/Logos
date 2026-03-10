"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import ConversionCard from "@/components/ConversionCard";
import type { ConversionHistory } from "@/types";

type DashboardTab = "video-to-blog" | "feed-to-blog" | "study";

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const [activeTab, setActiveTab] = useState<DashboardTab>("video-to-blog");
  const [conversions, setConversions] = useState<ConversionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchConversions = useCallback(
    async (cursor?: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ mode: activeTab, limit: "20" });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/conversions?${params}`);
        if (!res.ok) throw new Error();

        const json = await res.json();
        if (cursor) {
          setConversions((prev) => [...prev, ...json.data]);
        } else {
          setConversions(json.data);
        }
        setNextCursor(json.nextCursor);
        setHasMore(json.hasMore);
      } catch {
        // fail silently
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversions();
    }
  }, [status, fetchConversions]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/conversions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversions((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // fail silently
    }
  };

  const handleView = (id: string) => {
    const conversion = conversions.find((c) => c.id === id);
    if (conversion?.resultJson) {
      // Store result and navigate to result page
      sessionStorage.setItem(
        `convert_result_${conversion.sourceUrl}`,
        JSON.stringify(conversion.resultJson)
      );
      router.push(`/result?url=${encodeURIComponent(conversion.sourceUrl)}&mode=${conversion.mode}`);
    }
  };

  const tabs: { key: DashboardTab; label: string }[] = [
    { key: "video-to-blog", label: t("dashboard.tabs.videoToBlog") },
    { key: "feed-to-blog", label: t("dashboard.tabs.feedToBlog") },
    { key: "study", label: t("dashboard.tabs.study") },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#4F46E5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header - same as main page */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-7 w-7 translate-y-[3px]" />
              <span className="text-[22px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">
                LOGOS.ai
              </span>
            </a>

            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-4">
                <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t("common.startNow")}
                </a>
                <a href="#" className="text-sm text-[#4F46E5] font-medium">
                  {t("nav.dashboard")}
                </a>
              </nav>
              <LanguageToggle />
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                  <span className="px-2 py-1 text-xs rounded font-medium bg-[#EEF2FF] text-[#4F46E5]">
                    {t("common.creditsLeft", { count: user.credits })}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title + AI Brain button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
          <button
            onClick={() => router.push("/dashboard/think")}
            className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-full text-sm font-medium hover:bg-[#4338CA] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {t("dashboard.aiBrain")}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-full transition-all text-sm font-medium ${
                activeTab === tab.key
                  ? "bg-[#4F46E5] text-white"
                  : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && conversions.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-[#4F46E5] rounded-full animate-spin" />
          </div>
        ) : conversions.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("dashboard.empty.title")}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t("dashboard.empty.desc")}
            </p>
            <a
              href="/"
              className="inline-flex px-6 py-3 bg-[#4F46E5] text-white rounded-full text-sm font-medium hover:bg-[#4338CA] transition-colors"
            >
              {t("dashboard.empty.cta")}
            </a>
          </div>
        ) : (
          <>
            {/* Conversion cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversions.map((conversion) => (
                <ConversionCard
                  key={conversion.id}
                  id={conversion.id}
                  title={conversion.title || undefined}
                  sourceUrl={conversion.sourceUrl}
                  platform={conversion.platform}
                  mode={conversion.mode}
                  tone={conversion.tone || undefined}
                  createdAt={conversion.createdAt}
                  knowledge={
                    conversion.knowledge
                      ? {
                          topic: conversion.knowledge.topic || undefined,
                          summary: conversion.knowledge.summary || undefined,
                          keywords: conversion.knowledge.keywords || undefined,
                        }
                      : undefined
                  }
                  onView={handleView}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => nextCursor && fetchConversions(nextCursor)}
                  disabled={isLoading}
                  className="px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? t("common.processing") : t("dashboard.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
