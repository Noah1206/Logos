"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePayment } from "@/hooks/usePayment";
import { PROMOTION } from "@/lib/promotion";
import { useTranslation } from "@/i18n";
import LanguageToggle from "@/components/LanguageToggle";

type ConvertMode = "video-to-blog" | "feed-to-blog" | "study";

export default function Home() {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [platform, setPlatform] = useState<"youtube" | "instagram">("instagram");
  const [isConverting, setIsConverting] = useState(false);
  const [mode, setMode] = useState<ConvertMode>("video-to-blog");
  const [blogContent, setBlogContent] = useState("");
  const [videoStyle, setVideoStyle] = useState("");
  const [studyUrl, setStudyUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);

  const { data: session, status, update: updateSession } = useSession();
  const isAuthLoading = status === "loading";
  const user = session?.user;

  const { purchasePackage, isProcessing } = usePayment({
    onSuccess: (credits) => {
      alert(t("payment.completed", { credits }));
      updateSession();
    },
    onError: (error) => {
      if (!error.includes(t("payment.cancelled"))) {
        alert(t("payment.error", { error }));
      }
    },
  });

  const handlePurchase = (packageId: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    purchasePackage(packageId);
  };

  const [loginLoading, setLoginLoading] = useState<string | null>(null);

  // 프로모션 남은 시간 계산
  const [promoTimeLeft, setPromoTimeLeft] = useState("");
  const [isPromoActive, setIsPromoActive] = useState(false);

  useEffect(() => {
    function updatePromo() {
      const now = new Date();
      if (!PROMOTION.enabled || now < PROMOTION.startDate || now > PROMOTION.endDate) {
        setIsPromoActive(false);
        return;
      }
      setIsPromoActive(true);
      const diff = PROMOTION.endDate.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setPromoTimeLeft(`${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }
    updatePromo();
    const interval = setInterval(updatePromo, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSocialLogin = (provider: "kakao" | "naver") => {
    setLoginLoading(provider);
    signIn(provider, { callbackUrl: "/" });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleConvert = async () => {
    if (isConverting) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (mode === "study") {
      // Study 모드: PDF 또는 YouTube URL
      if (!studyUrl.trim() && !pdfFile) return;
      setIsConverting(true);

      if (pdfFile) {
        // PDF 업로드 후 result 페이지로
        setPdfUploading(true);
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
          setIsConverting(false);
          setPdfUploading(false);
          return;
        }
      } else {
        // YouTube URL
        sessionStorage.setItem("study-url", studyUrl);
        window.location.href = `/result?mode=study&studyMode=youtube&url=${encodeURIComponent(studyUrl)}`;
      }
    } else {
      if (!url.trim()) return;
      setIsConverting(true);
      setTimeout(() => {
        window.location.href = `/tone?url=${encodeURIComponent(url)}`;
      }, 600);
    }
  };


  return (
    <main className="min-h-screen bg-white">
      {/* Promotion Banner */}
      {isPromoActive && (
        <div className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-center py-2.5 px-4 text-sm font-medium">
          {t("promo.banner")}<span className="font-bold">{promoTimeLeft}</span>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-7 w-7 translate-y-[3px]" />
              <span className="text-[22px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
            </div>

            {/* Navigation + Actions */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-4">
                <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t("nav.pricing")}</a>
                {user && (
                  <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t("nav.dashboard")}</a>
                )}
              </nav>
              <LanguageToggle />
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${isPromoActive ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white" : "bg-[#EEF2FF] text-[#4F46E5]"}`}>
                    {isPromoActive ? t("promo.freeUsing") : t("common.creditsLeft", { count: user.credits })}
                  </span>
                  <button
                    onClick={handleLogout}
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

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          {/* 모드별 Hero 타이틀 */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-8">
            {mode === "video-to-blog" && (<>{t("hero.videoToBlog.title1")}<br /><span className="relative inline-block"><span className="relative z-10">{t("hero.videoToBlog.title2")}</span><span className="absolute bottom-1 left-0 w-full h-3 md:h-4 bg-[#C7D2FE] -z-0"></span></span></>)}
            {mode === "feed-to-blog" && (<>{t("hero.feedToBlog.title1")}<br /><span className="relative inline-block"><span className="relative z-10">{t("hero.feedToBlog.title2")}</span><span className="absolute bottom-1 left-0 w-full h-3 md:h-4 bg-[#C7D2FE] -z-0"></span></span></>)}
            {mode === "study" && (<>{t("study.title1")}<br /><span className="relative inline-block"><span className="relative z-10">{t("study.title2")}</span><span className="absolute bottom-1 left-0 w-full h-3 md:h-4 bg-[#C7D2FE] -z-0"></span></span></>)}
          </h1>

          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed whitespace-pre-line">
            {mode === "video-to-blog" && t("hero.videoToBlog.desc")}
            {mode === "feed-to-blog" && t("hero.feedToBlog.desc")}
            {mode === "study" && t("study.desc")}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => {
              const heroInput = document.querySelector<HTMLInputElement>('#hero-url-input') || document.querySelector<HTMLTextAreaElement>('#hero-blog-input');
              if (heroInput) heroInput.focus();
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-10 py-4 text-base font-medium text-white bg-[#4F46E5] rounded-full hover:bg-[#4338CA] hover:scale-[0.98] active:scale-95 transition-all mb-16"
          >
            {t("common.startFree")}
          </button>

          {/* Convert Section */}
          <div className="max-w-2xl mx-auto mb-20">
            {/* 모드 선택 탭 */}
            <div className="flex justify-center gap-2 mb-6">
              {([
                { key: "video-to-blog" as ConvertMode, label: t("tabs.videoToBlog") },
                { key: "feed-to-blog" as ConvertMode, label: t("tabs.feedToBlog") },
                { key: "study" as ConvertMode, label: t("tabs.study"), href: "/study" },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (tab.href) {
                      window.location.href = tab.href;
                    } else {
                      setMode(tab.key);
                    }
                  }}
                  className={`relative px-5 py-2.5 rounded-full transition-all text-sm font-medium ${
                    mode === tab.key && !tab.href
                      ? "bg-[#4F46E5] text-white"
                      : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* video-to-blog: 플랫폼 선택 + URL 입력 */}
            {mode === "video-to-blog" && (
              <>
                <div className="flex justify-center gap-1.5 mb-4">
                  <button
                    onClick={() => setPlatform("youtube")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium ${
                      platform === "youtube"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${platform === "youtube" ? "text-red-300" : "text-red-500"}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    {t("common.youtube")}
                  </button>
                  <button
                    onClick={() => setPlatform("instagram")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium ${
                      platform === "instagram"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    {t("common.instagram")}
                  </button>
                </div>
                <div
                  className={`relative transition-all duration-300 ${
                    isConverting ? "scale-[0.97] opacity-70" : ""
                  }`}
                >
                  <input
                    id="hero-url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) handleConvert(); }}
                    disabled={isConverting}
                    placeholder={platform === "youtube" ? "https://www.youtube.com/shorts/..." : "https://www.instagram.com/reel/..."}
                    className={`w-full px-5 py-3 border rounded-xl focus:outline-none text-base pr-20 transition-all duration-300 ${
                      isConverting ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-gray-900 placeholder-gray-400"
                    }`}
                  />
                  <button
                    onClick={handleConvert}
                    disabled={!url.trim() || isConverting}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                      isConverting ? "bg-gray-300 text-white" : url.trim() ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:scale-90" : "text-gray-300"
                    }`}
                  >
                    {isConverting ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <span className="text-base">→</span>
                    )}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  <span className="text-[#4F46E5] font-medium">{t("convert.freeTrial")}</span> {t("convert.freeTrialDesc")}
                </p>
              </>
            )}

            {/* feed-to-blog: URL 입력만 */}
            {mode === "feed-to-blog" && (
              <>
                <div
                  className={`relative transition-all duration-300 ${
                    isConverting ? "scale-[0.97] opacity-70" : ""
                  }`}
                >
                  <input
                    id="hero-url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) handleConvert(); }}
                    disabled={isConverting}
                    placeholder="https://www.instagram.com/p/..."
                    className={`w-full px-5 py-3 border rounded-xl focus:outline-none text-base pr-20 transition-all duration-300 ${
                      isConverting ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-gray-900 placeholder-gray-400"
                    }`}
                  />
                  <button
                    onClick={handleConvert}
                    disabled={!url.trim() || isConverting}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                      isConverting ? "bg-gray-300 text-white" : url.trim() ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:scale-90" : "text-gray-300"
                    }`}
                  >
                    {isConverting ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <span className="text-base">→</span>
                    )}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  {t("convert.feedDesc")}
                </p>
              </>
            )}

            {/* study: YouTube URL 또는 PDF 업로드 */}
            {mode === "study" && (
              <>
                {/* YouTube URL 입력 */}
                <div className={`transition-all duration-300 ${isConverting ? "scale-[0.97] opacity-70" : ""}`}>
                  <input
                    id="hero-url-input"
                    type="url"
                    value={studyUrl}
                    onChange={(e) => { setStudyUrl(e.target.value); setPdfFile(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && studyUrl.trim()) handleConvert(); }}
                    disabled={isConverting || !!pdfFile}
                    placeholder={t("study.urlPlaceholder")}
                    className={`w-full px-5 py-3 border rounded-xl focus:outline-none text-base transition-all duration-300 ${
                      isConverting || pdfFile ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-gray-900 placeholder-gray-400"
                    }`}
                  />

                  {/* OR divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">{t("study.orDivider")}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* PDF Upload zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      pdfFile ? "border-[#4F46E5] bg-indigo-50" : "border-gray-300 hover:border-gray-400 bg-gray-50"
                    }`}
                    onClick={() => !isConverting && document.getElementById("pdf-input")?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file?.type === "application/pdf") {
                        setPdfFile(file);
                        setStudyUrl("");
                      }
                    }}
                  >
                    <input
                      id="pdf-input"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setPdfFile(file); setStudyUrl(""); }
                        e.target.value = "";
                      }}
                    />
                    {pdfFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-[#4F46E5]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                        </svg>
                        <span className="text-sm text-[#4F46E5] font-medium">{pdfFile.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm text-gray-500">{t("study.pdfUpload.dropzone")}</p>
                        <p className="text-xs text-gray-400 mt-1">{t("study.pdfUpload.hint")}</p>
                      </>
                    )}
                  </div>

                  {/* Start Study button */}
                  <button
                    onClick={handleConvert}
                    disabled={(!studyUrl.trim() && !pdfFile) || isConverting}
                    className={`w-full py-3 rounded-xl font-medium text-base mt-4 transition-all duration-300 disabled:cursor-not-allowed ${
                      isConverting
                        ? "bg-gray-300 text-white"
                        : (studyUrl.trim() || pdfFile)
                          ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:scale-[0.98]"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isConverting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        {pdfUploading ? t("common.processing") : t("convert.converting")}
                      </span>
                    ) : (
                      t("study.startStudy")
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Reels Preview Images - 3 Steps (video-to-blog 모드에서만 표시) */}
          {mode === "video-to-blog" && (
            <>
              <div className="flex justify-center items-center gap-14 mb-10">
                <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                  <p className="text-lg text-gray-600 mb-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{t("steps.step1")}</span> {t("steps.step1Desc")}
                  </p>
                  <img
                    src="/images/reels-1.png"
                    alt="관심있는 릴스 찾기"
                    className="w-60 h-[520px] object-cover rounded-2xl shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                  />
                </div>
                <div className="text-gray-300 text-5xl animate-pulse">→</div>
                <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                  <p className="text-lg text-gray-600 mb-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{t("steps.step2")}</span> {t("steps.step2Desc")}
                  </p>
                  <img
                    src="/images/reels-2.png"
                    alt="영상 링크 복사"
                    className="w-60 h-[520px] object-cover rounded-2xl shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center mb-16 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="text-gray-300 text-5xl animate-pulse mb-6">↓</div>
                <p className="text-lg text-gray-600 mb-4 whitespace-nowrap">
                  <span className="font-semibold text-[#4F46E5]">{t("steps.step3")}</span> {t("steps.step3Desc")}
                </p>
                <img
                  src="/images/step3-screenshot.png"
                  alt="LOGOS.ai에서 링크 붙여넣기"
                  className="w-full max-w-3xl h-auto object-contain rounded-2xl shadow-2xl border border-gray-200 hover:scale-[1.02] transition-all duration-300"
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-[#E5704F] tracking-wider uppercase">{t("problem.sectionLabel")}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">{t("problem.title")}</h2>
            <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto">
              {t("problem.subtitle")}
            </p>
          </div>

          {/* Category 1 */}
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 bg-[#f0fdf4] text-[#16a34a] text-sm font-medium rounded-full border border-[#bbf7d0]">
              {t("problem.cat1")}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 mb-12 scrollbar-hide">
            {([0, 1, 2, 3] as const).map((idx) => {
              const item = {
                emoji: t(`problem.items1.${idx}.emoji`),
                quote: t(`problem.items1.${idx}.quote`),
                desc: t(`problem.items1.${idx}.desc`),
                points: [
                  t(`problem.items1.${idx}.points.0`),
                  t(`problem.items1.${idx}.points.1`),
                  t(`problem.items1.${idx}.points.2`),
                ],
              };
              return item;
            }).map((item, i) => (
              <div key={i} className="min-w-[260px] max-w-[280px] flex-shrink-0 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <span className="text-3xl block mb-3">{item.emoji}</span>
                <h3 className="font-bold text-gray-900 text-[15px] mb-2 leading-snug">{item.quote}</h3>
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.points.map((point, j) => (
                    <li key={j} className="text-xs text-gray-400 flex items-start gap-1.5">
                      <span className="mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Category 2 */}
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 bg-[#f0fdf4] text-[#16a34a] text-sm font-medium rounded-full border border-[#bbf7d0]">
              {t("problem.cat2")}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
            {([0, 1, 2, 3] as const).map((idx) => {
              const item = {
                emoji: t(`problem.items2.${idx}.emoji`),
                quote: t(`problem.items2.${idx}.quote`),
                desc: t(`problem.items2.${idx}.desc`),
                points: [
                  t(`problem.items2.${idx}.points.0`),
                  t(`problem.items2.${idx}.points.1`),
                  t(`problem.items2.${idx}.points.2`),
                ],
              };
              return item;
            }).map((item, i) => (
              <div key={i} className="min-w-[260px] max-w-[280px] flex-shrink-0 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <span className="text-3xl block mb-3">{item.emoji}</span>
                <h3 className="font-bold text-gray-900 text-[15px] mb-2 leading-snug">{item.quote}</h3>
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.points.map((point, j) => (
                    <li key={j} className="text-xs text-gray-400 flex items-start gap-1.5">
                      <span className="mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          {/* Left - Conversion Preview Mock */}
          <div className="w-full lg:w-[440px] flex-shrink-0">
            <div className="rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
              {/* Before: Video Input */}
              <div className="bg-gray-900 px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                  </svg>
                  <span className="text-gray-400 text-sm truncate">youtube.com/shorts/xK2d9f...</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center py-3 bg-gradient-to-b from-gray-900 to-white">
                <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* After: Blog Output Preview - Naver Blog Style */}
              <div className="bg-white px-4 pb-4 pt-2">
                {/* Service badges */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="px-1.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold rounded">SEO</span>
                  <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded">최적화 완료</span>
                </div>

                {/* Naver Blog Mini Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  {/* Category */}
                  <div className="text-center pt-3">
                    <span className="text-[9px] text-[#08a600]">강남맛보기</span>
                  </div>

                  {/* Title */}
                  <h4 className="text-center text-[13px] font-bold text-gray-900 px-3 pt-1 pb-2.5 leading-snug">
                    [강남 맛집 추천] 웨이팅 없이<br />즐기는 프리미엄 오마카세
                  </h4>

                  {/* Author line */}
                  <div className="flex items-center justify-between px-3 pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                      <span className="text-[8px] text-gray-600 font-medium">강남구</span>
                      <span className="text-[8px] text-gray-300">2025. 10. 28. 13:55</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[7px] text-gray-400">URL 복사</span>
                      <span className="text-[7px] border border-gray-300 rounded px-1.5 py-0.5 text-gray-500">+이웃추가</span>
                    </div>
                  </div>

                  {/* Image with orange background */}
                  <div className="px-3 pt-3">
                    <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-lg p-2.5 relative">
                      <div className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-3 h-3 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                        <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center">
                          <span className="text-3xl mb-1">🍣</span>
                          <span className="text-[8px] text-gray-300">이미지 영역</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blog content */}
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] text-gray-600 leading-[1.8] text-center">
                      안녕하세요 여러분! 😊<br />
                      오늘은 강남역 근처에서 찾은<br />
                      <span className="font-semibold text-gray-800">숨겨진 오마카세 맛집</span>을 소개합니다!
                    </p>
                  </div>

                  {/* Subheading section */}
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[10px] font-bold text-gray-800 mb-1">🍽️ 메뉴 & 가격</p>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                      <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
                    </div>
                  </div>

                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[10px] font-bold text-gray-800 mb-1">📍 위치 & 영업시간</p>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                      <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
                    </div>
                  </div>

                  {/* Hashtags - Naver green style */}
                  <div className="px-3 pt-2.5 pb-3 flex flex-wrap gap-1.5">
                    {["#강남맛집", "#오마카세", "#데이트코스", "#강남역맛집"].map((tag) => (
                      <span key={tag} className="text-[9px] text-[#08a600]">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Value Props */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#4F46E5] mb-4">{t("howItWorks.whyLogos")}</p>
            <h2 className="text-3xl md:text-[38px] font-extrabold text-gray-900 leading-[1.25] mb-14 whitespace-pre-line">
              {t("howItWorks.title")}
            </h2>

            <div className="space-y-8">
              {([0, 1, 2, 3, 4] as const).map((idx) => ({
                num: t(`howItWorks.items.${idx}.num`),
                title: t(`howItWorks.items.${idx}.title`),
                desc: t(`howItWorks.items.${idx}.desc`),
              })).map((item) => (
                <div key={item.num} className="flex gap-5 group">
                  <span className="text-2xl font-extrabold text-gray-200 group-hover:text-[#4F46E5] transition-colors mt-0.5 font-[var(--font-poppins)]">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t("pricing.title")}</h2>
          <p className="text-sm text-gray-500 mb-10">
            {t("pricing.subtitle")}<br />
            <span className="text-gray-900 font-medium">{t("pricing.subtitleBold")}</span>
          </p>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-0 border border-gray-200 rounded-2xl overflow-hidden">
            {/* Free */}
            <div className="p-6 border-r border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t("pricing.free.name")}</h3>
              <p className="text-sm text-gray-400 mb-4">{t("pricing.free.desc")}</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">{t("pricing.free.price")}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">{t("pricing.free.period")}</p>
              <button className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg mb-8 text-sm">
                {t("common.startNow")}
              </button>
              <ul className="space-y-4">
                {([0, 1, 2, 3] as const).map((idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">{t(`pricing.free.features.${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Starter */}
            <div className="p-6 border-r border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t("pricing.starter.name")}</h3>
              <p className="text-sm text-gray-400 mb-4">{t("pricing.starter.desc")}</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">{t("pricing.starter.price")}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">{t("pricing.starter.period")}</p>
              <button
                onClick={() => handlePurchase("starter")}
                disabled={isProcessing}
                className="w-full py-3 bg-[#4F46E5] text-white font-medium rounded-lg hover:bg-[#4338CA] active:scale-[0.98] transition-all mb-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? t("common.processing") : t("common.purchase")}
              </button>
              <ul className="space-y-4">
                {([0, 1, 2, 3, 4] as const).map((idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">{t(`pricing.starter.features.${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="p-6 relative">
              <span className="absolute top-5 right-5 px-2.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-xs font-medium rounded-full">{t("common.recommended")}</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t("pricing.pro.name")}</h3>
              <p className="text-sm text-gray-400 mb-4">{t("pricing.pro.desc")}</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">{t("pricing.pro.price")}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">{t("pricing.pro.period")}</p>
              <button
                onClick={() => handlePurchase("pro")}
                disabled={isProcessing}
                className="w-full py-3 bg-[#4F46E5] text-white font-medium rounded-lg hover:bg-[#4338CA] active:scale-[0.98] transition-all mb-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? t("common.processing") : t("common.purchase")}
              </button>
              <ul className="space-y-4">
                {([0, 1, 2, 3, 4] as const).map((idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">{t(`pricing.pro.features.${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 가치 제안 문구 */}
          <div className="mt-8 p-5 bg-[#f9fafb] rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed text-center">
              {t("pricing.valueProposition")}
            </p>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowLoginModal(false)}
          />

          {/* Modal */}
          <div className="relative z-10 bg-white rounded-2xl p-8 w-full max-w-sm mx-4 shadow-xl">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-7 w-7" />
              <span className="text-[22px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{t("login.title")}</h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              {t("login.subtitle")}
            </p>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Kakao Login */}
              <button
                onClick={() => handleSocialLogin("kakao")}
                disabled={loginLoading !== null}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#FEE500] text-[#000000] font-medium rounded-lg hover:bg-[#FDD800] transition-colors disabled:opacity-60"
              >
                {loginLoading === "kakao" ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.758 1.819 5.178 4.545 6.545-.2.745-.727 2.702-.832 3.12-.13.52.19.512.4.373.164-.109 2.612-1.771 3.672-2.489.71.099 1.447.151 2.215.151 5.523 0 10-3.463 10-7.714S17.523 3 12 3z"/>
                  </svg>
                )}
                {loginLoading === "kakao" ? t("common.connecting") : t("login.kakao")}
              </button>

              {/* Naver Login */}
              <button
                onClick={() => handleSocialLogin("naver")}
                disabled={loginLoading !== null}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#03C75A] text-white font-medium rounded-lg hover:bg-[#02b350] transition-colors disabled:opacity-60"
              >
                {loginLoading === "naver" ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                  </svg>
                )}
                {loginLoading === "naver" ? t("common.connecting") : t("login.naver")}
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-400 text-center mt-6">
              {t("login.terms")}<a href="#" className="underline">{t("login.termsOfService")}</a>{t("login.and")}<a href="#" className="underline">{t("login.privacyPolicy")}</a>{t("login.termsEnd")}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
