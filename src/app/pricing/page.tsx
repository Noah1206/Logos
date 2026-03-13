"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslation } from "@/i18n";
import LanguageToggle from "@/components/LanguageToggle";

export default function PricingPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const user = session?.user;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [notifyDone, setNotifyDone] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const handleNotify = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setNotifyLoading(true);
    try {
      await fetch("/api/payment/notify", { method: "POST" });
      setNotifyDone(true);
    } catch {
      alert("알림 신청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleSocialLogin = (provider: "kakao" | "naver") => {
    setLoginLoading(provider);
    signIn(provider, { callbackUrl: "/pricing" });
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-7 w-7 translate-y-[3px]" />
              <span className="text-[22px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
            </a>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Pricing Content */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              {t("pricing.title")}
            </h1>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              {t("pricing.subtitle")}
            </p>
            <p className="text-sm text-gray-900 font-semibold mt-1">
              {t("pricing.subtitleBold")}
            </p>
          </div>

          {/* 결제 점검 안내 */}
          <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-sm font-semibold text-amber-800">
              결제 시스템 점검 중입니다
            </p>
            <p className="text-xs text-amber-600 mt-1.5">
              빠른 시일 내에 결제가 가능하도록 준비 중이에요. 조금만 기다려주세요!
            </p>
            {notifyDone ? (
              <p className="mt-3 text-xs font-semibold text-green-700">
                알림 신청 완료! 결제가 가능해지면 알려드릴게요.
              </p>
            ) : (
              <button
                onClick={handleNotify}
                disabled={notifyLoading}
                className="mt-3 px-5 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {notifyLoading ? "신청 중..." : "결제 가능 시 알림 받기"}
              </button>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-0 border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            {/* Free */}
            <div className="p-5 md:p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {t("pricing.free.name")}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {t("pricing.free.desc")}
              </p>
              <div className="mb-1">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  {t("pricing.free.price")}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                {t("pricing.free.period")}
              </p>
              <a
                href="/"
                className="block w-full py-2.5 bg-gray-900 text-white font-semibold rounded-lg text-center text-sm hover:bg-gray-800 transition-colors"
              >
                {t("common.startNow")}
              </a>
              <ul className="space-y-2.5 mt-6">
                {([0, 1, 2, 3] as const).map((idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5 text-sm">✓</span>
                    <span className="text-xs text-gray-600">
                      {t(`pricing.free.features.${idx}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Starter */}
            <div className="p-5 md:p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {t("pricing.starter.name")}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {t("pricing.starter.desc")}
              </p>
              <div className="mb-1">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  {t("pricing.starter.price")}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                {t("pricing.starter.period")}
              </p>
              {notifyDone ? (
                <div className="w-full py-2.5 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-lg text-sm text-center">
                  알림 신청 완료
                </div>
              ) : (
                <button
                  onClick={handleNotify}
                  disabled={notifyLoading}
                  className="w-full py-2.5 bg-[#4F46E5] text-white font-semibold rounded-lg text-sm hover:bg-[#4338CA] transition-colors disabled:opacity-50"
                >
                  {notifyLoading ? "신청 중..." : "알림 받기"}
                </button>
              )}
              <ul className="space-y-2.5 mt-6">
                {([0, 1, 2, 3, 4] as const).map((idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#4F46E5] mt-0.5 text-sm">✓</span>
                    <span className="text-xs text-gray-600">
                      {t(`pricing.starter.features.${idx}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="p-5 md:p-6 relative bg-[#FAFAFE]">
              <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold rounded-full">
                {t("common.recommended")}
              </span>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {t("pricing.pro.name")}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {t("pricing.pro.desc")}
              </p>
              <div className="mb-1">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  {t("pricing.pro.price")}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                {t("pricing.pro.period")}
              </p>
              {notifyDone ? (
                <div className="w-full py-2.5 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-lg text-sm text-center">
                  알림 신청 완료
                </div>
              ) : (
                <button
                  onClick={handleNotify}
                  disabled={notifyLoading}
                  className="w-full py-2.5 bg-[#4F46E5] text-white font-semibold rounded-lg text-sm hover:bg-[#4338CA] transition-colors disabled:opacity-50"
                >
                  {notifyLoading ? "신청 중..." : "알림 받기"}
                </button>
              )}
              <ul className="space-y-2.5 mt-6">
                {([0, 1, 2, 3, 4] as const).map((idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#4F46E5] mt-0.5 text-sm">✓</span>
                    <span className="text-xs text-gray-600">
                      {t(`pricing.pro.features.${idx}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Value Proposition */}
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
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative z-10 bg-white rounded-2xl p-8 w-full max-w-sm mx-4 shadow-xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center justify-center gap-2 mb-6">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-7 w-7" />
              <span className="text-[22px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{t("login.title")}</h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              {t("login.subtitle")}
            </p>

            <div className="space-y-3">
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

            <p className="text-xs text-gray-400 text-center mt-6">
              {t("login.terms")}<a href="#" className="underline">{t("login.termsOfService")}</a>{t("login.and")}<a href="#" className="underline">{t("login.privacyPolicy")}</a>{t("login.termsEnd")}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
