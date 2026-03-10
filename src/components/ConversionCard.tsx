"use client";

import { useTranslation } from "@/i18n";

interface ConversionCardProps {
  id: string;
  title?: string;
  sourceUrl: string;
  platform: string;
  mode: string;
  tone?: string;
  createdAt: string;
  knowledge?: {
    topic?: string;
    summary?: string;
    keywords?: string[];
  };
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  youtube: "https://www.youtube.com/favicon.ico",
  instagram: "https://www.instagram.com/favicon.ico",
  pdf: "",
};

const TOPIC_COLORS: Record<string, string> = {
  food: "bg-orange-100 text-orange-700",
  fitness: "bg-green-100 text-green-700",
  beauty: "bg-pink-100 text-pink-700",
  education: "bg-blue-100 text-blue-700",
  tech: "bg-purple-100 text-purple-700",
  business: "bg-yellow-100 text-yellow-700",
  lifestyle: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-600",
};

export default function ConversionCard({
  id,
  title,
  sourceUrl,
  platform,
  mode,
  createdAt,
  knowledge,
  onView,
  onDelete,
}: ConversionCardProps) {
  const { t } = useTranslation();

  const formattedDate = new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const modeLabel = mode === "feed-to-blog" ? "Feed → Blog" : mode === "study" ? "Study" : "Video → Blog";

  return (
    <div className="rounded-2xl border border-gray-200 hover:shadow-md transition-shadow bg-white p-5 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {PLATFORM_ICONS[platform] && (
            <img
              src={PLATFORM_ICONS[platform]}
              alt={platform}
              className="w-4 h-4 flex-shrink-0"
            />
          )}
          {platform === "pdf" && (
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            </svg>
          )}
          <h3 className="font-semibold text-gray-900 truncate text-sm">
            {title || sourceUrl}
          </h3>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{formattedDate}</span>
      </div>

      {/* Topic badge + mode label */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
          {modeLabel}
        </span>
        {knowledge?.topic && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              TOPIC_COLORS[knowledge.topic] || TOPIC_COLORS.other
            }`}
          >
            {knowledge.topic}
          </span>
        )}
      </div>

      {/* Summary */}
      {knowledge?.summary && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {knowledge.summary}
        </p>
      )}

      {/* Keywords */}
      {knowledge?.keywords && knowledge.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {knowledge.keywords.slice(0, 5).map((kw, i) => (
            <span
              key={i}
              className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onView(id)}
          className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors"
        >
          {t("dashboard.card.viewResult")}
        </button>
        <button
          onClick={() => {
            if (window.confirm(t("dashboard.card.deleteConfirm"))) {
              onDelete(id);
            }
          }}
          className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors ml-auto opacity-0 group-hover:opacity-100"
        >
          {t("dashboard.card.delete")}
        </button>
      </div>
    </div>
  );
}
