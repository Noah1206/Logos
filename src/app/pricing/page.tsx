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

  const handleSocialLogin = (provider: "kakao" | "naver") => {
    setLoginLoading(provider);
    signIn(provider, { callbackUrl: "/" });
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

      {/* Pricing Content - 무료 안내 */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
            {t("pricing.title")}
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mb-10">
            {t("pricing.subtitle")}
          </p>

          {/* 무료 이용 카드 */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-8 md:p-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-200 rounded-full mb-6">
                <span className="text-green-600 text-sm font-semibold">{t("pricing.freeBadge")}</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{t("pricing.freeTitle")}</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">{t("pricing.freeDesc")}</p>

              <ul className="inline-flex flex-col items-start gap-3 mb-8">
                {([0, 1, 2, 3, 4] as const).map((idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-[#4F46E5]">✓</span>
                    <span className="text-sm text-gray-700">{t(`pricing.freeFeatureList.${idx}`)}</span>
                  </li>
                ))}
              </ul>

              {user ? (
                <a
                  href="/?new"
                  className="inline-block px-8 py-3 bg-[#4F46E5] text-white font-semibold rounded-lg hover:bg-[#4338CA] transition-colors text-sm"
                >
                  {t("pricing.startFreeBtn")}
                </a>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-8 py-3 bg-[#4F46E5] text-white font-semibold rounded-lg hover:bg-[#4338CA] transition-colors text-sm"
                >
                  {t("pricing.loginToStart")}
                </button>
              )}
            </div>
          </div>

          {/* Value Proposition */}
          <div className="mt-8 p-5 bg-[#f9fafb] rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed">
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
