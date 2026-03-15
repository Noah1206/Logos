"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n";

interface StudyExportPanelProps {
  studyContent: string;
  title: string;
}

export default function StudyExportPanel({ studyContent, title }: StudyExportPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(studyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([studyContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9가-힣\s]/g, "").trim() || "study-notes"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyNotion = async () => {
    // Notion은 마크다운 붙여넣기 지원 → 동일 콘텐츠 복사
    await navigator.clipboard.writeText(studyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
        <h2 className="font-bold text-gray-900">{t("study.export.title")}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 마크다운 복사 */}
        <button
          onClick={handleCopyMarkdown}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
            copied
              ? "border-green-300 bg-green-50"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            copied ? "bg-green-100" : "bg-gray-100"
          }`}>
            {copied ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">{t("study.export.copyMarkdown")}</p>
            <p className="text-xs text-gray-400 mt-1">{t("study.export.copyMarkdownDesc")}</p>
          </div>
        </button>

        {/* .md 다운로드 */}
        <button
          onClick={handleDownloadMd}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">{t("study.export.downloadMd")}</p>
            <p className="text-xs text-gray-400 mt-1">{t("study.export.downloadMdDesc")}</p>
          </div>
        </button>

        {/* 노션 붙여넣기 */}
        <button
          onClick={handleCopyNotion}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.29c-.42-.326-.98-.7-2.055-.607L3.01 2.87c-.466.046-.56.28-.374.466l1.823 1.326zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.187c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933l3.222-.187zM2.31 1.49L16.783.583c1.82-.14 2.287.093 3.082.7l4.25 2.987c.56.42.746.933.746 1.586v15.27c0 1.307-.467 2.054-2.1 2.147L6.518 24c-1.26.093-1.866-.14-2.52-.933L.84 19.087c-.7-.886-.98-1.54-.98-2.287V3.62C-.14 2.334.327 1.63 2.31 1.49z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">{t("study.export.notion")}</p>
            <p className="text-xs text-gray-400 mt-1">{t("study.export.notionDesc")}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
