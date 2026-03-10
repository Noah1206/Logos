"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useThink } from "@/hooks/useThink";
import LanguageToggle from "@/components/LanguageToggle";

export default function ThinkPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const { messages, isThinking, sendMessage } = useThink();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    sendMessage(input.trim());
    setInput("");
  };

  const suggestions = t("dashboard.think.suggestions") as unknown as string[];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#4F46E5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
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
                <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t("nav.dashboard")}
                </a>
                <span className="text-sm text-[#4F46E5] font-medium">
                  {t("dashboard.aiBrain")}
                </span>
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

      {/* Chat area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{t("dashboard.think.title")}</h1>
          <p className="text-sm text-gray-500">{t("dashboard.think.subtitle")}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {t("dashboard.think.empty")}
              </p>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {Array.isArray(suggestions) && suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#4F46E5] text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {msg.content || (
                    <span className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("dashboard.think.thinking")}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-gray-50 pt-2 pb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isThinking}
              placeholder={t("dashboard.think.placeholder")}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-sm bg-white disabled:bg-gray-100"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="px-5 py-3 bg-[#4F46E5] text-white rounded-xl text-sm font-medium hover:bg-[#4338CA] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t("dashboard.think.send")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
