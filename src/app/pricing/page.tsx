"use client";

import { useSession, signIn } from "next-auth/react";
import { usePayment } from "@/hooks/usePayment";
import { useTranslation } from "@/i18n";
import LanguageToggle from "@/components/LanguageToggle";

export default function PricingPage() {
  const { t } = useTranslation();
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;

  const { purchasePackage, isProcessing } = usePayment({
    onSuccess: (credits) => {
      alert(t("payment.completed", { credits }));
      updateSession();
    },
    onError: (error) => {
      if (error !== "cancelled") {
        alert(t("payment.error", { error }));
      }
    },
  });

  const handlePurchase = (packageId: string) => {
    if (!user) {
      signIn();
      return;
    }
    purchasePackage(packageId);
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
              <button
                onClick={() => handlePurchase("starter")}
                disabled={isProcessing}
                className="w-full py-2.5 bg-[#4F46E5] text-white font-semibold rounded-lg text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? t("common.processing") : t("common.purchase")}
              </button>
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
              <button
                onClick={() => handlePurchase("pro")}
                disabled={isProcessing}
                className="w-full py-2.5 bg-[#4F46E5] text-white font-semibold rounded-lg text-sm hover:bg-[#4338CA] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? t("common.processing") : t("common.purchase")}
              </button>
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
    </main>
  );
}
