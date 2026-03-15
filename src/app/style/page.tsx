"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslation } from "@/i18n";
import LanguageToggle from "@/components/LanguageToggle";

type AnalysisStatus = "idle" | "analyzing" | "completed" | "error";

interface StyleProfile {
  tone_summary: string;
  sentence_endings: string[];
  frequent_expressions: string[];
  emoji_style: { frequency: string; preferred_emojis: string[] };
  paragraph_style: { avg_length: string; line_break_frequency: string; flow_description: string };
  opening_patterns: string[];
  closing_patterns: string[];
  unique_traits: string[];
  style_examples: string[];
  writing_instructions: string;
}

interface SavedProfile {
  id: string;
  blogUrl: string;
  blogId: string;
  styleProfile: StyleProfile;
  postsAnalyzed: number;
  analyzedAt: string;
}

export default function StylePage() {
  const { t } = useTranslation();
  const { data: session, status: authStatus } = useSession();
  const [blogUrl, setBlogUrl] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [progressMessage, setProgressMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{ blogId: string; postsAnalyzed: number } | null>(null);

  // 기존 프로필 로드
  useEffect(() => {
    if (session?.user) {
      fetch("/api/style")
        .then((r) => r.json())
        .then((data) => {
          if (data.data) {
            setSavedProfile(data.data);
            setStyleProfile(data.data.styleProfile as StyleProfile);
            setBlogUrl(data.data.blogUrl);
            setAnalysisStatus("completed");
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const validateUrl = (url: string) => {
    return /blog\.naver\.com\/[a-zA-Z0-9_-]+/.test(url) || /m\.blog\.naver\.com\/[a-zA-Z0-9_-]+/.test(url);
  };

  const startAnalysis = async () => {
    if (!validateUrl(blogUrl)) {
      setError(t("style.errors.invalidUrl"));
      return;
    }
    setError("");
    setAnalysisStatus("analyzing");
    setProgress(0);
    setProgressMessage(t("style.progress.starting"));

    try {
      const res = await fetch("/api/style/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blog_url: blogUrl }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || t("style.errors.serverError"));
        setAnalysisStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              setError(data.message);
              setAnalysisStatus("error");
              return;
            }

            setProgress(data.progress);
            setProgressMessage(data.message);

            if (data.progress === 100 && data.result) {
              const { blog_id, posts_analyzed, style_profile: sp } = data.result;
              setStyleProfile(sp);
              setAnalysisResult({ blogId: blog_id, postsAnalyzed: posts_analyzed });
              setAnalysisStatus("completed");

              // DB에 저장
              await fetch("/api/style", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  blogUrl,
                  blogId: blog_id,
                  styleProfile: sp,
                  postsAnalyzed: posts_analyzed,
                }),
              });
            }
          } catch {
            // 파싱 실패 무시
          }
        }
      }
    } catch {
      setError(t("style.errors.networkError"));
      setAnalysisStatus("error");
    }
  };

  const handleDelete = async () => {
    await fetch("/api/style", { method: "DELETE" });
    setStyleProfile(null);
    setSavedProfile(null);
    setAnalysisStatus("idle");
    setBlogUrl("");
    setProgress(0);
  };

  const handleReanalyze = () => {
    setStyleProfile(null);
    setSavedProfile(null);
    setAnalysisStatus("idle");
    setProgress(0);
    setError("");
  };

  if (authStatus === "loading") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 bg-white">
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
        <section className="pt-24 pb-20 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("style.loginRequired")}</h1>
          <button
            onClick={() => signIn()}
            className="px-8 py-3 bg-[#4F46E5] text-white font-medium rounded-full hover:bg-[#4338CA] transition-colors"
          >
            {t("common.login")}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white">
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

      <section className="pt-16 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              {t("style.title")}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {t("style.subtitle")}
            </p>
          </div>

          {/* 분석 상태가 idle 또는 error일 때: 입력 폼 */}
          {(analysisStatus === "idle" || analysisStatus === "error") && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("style.urlLabel")}
                </label>
                <input
                  type="url"
                  value={blogUrl}
                  onChange={(e) => { setBlogUrl(e.target.value); setError(""); }}
                  placeholder="https://blog.naver.com/myblog"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
                <p className="text-sm font-medium text-gray-700">{t("style.howItWorks.title")}</p>
                <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
                  <li>{t("style.howItWorks.step1")}</li>
                  <li>{t("style.howItWorks.step2")}</li>
                  <li>{t("style.howItWorks.step3")}</li>
                </ol>
              </div>

              <button
                onClick={startAnalysis}
                disabled={!blogUrl.trim()}
                className={`w-full py-4 text-base font-medium rounded-full transition-all duration-200 ${
                  blogUrl.trim()
                    ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] hover:scale-[0.98] active:scale-95"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {t("style.analyzeButton")}
              </button>
            </div>
          )}

          {/* 분석 중 */}
          {analysisStatus === "analyzing" && (
            <div className="text-center py-16 space-y-6">
              <div className="w-16 h-16 mx-auto border-3 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-2">{progressMessage}</p>
                <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#4F46E5] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 분석 완료: 결과 표시 */}
          {analysisStatus === "completed" && styleProfile && (
            <div className="space-y-6">
              {/* 톤 요약 */}
              <div className="bg-gradient-to-br from-[#EEF2FF] to-white rounded-2xl p-6 border border-[#C7D2FE]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">✍️</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{t("style.result.toneTitle")}</h3>
                    <p className="text-sm text-[#4F46E5]">{styleProfile.tone_summary}</p>
                  </div>
                </div>
                {(analysisResult || savedProfile) && (
                  <p className="text-xs text-gray-400 mt-2">
                    {t("style.result.postsAnalyzed", {
                      count: analysisResult?.postsAnalyzed || savedProfile?.postsAnalyzed || 0,
                    })}
                  </p>
                )}
              </div>

              {/* 자주 쓰는 표현 */}
              {styleProfile.frequent_expressions.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">{t("style.result.expressions")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {styleProfile.frequent_expressions.map((expr, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded-full">
                        {expr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 종결 어미 */}
              {styleProfile.sentence_endings.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">{t("style.result.endings")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {styleProfile.sentence_endings.map((ending, i) => (
                      <span key={i} className="px-3 py-1.5 bg-[#EEF2FF] text-sm text-[#4F46E5] rounded-full">
                        {ending}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 이모지 스타일 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-3">{t("style.result.emojiStyle")}</h3>
                <p className="text-sm text-gray-600">
                  {t("style.result.emojiFrequency")}: {styleProfile.emoji_style.frequency}
                </p>
                {styleProfile.emoji_style.preferred_emojis.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {styleProfile.emoji_style.preferred_emojis.map((emoji, i) => (
                      <span key={i} className="text-2xl">{emoji}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* 문체 예시 */}
              {styleProfile.style_examples.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">{t("style.result.examples")}</h3>
                  <div className="space-y-3">
                    {styleProfile.style_examples.map((example, i) => (
                      <p key={i} className="text-sm text-gray-600 pl-3 border-l-2 border-[#4F46E5]/30 italic">
                        &ldquo;{example}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* 버튼 영역 */}
              <div className="flex gap-3">
                <button
                  onClick={handleReanalyze}
                  className="flex-1 py-3 text-sm font-medium text-[#4F46E5] bg-[#EEF2FF] rounded-full hover:bg-[#E0E7FF] transition-colors"
                >
                  {t("style.reanalyze")}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 text-sm font-medium text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                >
                  {t("style.delete")}
                </button>
              </div>

              <a
                href="/"
                className="block text-center py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t("style.backToHome")}
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
