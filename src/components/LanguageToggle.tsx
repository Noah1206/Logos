"use client";

import { useTranslation } from "@/i18n";

export default function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ko" : "en")}
      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
      aria-label="Toggle language"
    >
      <span className={locale === "en" ? "font-bold text-gray-900" : ""}>EN</span>
      <span className="text-gray-300">/</span>
      <span className={locale === "ko" ? "font-bold text-gray-900" : ""}>KO</span>
    </button>
  );
}
