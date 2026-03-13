"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePayment } from "@/hooks/usePayment";
import { PROMOTION } from "@/lib/promotion";
import { useTranslation } from "@/i18n";
import LanguageToggle from "@/components/LanguageToggle";

type ConvertMode = "video-to-blog" | "feed-to-blog" | "study";

export default function Home() {
  const { t, locale, setLocale } = useTranslation();
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
  const [activeFeatureTab, setActiveFeatureTab] = useState<"blog" | "study" | "feed">("blog");

  // Onboarding path selector
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPhase, setOnboardingPhase] = useState<"idle" | "selected" | "exiting">("idle");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [langSweep, setLangSweep] = useState<"idle" | "ko" | "en">("idle");

  useEffect(() => {
    if (!localStorage.getItem("logos_path_selected")) {
      setShowOnboarding(true);
    }
  }, []);

  // 크롬 확장 등에서 ?url= 쿼리로 진입 시 자동 입력
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillUrl = params.get("url");
    if (prefillUrl) {
      setUrl(decodeURIComponent(prefillUrl));
      setShowOnboarding(false);
    }
  }, []);

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
      {/* ===== Onboarding Path Selector Overlay ===== */}
      {showOnboarding && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-500 ${
            onboardingPhase === "exiting" ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
          }`}
        >
          {/* Frosted glass background - page shows through */}
          <div className="absolute inset-0 backdrop-blur-2xl bg-black/30" />

          {/* Static gradient color overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,10,46,0.55) 0%, rgba(26,17,69,0.45) 25%, rgba(45,27,105,0.4) 50%, rgba(76,29,149,0.35) 75%, rgba(91,33,182,0.3) 100%)" }} />

          {/* Static orbs (no animation) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute rounded-full" style={{ width: 450, height: 450, top: "-10%", right: "-5%", background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)", filter: "blur(100px)" }} />
            <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: "-5%", left: "-5%", background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)", filter: "blur(100px)" }} />
            <div className="absolute rounded-full" style={{ width: 300, height: 300, top: "40%", left: "50%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(217,70,239,0.12), transparent 70%)", filter: "blur(100px)" }} />
          </div>

          {/* Language switch diagonal light sweep */}
          {langSweep !== "idle" && (
            <div key={langSweep} className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
              <div
                className={langSweep === "ko" ? "ob-sweep-down" : "ob-sweep-up"}
              />
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Language toggle */}
            <div className="ob-lang-enter mb-8">
              <button
                onClick={() => {
                  const next = locale === "en" ? "ko" : "en";
                  setLangSweep(next);
                  setTimeout(() => setLocale(next), 1200);
                  setTimeout(() => setLangSweep("idle"), 2400);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.14] hover:border-white/[0.22] transition-all duration-300"
              >
                <span className={`text-xs transition-colors duration-200 ${locale === "ko" ? "text-white font-semibold" : "text-white/40"}`}>KO</span>
                <span className="text-white/20 text-xs">/</span>
                <span className={`text-xs transition-colors duration-200 ${locale === "en" ? "text-white font-semibold" : "text-white/40"}`}>EN</span>
              </button>
            </div>

            {/* Logo with glow */}
            <div className="ob-logo-enter flex items-center gap-2.5 mb-3">
              <div className="relative">
                <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-9 w-9 brightness-0 invert opacity-95 relative z-10" />
                <div className="absolute inset-0 blur-xl bg-white/20 rounded-full scale-150" />
              </div>
              <span className="text-[26px] font-extrabold text-white font-[var(--font-poppins)] tracking-tight drop-shadow-lg">LOGOS.ai</span>
            </div>
            <p className="ob-subtitle-enter text-white/50 text-sm mb-12 tracking-wide">{t("onboarding.subtitle")}</p>

            {/* Cards */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 px-6 max-w-3xl w-full">
              {([
                {
                  mode: "video-to-blog" as ConvertMode,
                  title: t("onboarding.card1.title"),
                  desc: t("onboarding.card1.desc"),
                  gradient: "from-violet-500/20 via-indigo-500/10 to-transparent",
                  glowColor: "rgba(139, 92, 246, 0.12)",
                  borderGradient: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.1), transparent)",
                  icon1: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  ),
                  icon2: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  ),
                },
                {
                  mode: "feed-to-blog" as ConvertMode,
                  title: t("onboarding.card2.title"),
                  desc: t("onboarding.card2.desc"),
                  gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
                  glowColor: "rgba(59, 130, 246, 0.12)",
                  borderGradient: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(6,182,212,0.1), transparent)",
                  icon1: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  ),
                  icon2: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  ),
                },
                {
                  mode: "study" as ConvertMode,
                  title: t("onboarding.card3.title"),
                  desc: t("onboarding.card3.desc"),
                  gradient: "from-fuchsia-500/20 via-pink-500/10 to-transparent",
                  glowColor: "rgba(217, 70, 239, 0.12)",
                  borderGradient: "linear-gradient(135deg, rgba(217,70,239,0.3), rgba(236,72,153,0.1), transparent)",
                  icon1: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  ),
                  icon2: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  ),
                },
              ]).map((card, i) => (
                <button
                  key={card.mode}
                  onClick={() => {
                    if (onboardingPhase !== "idle") return;
                    setSelectedCard(i);
                    setOnboardingPhase("selected");
                    localStorage.setItem("logos_path_selected", card.mode);

                    setTimeout(() => {
                      setOnboardingPhase("exiting");
                      if (card.mode === "study") {
                        setTimeout(() => { window.location.href = "/study"; }, 400);
                      } else {
                        setMode(card.mode);
                        setTimeout(() => { setShowOnboarding(false); }, 400);
                      }
                    }, 700);
                  }}
                  className={`ob-card group relative flex-1 text-left rounded-2xl p-8 pb-7 transition-all duration-500 ${
                    onboardingPhase === "selected" && selectedCard !== i
                      ? "opacity-0 scale-90 blur-sm pointer-events-none"
                      : onboardingPhase === "selected" && selectedCard === i
                      ? "ob-card-selected scale-[1.08]"
                      : ""
                  }`}
                  style={{
                    animationName: "obCardIn",
                    animationDuration: "0.9s",
                    animationTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                    animationFillMode: "both",
                    animationDelay: `${0.35 + i * 0.15}s`,
                  }}
                >
                  {/* Glass card background - double layer for depth */}
                  <div className="absolute inset-0 rounded-2xl backdrop-blur-xl bg-white/[0.06] border border-white/[0.1] group-hover:bg-white/[0.1] group-hover:border-white/[0.2] transition-all duration-500" />
                  {/* Inner gradient glow */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  {/* Top edge shine */}
                  <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                  {/* Bottom glow on hover */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2/3 h-10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: card.glowColor }} />

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-6">
                      <span className="text-white/50 group-hover:text-white/85 transition-colors duration-300">{card.icon1}</span>
                      <svg className="w-3 h-3 text-white/15 group-hover:text-white/35 transition-all duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      <span className="text-white/50 group-hover:text-white/85 transition-colors duration-300">{card.icon2}</span>
                    </div>
                    <h3 className="text-base font-bold text-white/85 mb-2 group-hover:text-white transition-colors duration-300">{card.title}</h3>
                    <p className="text-sm text-white/35 leading-relaxed group-hover:text-white/50 transition-colors duration-300">{card.desc}</p>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            {/* Skip link */}
            <button
              onClick={() => {
                localStorage.setItem("logos_path_selected", "video-to-blog");
                setOnboardingPhase("exiting");
                setTimeout(() => setShowOnboarding(false), 400);
              }}
              className="ob-skip-enter mt-10 text-xs text-white/20 hover:text-white/45 transition-colors duration-300 tracking-wider"
            >
              {t("onboarding.skip")}
            </button>
          </div>

          {/* Keyframe animations — elements only, no background movement */}
          <style>{`
            .ob-sweep-down, .ob-sweep-up {
              position: absolute;
              width: 100%;
              height: 250%;
              left: 0;
              background: linear-gradient(
                180deg,
                transparent 0%,
                transparent 36%,
                rgba(255,255,255,0.04) 38%,
                rgba(255,255,255,0.15) 42%,
                rgba(255,255,255,0.4) 46%,
                rgba(255,255,255,0.7) 49%,
                rgba(255,255,255,0.85) 50%,
                rgba(255,255,255,0.7) 51%,
                rgba(255,255,255,0.4) 54%,
                rgba(255,255,255,0.15) 58%,
                rgba(255,255,255,0.04) 62%,
                transparent 64%,
                transparent 100%
              );
              opacity: 0;
            }
            .ob-sweep-down {
              animation: obSweepDown 2.4s ease both;
            }
            .ob-sweep-up {
              animation: obSweepUp 2.4s ease both;
            }
            @keyframes obSweepDown {
              0%   { transform: translateY(-100%); opacity: 0; }
              20%  { opacity: 0.4; }
              40%  { opacity: 1; }
              60%  { opacity: 1; }
              80%  { opacity: 0.4; }
              100% { transform: translateY(100%); opacity: 0; }
            }
            @keyframes obSweepUp {
              0%   { transform: translateY(100%); opacity: 0; }
              20%  { opacity: 0.4; }
              40%  { opacity: 1; }
              60%  { opacity: 1; }
              80%  { opacity: 0.4; }
              100% { transform: translateY(-100%); opacity: 0; }
            }
            .ob-lang-enter {
              animation: obLangIn 0.9s cubic-bezier(0.22,1,0.36,1) both;
            }
            @keyframes obLangIn {
              0% { opacity: 0; transform: translateY(-30px) scale(0.8); filter: blur(4px); }
              60% { opacity: 1; filter: blur(0); }
              80% { transform: translateY(3px) scale(1.02); }
              100% { transform: translateY(0) scale(1); }
            }
            .ob-logo-enter {
              animation: obLogoIn 1s cubic-bezier(0.22,1,0.36,1) 0.1s both;
            }
            @keyframes obLogoIn {
              0% { opacity: 0; transform: translateY(-40px) scale(0.7) rotate(-5deg); filter: blur(6px); }
              50% { opacity: 1; filter: blur(0); }
              75% { transform: translateY(4px) scale(1.04) rotate(0.5deg); }
              100% { transform: translateY(0) scale(1) rotate(0); }
            }
            .ob-subtitle-enter {
              animation: obSubIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s both;
            }
            @keyframes obSubIn {
              0% { opacity: 0; transform: translateY(20px); filter: blur(4px); letter-spacing: 0.3em; }
              60% { opacity: 1; filter: blur(0); }
              100% { transform: translateY(0); letter-spacing: 0.05em; }
            }
            @keyframes obCardIn {
              0% { opacity: 0; transform: translateY(60px) scale(0.85) rotateX(8deg); filter: blur(6px); }
              50% { opacity: 1; filter: blur(0); }
              80% { transform: translateY(-4px) scale(1.02) rotateX(-1deg); }
              100% { transform: translateY(0) scale(1) rotateX(0); }
            }
            .ob-card {
              transform-style: preserve-3d;
              perspective: 800px;
              transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease;
            }
            .ob-card:hover {
              transform: translateY(-8px) scale(1.02);
              box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }
            .ob-card:active {
              transform: translateY(-2px) scale(0.98);
              transition-duration: 0.15s;
            }
            .ob-card-selected {
              box-shadow: 0 0 50px rgba(139, 92, 246, 0.3), 0 0 100px rgba(139, 92, 246, 0.1);
              animation: obCardPulse 0.6s ease-in-out;
            }
            @keyframes obCardPulse {
              0% { transform: scale(1); }
              30% { transform: scale(1.1); }
              60% { transform: scale(1.06); }
              100% { transform: scale(1.08); }
            }
            .ob-skip-enter {
              animation: obSkipIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.8s both;
            }
            @keyframes obSkipIn {
              0% { opacity: 0; transform: translateY(12px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

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
                <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t("nav.pricing")}</a>
              </nav>
              <LanguageToggle />
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                  <span className="px-2 py-1 text-xs rounded font-medium bg-[#EEF2FF] text-[#4F46E5]">
                    {t("common.free")}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#4F46E5] rounded-full hover:bg-[#4338CA] transition-colors"
                >
                  {t("common.login")}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-14 pb-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          {/* 정식 출시 기념 배너 */}
          <div className="relative inline-block mb-14 animate-[bannerPulse_2s_ease-in-out_infinite]">
            <div className="px-7 py-3.5 bg-[#4F46E5] rounded-2xl shadow-lg shadow-indigo-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">🎉</span>
                <div className="text-left">
                  <p className="text-white font-bold text-base md:text-lg tracking-tight">정식 출시 기념 · 7일 무료체험</p>
                  <p className="text-indigo-200 text-xs md:text-sm">로그인만 하면 7일간 무제한 사용</p>
                </div>
              </div>
            </div>
          </div>
          <style jsx>{`
            @keyframes bannerPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.03); }
            }
          `}</style>

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

          {/* Feature Showcase */}
          <div className="mt-20 mb-10">
            {/* Section Header */}
            <div className="text-center mb-10">
              <span className="text-sm font-semibold text-[#4F46E5] tracking-wider uppercase">{t("features.label")}</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">{t("features.title")}</h2>
              <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto">{t("features.subtitle")}</p>
            </div>

            {/* Pill Tabs */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1">
                {(["blog", "study", "feed"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFeatureTab(tab)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeFeatureTab === tab
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t(`features.tabs.${tab}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Cards - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Left Card - Lime/Green accent mockup */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-[#f0fdf4] p-6 min-h-[280px] flex items-center justify-center">
                  {activeFeatureTab === "blog" && (
                    <div className="w-full max-w-[320px] space-y-3">
                      {/* URL Input Mock */}
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/></svg>
                          </div>
                          <span className="text-[11px] text-gray-400 truncate">youtube.com/shorts/xK2d9f...</span>
                        </div>
                        <div className="h-1 bg-[#4F46E5] rounded-full w-2/3" />
                      </div>
                      {/* Arrow */}
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        </div>
                      </div>
                      {/* Blog Output Mock */}
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="px-1.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[9px] font-bold rounded">SEO</span>
                          <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded">Done</span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-800 mb-1">[강남 맛집] 웨이팅 없이 즐기는 오마카세</div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                          <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
                          <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
                        </div>
                      </div>
                    </div>
                  )}
                  {activeFeatureTab === "study" && (
                    <div className="w-full max-w-[320px] space-y-3">
                      {/* Study Note Mock */}
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold rounded">AI</span>
                          <span className="text-[10px] font-medium text-gray-700">Executive Summary</span>
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                          <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
                        </div>
                        <div className="text-[10px] font-medium text-gray-700 mb-1.5">Key Concepts</div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] rounded-full">High</span>
                          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[9px] rounded-full">Medium</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] rounded-full">Low</span>
                        </div>
                      </div>
                      {/* Practice Questions Mock */}
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="text-[10px] font-medium text-gray-700 mb-1.5">Practice Questions</div>
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-1.5">
                            <span className="text-[9px] text-[#4F46E5] font-bold mt-0.5">Q1</span>
                            <div className="h-1.5 bg-gray-100 rounded-full w-full mt-1" />
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-[9px] text-[#4F46E5] font-bold mt-0.5">Q2</span>
                            <div className="h-1.5 bg-gray-100 rounded-full w-4/5 mt-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeFeatureTab === "feed" && (
                    <div className="w-full max-w-[320px] space-y-3">
                      {/* Instagram Feed Mock */}
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
                          <span className="text-[10px] font-medium text-gray-700">@my_business</span>
                        </div>
                        <div className="aspect-square bg-gradient-to-br from-pink-50 to-orange-50 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-3xl">📸</span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                          <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        </div>
                      </div>
                      {/* Blog Output */}
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="px-1.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[9px] font-bold rounded">SEO</span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                          <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 text-[15px] mb-1">{t(`features.${activeFeatureTab}.leftTitle`)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(`features.${activeFeatureTab}.leftDesc`)}</p>
                </div>
              </div>

              {/* Right Card - White background preview */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-50 p-6 min-h-[280px] flex items-center justify-center">
                  {activeFeatureTab === "blog" && (
                    <div className="w-full max-w-[300px]">
                      {/* Naver Blog Preview Mini */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="text-center pt-3">
                          <span className="text-[9px] text-[#08a600]">강남맛보기</span>
                        </div>
                        <h4 className="text-center text-[12px] font-bold text-gray-900 px-3 pt-1 pb-2 leading-snug">
                          [강남 맛집 추천] 웨이팅 없이<br />즐기는 프리미엄 오마카세
                        </h4>
                        <div className="px-3 pb-2">
                          <p className="text-[9px] text-gray-600 leading-[1.8] text-center">
                            안녕하세요 여러분! 😊<br />
                            오늘은 강남역 근처에서 찾은<br />
                            <span className="font-semibold text-gray-800">숨겨진 오마카세 맛집</span>을 소개합니다!
                          </p>
                        </div>
                        <div className="px-3 pb-1.5">
                          <p className="text-[9px] font-bold text-gray-800 mb-1">🍽️ 메뉴 & 가격</p>
                          <div className="space-y-1">
                            <div className="h-1 bg-gray-100 rounded-full w-full" />
                            <div className="h-1 bg-gray-100 rounded-full w-4/5" />
                          </div>
                        </div>
                        <div className="px-3 pb-1.5">
                          <p className="text-[9px] font-bold text-gray-800 mb-1">📍 위치 & 영업시간</p>
                          <div className="space-y-1">
                            <div className="h-1 bg-gray-100 rounded-full w-full" />
                            <div className="h-1 bg-gray-100 rounded-full w-3/5" />
                          </div>
                        </div>
                        <div className="px-3 pt-1.5 pb-2.5 flex flex-wrap gap-1">
                          {["#강남맛집", "#오마카세", "#데이트코스"].map((tag) => (
                            <span key={tag} className="text-[8px] text-[#08a600]">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {activeFeatureTab === "study" && (
                    <div className="w-full max-w-[320px] space-y-3">
                      {/* YouTube to Study Note flow */}
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/></svg>
                          <span className="text-[10px] text-gray-500 truncate">30-min lecture video</span>
                        </div>
                        <div className="flex justify-center my-1.5">
                          <svg className="w-4 h-4 text-[#4F46E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold rounded">AI</span>
                          <span className="text-[10px] text-gray-500">5-page study notes</span>
                        </div>
                      </div>
                      {/* PDF to Study Note flow */}
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <span className="text-[10px] text-gray-500 truncate">textbook-ch3.pdf</span>
                        </div>
                        <div className="flex justify-center my-1.5">
                          <svg className="w-4 h-4 text-[#4F46E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold rounded">AI</span>
                          <span className="text-[10px] text-gray-500">Concepts + Questions</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeFeatureTab === "feed" && (
                    <div className="w-full max-w-[300px]">
                      {/* SEO Result Preview */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-3">
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="px-1.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[9px] font-bold rounded">SEO</span>
                          <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded">98점</span>
                        </div>
                        <div className="space-y-2.5">
                          <div>
                            <p className="text-[9px] text-gray-400 mb-0.5">Title</p>
                            <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 mb-0.5">Body</p>
                            <div className="space-y-1">
                              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                              <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
                              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                              <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 mb-1">Keywords</p>
                            <div className="flex flex-wrap gap-1">
                              {["#맛집", "#카페", "#데이트", "#강남"].map((tag) => (
                                <span key={tag} className="text-[8px] text-[#08a600] bg-green-50 px-1.5 py-0.5 rounded">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 text-[15px] mb-1">{t(`features.${activeFeatureTab}.rightTitle`)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(`features.${activeFeatureTab}.rightDesc`)}</p>
                </div>
              </div>
            </div>
          </div>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#4F46E5] mb-4">{t("howItWorks.whyLogos")}</p>
            <h2 className="text-3xl md:text-[38px] font-extrabold text-gray-900 leading-[1.25] whitespace-pre-line">
              {t("howItWorks.title")}
            </h2>
          </div>

          {/* Value Props - full width centered */}
          <div className="space-y-8 max-w-2xl mx-auto">
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

              {/* Naver Login (비활성) */}
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#03C75A]/40 text-white/60 font-medium rounded-lg cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                </svg>
                {t("login.naver")}
                <span className="text-xs opacity-70">(준비중)</span>
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
