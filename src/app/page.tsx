"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePayment } from "@/hooks/usePayment";

type ConvertMode = "video-to-blog" | "feed-to-blog" | "blog-to-video";

export default function Home() {
  const [url, setUrl] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [platform, setPlatform] = useState<"youtube" | "instagram">("instagram");
  const [isConverting, setIsConverting] = useState(false);
  const [mode, setMode] = useState<ConvertMode>("video-to-blog");
  const [blogContent, setBlogContent] = useState("");
  const [videoStyle, setVideoStyle] = useState("");
  const [blogTone, setBlogTone] = useState<"일상" | "자영업자">("일상");

  const { data: session, status, update: updateSession } = useSession();
  const isAuthLoading = status === "loading";
  const user = session?.user;

  const { purchasePackage, isProcessing } = usePayment({
    onSuccess: (credits) => {
      alert(`결제가 완료되었습니다! 현재 크레딧: ${credits}회`);
      updateSession();
    },
    onError: (error) => {
      if (!error.includes("취소")) {
        alert(`결제 오류: ${error}`);
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

  const handleSocialLogin = (provider: "kakao" | "naver") => {
    setLoginLoading(provider);
    signIn(provider, { callbackUrl: "/" });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleConvert = () => {
    if (isConverting) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (mode === "blog-to-video") {
      if (!blogContent.trim()) return;
      setIsConverting(true);
      sessionStorage.setItem("blog-to-video-content", blogContent);
      sessionStorage.setItem("blog-to-video-style", videoStyle);
      setTimeout(() => {
        window.location.href = `/result?mode=blog-to-video`;
      }, 600);
    } else {
      if (!url.trim()) return;
      setIsConverting(true);
      setTimeout(() => {
        window.location.href = `/result?url=${encodeURIComponent(url)}&tone=${encodeURIComponent(blogTone)}`;
      }, 600);
    }
  };


  return (
    <main className="min-h-screen bg-white">
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
              <nav className="hidden md:flex items-center">
                <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">요금제</a>
              </nav>
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.name || user.email?.split("@")[0]}님
                  </span>
                  <span className="px-2 py-1 bg-[#EEF2FF] text-[#4F46E5] text-xs rounded font-medium">
                    {user.credits}회 남음
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    로그아웃
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
            {mode === "video-to-blog" && (<>영상 하나로<br /><span className="relative inline-block"><span className="relative z-10">블로그 글 완성</span><span className="absolute bottom-1 left-0 w-full h-3 md:h-4 bg-[#C7D2FE] -z-0"></span></span></>)}
            {mode === "feed-to-blog" && (<>인스타 피드를<br /><span className="relative inline-block"><span className="relative z-10">블로그 글로</span><span className="absolute bottom-1 left-0 w-full h-3 md:h-4 bg-[#C7D2FE] -z-0"></span></span></>)}
            {mode === "blog-to-video" && (<>블로그 글을<br /><span className="relative inline-block"><span className="relative z-10">숏폼 영상으로</span><span className="absolute bottom-1 left-0 w-full h-3 md:h-4 bg-[#C7D2FE] -z-0"></span></span></>)}
          </h1>

          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            {mode === "video-to-blog" && (<>쇼츠/릴스 링크만 넣으면 AI가 네이버 블로그 SEO 최적화 글로 자동 변환합니다.<br />블로그 대행사 비용의 1/10, 변환 시간은 1분 이내. 자영업자를 위한 블로그 자동화 도구입니다.</>)}
            {mode === "feed-to-blog" && (<>인스타그램 사진 게시물 링크만 넣으면 AI가 네이버 블로그 SEO 글로 자동 변환합니다.<br />사진 1장부터 캐러셀까지 모두 지원, 텍스트 없는 이미지도 OK.</>)}
            {mode === "blog-to-video" && (<>블로그 글을 넣으면 AI가 15초 릴스/쇼츠 영상으로 자동 변환합니다.<br />LOGOS AI가 블로그 내용을 분석해 매력적인 세로형 영상을 생성합니다.</>)}
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
            무료로 시작하기
          </button>

          {/* Convert Section */}
          <div className="max-w-2xl mx-auto mb-20">
            {/* 모드 선택 탭 */}
            <div className="flex justify-center gap-2 mb-6">
              {([
                { key: "video-to-blog" as ConvertMode, label: "영상 → 블로그", disabled: false },
                { key: "feed-to-blog" as ConvertMode, label: "피드 → 블로그", disabled: false },
                { key: "blog-to-video" as ConvertMode, label: "블로그 → 숏폼", disabled: true },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => !tab.disabled && setMode(tab.key)}
                  disabled={tab.disabled}
                  className={`relative px-5 py-2.5 rounded-full transition-all text-sm font-medium ${
                    tab.disabled
                      ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                      : mode === tab.key
                        ? "bg-[#4F46E5] text-white"
                        : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {tab.label}
                  {tab.disabled && (
                    <span className="ml-1.5 text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">테스트중</span>
                  )}
                </button>
              ))}
            </div>

            {/* 톤 선택 (video-to-blog, feed-to-blog 공통) */}
            {(mode === "video-to-blog" || mode === "feed-to-blog") && (
              <div className="flex justify-center gap-2 mb-4">
                {([
                  { key: "일상" as const, label: "일상", desc: "감성 브이로그 스타일" },
                  { key: "자영업자" as const, label: "자영업자", desc: "매장 홍보 스타일" },
                ] as const).map((tone) => (
                  <button
                    key={tone.key}
                    onClick={() => setBlogTone(tone.key)}
                    className={`px-4 py-2 rounded-full transition-all text-sm font-medium border ${
                      blogTone === tone.key
                        ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {tone.label}
                    <span className={`ml-1.5 text-[10px] ${blogTone === tone.key ? "text-indigo-200" : "text-gray-400"}`}>
                      {tone.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}

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
                    유튜브
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
                    인스타그램
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
                  <span className="text-[#4F46E5] font-medium">무료 1회</span> 체험 가능 · 로그인 없이 바로 사용
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
                  사진 1장~캐러셀 모두 지원 · 텍스트 없는 이미지도 OK
                </p>
              </>
            )}

            {/* blog-to-video: textarea + 스타일 선택 */}
            {mode === "blog-to-video" && (
              <>
                <div
                  className={`transition-all duration-300 ${
                    isConverting ? "scale-[0.97] opacity-70" : ""
                  }`}
                >
                  <textarea
                    id="hero-blog-input"
                    rows={8}
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    disabled={isConverting}
                    placeholder="블로그 글 내용을 붙여넣으세요..."
                    className={`w-full px-5 py-4 border rounded-xl focus:outline-none text-base resize-none transition-all duration-300 ${
                      isConverting ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-gray-900 placeholder-gray-400"
                    }`}
                  />
                  {/* 스타일 선택 칩 */}
                  <div className="flex justify-center gap-2 mt-4 mb-4">
                    {([
                      { key: "감성", label: "감성" },
                      { key: "활기", label: "활기" },
                      { key: "정보", label: "정보" },
                    ]).map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setVideoStyle(videoStyle === s.key ? "" : s.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          videoStyle === s.key
                            ? "bg-[#4F46E5] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {/* 변환 버튼 */}
                  <button
                    onClick={handleConvert}
                    disabled={!blogContent.trim() || isConverting}
                    className={`w-full py-3 rounded-xl font-medium text-base transition-all duration-300 disabled:cursor-not-allowed ${
                      isConverting
                        ? "bg-gray-300 text-white"
                        : blogContent.trim()
                          ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:scale-[0.98]"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isConverting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        변환 중...
                      </span>
                    ) : (
                      "영상 생성하기 →"
                    )}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  LOGOS AI가 15초 세로 영상을 자동 생성
                </p>
              </>
            )}
          </div>

          {/* Reels Preview Images - 3 Steps (video-to-blog 모드에서만 표시) */}
          {mode === "video-to-blog" && (
            <>
              <div className="flex justify-center items-center gap-14 mb-10">
                <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                  <p className="text-lg text-gray-600 mb-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">STEP 1.</span> 관심있는 릴스 찾기
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
                    <span className="font-semibold text-gray-900">STEP 2.</span> 영상 링크 복사하기
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
                  <span className="font-semibold text-[#4F46E5]">STEP 3.</span> 링크 붙여넣기
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
            <span className="text-sm font-semibold text-[#E5704F] tracking-wider uppercase">Problem</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">사장님들의 고민</h2>
            <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto">
              영상 콘텐츠는 열심히 만드는데, 블로그 마케팅까지 신경 쓸 여유가 없는 사장님들의 고민이 있었어요.
            </p>
          </div>

          {/* Category 1 */}
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 bg-[#f0fdf4] text-[#16a34a] text-sm font-medium rounded-full border border-[#bbf7d0]">
              영상은 올리는데 블로그는 못 하는 사장님
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 mb-12 scrollbar-hide">
            {[
              {
                emoji: "😤",
                quote: "\"블로그 글 쓸 시간이 없어요\"",
                desc: "하루 종일 매장 운영하느라 바쁜데, 블로그까지 관리할 여력이 없어요.",
                points: ["매장 운영만으로도 하루가 부족해요", "글 쓰는 게 너무 어려워요", "대행사 맡기자니 비용이 부담돼요"],
              },
              {
                emoji: "😰",
                quote: "\"대행사 비용이 너무 비싸요\"",
                desc: "블로그 대행 월 30~50만 원... 소규모 자영업자한테는 큰 부담이에요.",
                points: ["월 고정 비용이 부담돼요", "효과가 있는지 모르겠어요", "더 저렴한 방법이 없을까요"],
              },
              {
                emoji: "😣",
                quote: "\"영상은 찍는데 글로 못 바꿔요\"",
                desc: "쇼츠나 릴스로 영상은 올리는데, 같은 내용을 블로그로 옮기는 건 또 다른 일이에요.",
                points: ["영상 촬영은 익숙해요", "글로 옮기면 느낌이 달라요", "매번 새로 쓰기 귀찮아요"],
              },
              {
                emoji: "😫",
                quote: "\"꾸준히 올리기 힘들어요\"",
                desc: "블로그는 꾸준함이 생명인데, 일주일에 한 번 올리기도 버거워요.",
                points: ["매번 글감 찾기가 어려워요", "한 편 쓰는데 1시간 넘게 걸려요", "자동화할 수 있으면 좋겠어요"],
              },
            ].map((item, i) => (
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
              블로그 마케팅이 필요한 사장님
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
            {[
              {
                emoji: "😥",
                quote: "\"네이버 검색에 안 나와요\"",
                desc: "블로그를 운영하고 있지만 상위 노출이 안 돼서 효과가 없어요.",
                points: ["SEO가 뭔지 모르겠어요", "글을 써도 방문자가 없어요", "상위 노출 방법을 모르겠어요"],
              },
              {
                emoji: "😩",
                quote: "\"글 퀄리티가 낮아요\"",
                desc: "직접 쓰면 어색하고, 대행사 글은 우리 가게 느낌이 안 나요.",
                points: ["문장력이 부족해요", "업종에 맞는 톤을 모르겠어요", "전문적인 글이 필요해요"],
              },
              {
                emoji: "😓",
                quote: "\"경쟁 업체는 다 하는데...\"",
                desc: "주변 가게들은 블로그 마케팅으로 손님이 느는데, 나만 뒤처지는 것 같아요.",
                points: ["경쟁 업체 블로그가 상위에 있어요", "우리도 해야 하는 건 아는데...", "어디서부터 시작해야 할지 막막해요"],
              },
              {
                emoji: "😮‍💨",
                quote: "\"영상 콘텐츠 활용을 못 해요\"",
                desc: "쇼츠나 릴스에 좋은 콘텐츠가 많은데, 블로그용으로 재활용하는 법을 몰라요.",
                points: ["영상 따로, 블로그 따로 만들어야 해요", "같은 콘텐츠를 두 번 작업해요", "효율적인 방법이 필요해요"],
              },
            ].map((item, i) => (
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
            <p className="text-sm font-semibold text-[#4F46E5] mb-4">왜 LOGOS.ai인가요?</p>
            <h2 className="text-3xl md:text-[38px] font-extrabold text-gray-900 leading-[1.25] mb-14">
              영상 한 편이<br />
              매출로 이어지는 구조
            </h2>

            <div className="space-y-8">
              {[
                {
                  num: "01",
                  title: "말을 글로, 정확하게",
                  desc: "AI 음성 인식이 영상 속 모든 내용을 빠짐없이 텍스트로 변환합니다.",
                },
                {
                  num: "02",
                  title: "네이버가 좋아하는 글 구조",
                  desc: "소제목, 이모지, 단락 배치까지 — 상위 노출에 최적화된 포맷을 자동 생성합니다.",
                },
                {
                  num: "03",
                  title: "내 업종에 딱 맞는 톤",
                  desc: "학원, 헬스장, 맛집 등 업종별로 자연스러운 블로그 문체를 적용합니다.",
                },
                {
                  num: "04",
                  title: "대행사 비용의 1/10",
                  desc: "월 수십만 원 대행비 대신, 건당 580원부터. 현업에 집중하세요.",
                },
                {
                  num: "05",
                  title: "링크 하나, 1분이면 끝",
                  desc: "복잡한 설정 없이 영상 URL만 붙여넣으면 바로 블로그 글이 완성됩니다.",
                },
              ].map((item) => (
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">요금제</h2>
          <p className="text-sm text-gray-500 mb-10">
            건당 1,000원도 안 되는 돈으로 1시간 걸릴 블로그 포스팅을 끝낸다?<br />
            <span className="text-gray-900 font-medium">현업이 바쁜 사장님들은 무조건 결제합니다.</span>
          </p>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-0 border border-gray-200 rounded-2xl overflow-hidden">
            {/* 무료 테스터 */}
            <div className="p-6 border-r border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">무료 테스터</h3>
              <p className="text-sm text-gray-400 mb-4">성능을 직접 확인해보세요</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">₩0</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">신용카드 불필요</p>
              <button className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg mb-8 text-sm">
                지금 시작하기
              </button>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">최초 가입 시 1회 무료 변환</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">유튜브 쇼츠 지원</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">네이버 블로그 SEO 글 생성</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">결과물 복사 기능</span>
                </li>
              </ul>
            </div>

            {/* 스타터 팩 */}
            <div className="p-6 border-r border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">스타터 팩</h3>
              <p className="text-sm text-gray-400 mb-4">가볍게 시작하는 블로그 마케팅</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">₩9,900</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">10건 · 건당 ₩990</p>
              <button
                onClick={() => handlePurchase("starter")}
                disabled={isProcessing}
                className="w-full py-3 bg-[#4F46E5] text-white font-medium rounded-lg hover:bg-[#4338CA] active:scale-[0.98] transition-all mb-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "처리 중..." : "구매하기"}
              </button>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">10건 변환 크레딧</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">유튜브 + 인스타 릴스 지원</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">SEO 키워드 최적화</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">변환 히스토리 저장</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">만료 기간 없음</span>
                </li>
              </ul>
            </div>

            {/* 프로 팩 */}
            <div className="p-6 relative">
              <span className="absolute top-5 right-5 px-2.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-xs font-medium rounded-full">추천</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">프로 팩</h3>
              <p className="text-sm text-gray-400 mb-4">자영업자분들께 가장 인기 있는</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-gray-900">₩29,000</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">50건 · 건당 ₩580</p>
              <button
                onClick={() => handlePurchase("pro")}
                disabled={isProcessing}
                className="w-full py-3 bg-[#4F46E5] text-white font-medium rounded-lg hover:bg-[#4338CA] active:scale-[0.98] transition-all mb-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "처리 중..." : "구매하기"}
              </button>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">50건 변환 크레딧</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">유튜브 + 인스타 릴스 지원</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">고급 SEO + 톤/스타일 커스터마이징</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">변환 히스토리 저장</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">만료 기간 없음 + 우선 지원</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 가치 제안 문구 */}
          <div className="mt-8 p-5 bg-[#f9fafb] rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed text-center">
              블로그 대행사 월 수십만 원 vs LOGOS.ai 건당 <span className="font-semibold text-gray-900">₩580~990</span> —
              자신의 분야 현업에 집중해야 하는 사장님들께 <span className="font-semibold text-[#4F46E5]">가장 합리적인 선택</span>입니다.
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
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">로그인</h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              간편하게 로그인하고 서비스를 이용하세요
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
                {loginLoading === "kakao" ? "연결 중..." : "카카오로 시작하기"}
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
                {loginLoading === "naver" ? "연결 중..." : "네이버로 시작하기"}
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-400 text-center mt-6">
              로그인 시 <a href="#" className="underline">이용약관</a> 및 <a href="#" className="underline">개인정보처리방침</a>에 동의하게 됩니다.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
