"use client";

import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation, useTranslationArray } from "@/i18n";
import LanguageToggle from "@/components/LanguageToggle";

type StudyMethod = "import" | "topic" | null;
type SourceType = "youtube" | "pdf";

export default function StudyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const topicExamples = useTranslationArray("study.page.topicExamples");
  const quickTopicList = useTranslationArray("study.page.quickTopicList");

  const [method, setMethod] = useState<StudyMethod>(null);
  const [sourceType, setSourceType] = useState<SourceType>("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [topicText, setTopicText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = async () => {
    if (isProcessing) return;

    if (method === "import" && sourceType === "youtube") {
      if (!youtubeUrl.trim()) return;
      sessionStorage.setItem("study-url", youtubeUrl);
      window.location.href = `/result?mode=study&studyMode=youtube&url=${encodeURIComponent(youtubeUrl)}`;
    } else if (method === "import" && sourceType === "pdf") {
      if (!pdfFile) return;
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append("file", pdfFile);
        const res = await fetch("/api/study/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem("study-pdf-url", data.url);
        sessionStorage.setItem("study-pdf-name", data.fileName);
        window.location.href = `/result?mode=study&studyMode=pdf`;
      } catch {
        alert(t("study.uploadError"));
        setIsProcessing(false);
      }
    } else if (method === "topic") {
      if (!topicText.trim()) return;
      sessionStorage.setItem("study-topic", topicText.trim());
      window.location.href = `/result?mode=study&studyMode=topic&topic=${encodeURIComponent(topicText.trim())}`;
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#4F46E5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  {t("tabs.videoToBlog")}
                </a>
                <span className="text-sm text-[#4F46E5] font-medium">
                  {t("tabs.study")}
                </span>
                {user && (
                  <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {t("nav.dashboard")}
                  </a>
                )}
              </nav>
              <LanguageToggle />
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.name || user.email?.split("@")[0]}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
            {t("study.page.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            {t("study.page.subtitle")}
          </p>
        </div>

        {/* Step 1: Method Selection */}
        {!method && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Import Materials Card */}
            <button
              onClick={() => setMethod("import")}
              className="group relative text-left p-5 pb-4 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <p className="text-lg font-bold text-gray-900 mb-1.5">📄 {t("study.page.importTitle")}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{t("study.page.importDesc")}</p>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-gray-50 rounded text-[11px] text-gray-500">YouTube</span>
                <span className="px-2 py-0.5 bg-gray-50 rounded text-[11px] text-gray-500">PDF</span>
                <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-[#4F46E5] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </button>

            {/* Start by Topic Card */}
            <button
              onClick={() => setMethod("topic")}
              className="group relative text-left p-5 pb-4 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <p className="text-lg font-bold text-gray-900 mb-1.5">💡 {t("study.page.topicTitle")}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{t("study.page.topicDesc")}</p>
              <div className="flex items-center gap-1.5">
                {topicExamples.slice(0, 2).map((ex: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-50 rounded text-[11px] text-gray-500 truncate max-w-[100px]">{ex}</span>
                ))}
                <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-[#4F46E5] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Import Materials */}
        {method === "import" && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Back button */}
            <button
              onClick={() => { setMethod(null); setYoutubeUrl(""); setPdfFile(null); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {t("common.goBack")}
            </button>

            {/* Source type tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {(["youtube", "pdf"] as SourceType[]).map((src) => (
                <button
                  key={src}
                  onClick={() => { setSourceType(src); setYoutubeUrl(""); setPdfFile(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    sourceType === src
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {src === "youtube" && (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )}
                  {src === "pdf" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  )}
                  {t(`study.page.source.${src}`)}
                </button>
              ))}
            </div>

            {/* YouTube input */}
            {sourceType === "youtube" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("study.page.youtubeLabel")}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && youtubeUrl.trim()) handleStart(); }}
                      placeholder={t("study.urlPlaceholder")}
                      className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4F46E5] focus:ring-0 text-sm bg-gray-50 placeholder-gray-400"
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.7-3.338a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.52" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{t("study.page.youtubeHint")}</p>
                </div>

                <button
                  onClick={handleStart}
                  disabled={!youtubeUrl.trim() || isProcessing}
                  className="w-full py-3.5 bg-[#4F46E5] text-white rounded-xl font-medium text-sm hover:bg-[#4338CA] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {t("study.startStudy")}
                </button>
              </div>
            )}

            {/* PDF upload */}
            {sourceType === "pdf" && (
              <div className="space-y-4">
                <div
                  className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                    pdfFile
                      ? "border-[#4F46E5] bg-indigo-50/50"
                      : "border-gray-300 hover:border-[#4F46E5]/50 hover:bg-gray-50"
                  }`}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file?.type === "application/pdf") setPdfFile(file);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPdfFile(file);
                      e.target.value = "";
                    }}
                  />
                  {pdfFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 bg-[#4F46E5]/10 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{pdfFile.name}</span>
                      <span className="text-xs text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                        className="text-xs text-red-400 hover:text-red-500 mt-1"
                      >
                        {t("study.page.removeFile")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{t("study.pdfUpload.dropzone")}</p>
                        <p className="text-xs text-gray-400 mt-1">{t("study.pdfUpload.hint")}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStart}
                  disabled={!pdfFile || isProcessing}
                  className="w-full py-3.5 bg-[#4F46E5] text-white rounded-xl font-medium text-sm hover:bg-[#4338CA] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      {t("common.processing")}
                    </span>
                  ) : (
                    t("study.startStudy")
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Start by Topic */}
        {method === "topic" && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Back button */}
            <button
              onClick={() => { setMethod(null); setTopicText(""); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {t("common.goBack")}
            </button>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("study.page.topicLabel")}
                </label>
                <textarea
                  value={topicText}
                  onChange={(e) => setTopicText(e.target.value)}
                  placeholder={t("study.page.topicPlaceholder")}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-sm bg-gray-50 placeholder-gray-400 resize-none"
                />
              </div>

              {/* Quick topic suggestions */}
              <div>
                <p className="text-xs text-gray-400 mb-2">{t("study.page.quickTopics")}</p>
                <div className="flex flex-wrap gap-2">
                  {quickTopicList.map((topic: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setTopicText(topic)}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!topicText.trim() || isProcessing}
              className="w-full py-3.5 mt-4 bg-[#4F46E5] text-white rounded-xl font-medium text-sm hover:bg-[#4338CA] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {t("study.page.generateFromTopic")}
            </button>
          </div>
        )}

        {/* Bottom info */}
        {!method && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("study.page.infoTime")}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                {t("study.page.infoSafe")}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                {t("study.page.infoAi")}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
