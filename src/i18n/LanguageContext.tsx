"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import en from "./locales/en.json";
import ko from "./locales/ko.json";

export type Locale = "en" | "ko";

const translations: Record<Locale, typeof en> = { en, ko };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "logos-lang";

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "ko") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(translations[locale], key);
      if (value === undefined || value === null) {
        // Fallback to English
        value = getNestedValue(translations.en, key);
      }
      if (typeof value !== "string") return key;
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (_, k) =>
          params[k] !== undefined ? String(params[k]) : `{{${k}}}`
        );
      }
      return value;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}

/**
 * Get a nested array from translations (e.g., for loading messages).
 * Returns the array for the current locale, or falls back to English.
 */
export function useTranslationArray(key: string): any[] {
  const { locale } = useTranslation();
  const value = getNestedValue(translations[locale], key);
  if (Array.isArray(value)) return value;
  const fallback = getNestedValue(translations.en, key);
  return Array.isArray(fallback) ? fallback : [];
}
