"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { data: session, status } = useSession();
  const isAuthLoading = status === "loading";
  const user = session?.user;

  const handleSocialLogin = (provider: "kakao" | "naver") => {
    signIn(provider, { callbackUrl: "/" });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleConvert = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      setTimeout(() => {
        setResult(`## 변환 결과 미리보기

이 기능은 곧 구현될 예정입니다!

입력하신 URL: ${url}

---

### 네이버 블로그 글이 여기에 생성됩니다

- 이모지와 함께 읽기 쉬운 포맷
- SEO 최적화된 키워드 배치
- 체류시간을 높이는 단락 구성`);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    alert("클립보드에 복사되었습니다!");
  };

  return (
    <main className="min-h-screen bg-[#f5f6f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#03C75A] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S2B</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">Shorts2Blog</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-[#03C75A] transition-colors">기능</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-[#03C75A] transition-colors">가격</a>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {isAuthLoading ? (
                <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
              ) : user ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.name || user.email?.split("@")[0]}님
                  </span>
                  <span className="px-2 py-1 bg-[#e8f5e9] text-[#03C75A] text-xs rounded font-medium">
                    {user.credits}회 남음
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 bg-[#03C75A] text-white font-medium rounded-md hover:bg-[#02b350] text-sm transition-colors"
                  >
                    무료로 시작하기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e8f5e9] text-[#03C75A] rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-[#03C75A] rounded-full animate-pulse"></span>
            AI 블로그 변환 서비스
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
            영상 콘텐츠를<br />
            <span className="text-[#03C75A]">매출로 연결</span>하세요
          </h1>

          <p className="text-base text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
            쇼츠/릴스 링크 하나로 네이버 블로그 상위노출용 글이 완성됩니다.<br />
            블로그 대행 맡기지 마세요. <strong className="text-gray-800">월 수십만원 아끼고, 직접 관리하세요.</strong>
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-10">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">1분</p>
              <p className="text-xs text-gray-500">변환 시간</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">990원</p>
              <p className="text-xs text-gray-500">건당 비용</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">SEO</p>
              <p className="text-xs text-gray-500">최적화</p>
            </div>
          </div>
        </div>
      </section>

      {/* Convert Section */}
      <section id="features" className="py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 무료 체험 안내 */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              <span className="text-[#03C75A] font-semibold">무료로 1회</span> 체험해보세요. 로그인 없이 바로 사용 가능합니다.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-900">영상 URL 입력</span>
              <span className="px-2 py-0.5 bg-[#e8f5e9] text-[#03C75A] text-xs rounded font-medium">무료 체험 1회</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="유튜브 쇼츠 또는 인스타 릴스 URL"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03C75A] focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
              />
              <button
                onClick={handleConvert}
                disabled={isLoading || !url.trim()}
                className="px-6 py-3 bg-[#03C75A] text-white font-medium rounded-lg hover:bg-[#02b350] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
              >
                {isLoading ? "변환 중..." : "변환하기"}
              </button>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">YT</span>
                </div>
                <span className="text-xs text-gray-500">유튜브 쇼츠</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">IG</span>
                </div>
                <span className="text-xs text-gray-500">인스타 릴스</span>
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#03C75A] rounded-full"></span>
                  <h3 className="font-medium text-gray-900">변환 결과</h3>
                </div>
                <button onClick={handleCopy} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  복사하기
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-[#f5f6f7] p-4 rounded-lg">{result}</pre>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">이런 분들께 추천해요</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 bg-[#f5f6f7] rounded-xl">
              <div className="w-10 h-10 bg-[#e8f5e9] rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">🏫</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">학원장님</h3>
              <p className="text-sm text-gray-600">수업 영상을 블로그 홍보 글로 변환</p>
            </div>

            <div className="p-5 bg-[#f5f6f7] rounded-xl">
              <div className="w-10 h-10 bg-[#e8f5e9] rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">💪</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">헬스장 관장님</h3>
              <p className="text-sm text-gray-600">운동 팁 영상을 정보성 글로 변환</p>
            </div>

            <div className="p-5 bg-[#f5f6f7] rounded-xl">
              <div className="w-10 h-10 bg-[#e8f5e9] rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">🍽️</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">맛집 사장님</h3>
              <p className="text-sm text-gray-600">메뉴 소개 영상을 맛집 리뷰로 변환</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">합리적인 가격</h2>
            <p className="text-gray-600 text-sm">블로그 대행사 비용의 1/10 수준</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-[#03C75A] text-white" : "text-gray-600 hover:text-gray-900"}`}
              >
                월별
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${billingCycle === "yearly" ? "bg-[#03C75A] text-white" : "text-gray-600 hover:text-gray-900"}`}
              >
                연간
                <span className={`px-1.5 py-0.5 text-[10px] rounded ${billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-[#e8f5e9] text-[#03C75A]"}`}>20% 할인</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Starter */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-1">스타터</h3>
              <p className="text-xs text-gray-500 mb-4">개인 사용자용</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{billingCycle === "monthly" ? "9,900" : "95,000"}</span>
                <span className="text-gray-500 text-base ml-1">{billingCycle === "monthly" ? "원/월" : "원/년"}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["월 10건 변환", "기본 SEO 최적화", "히스토리 저장"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-[#03C75A] text-sm">✓</span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 bg-white text-[#03C75A] font-medium rounded-lg border border-[#03C75A] hover:bg-[#e8f5e9] transition-colors text-sm">
                시작하기
              </button>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-xl p-6 border-2 border-[#03C75A] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-[#03C75A] text-white text-xs font-medium rounded-full">추천</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">프로</h3>
              <p className="text-xs text-gray-500 mb-4">자영업자 추천</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{billingCycle === "monthly" ? "45,000" : "36,000"}</span>
                <span className="text-gray-500 text-base ml-1">원/월</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["월 30건 변환", "고급 SEO 최적화", "스타일 커스터마이징", "우선 지원"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-[#03C75A] text-sm">✓</span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 bg-[#03C75A] text-white font-medium rounded-lg hover:bg-[#02b350] transition-colors text-sm">
                시작하기
              </button>
            </div>

            {/* Business */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-1">비즈니스</h3>
              <p className="text-xs text-gray-500 mb-4">대량 사용자용</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{billingCycle === "monthly" ? "59,000" : "47,200"}</span>
                <span className="text-gray-500 text-base ml-1">원/월</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["월 60건 변환", "건당 800원", "API 제공", "전담 지원"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-[#03C75A] text-sm">✓</span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 bg-white text-[#03C75A] font-medium rounded-lg border border-[#03C75A] hover:bg-[#e8f5e9] transition-colors text-sm">
                시작하기
              </button>
            </div>
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
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm mx-4 shadow-xl">
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
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#03C75A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S2B</span>
                </div>
                <span className="font-bold text-gray-900 text-xl">Shorts2Blog</span>
              </div>
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
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#FEE500] text-[#000000] font-medium rounded-lg hover:bg-[#FDD800] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.758 1.819 5.178 4.545 6.545-.2.745-.727 2.702-.832 3.12-.13.52.19.512.4.373.164-.109 2.612-1.771 3.672-2.489.71.099 1.447.151 2.215.151 5.523 0 10-3.463 10-7.714S17.523 3 12 3z"/>
                </svg>
                카카오로 시작하기
              </button>

              {/* Naver Login */}
              <button
                onClick={() => handleSocialLogin("naver")}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#03C75A] text-white font-medium rounded-lg hover:bg-[#02b350] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                </svg>
                네이버로 시작하기
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
