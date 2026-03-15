"use client";

import { useTranslation } from "@/i18n";

interface TimestampSegment {
  start: number;
  end: number;
  text: string;
}

interface StudyTimelineProps {
  segments: TimestampSegment[];
  sourceUrl?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getYouTubeTimestampUrl(url: string, seconds: number): string {
  try {
    const u = new URL(url);
    // shorts URL → 일반 watch URL로 변환
    const videoId = u.pathname.includes("/shorts/")
      ? u.pathname.split("/shorts/")[1]
      : u.searchParams.get("v");
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}`;
    }
    return url;
  } catch {
    return url;
  }
}

export default function StudyTimeline({ segments, sourceUrl }: StudyTimelineProps) {
  const { t } = useTranslation();

  if (!segments || segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="text-center">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 text-sm">{t("study.timeline.unavailable")}</p>
        </div>
      </div>
    );
  }

  const isYouTube = sourceUrl?.includes("youtube.com") || sourceUrl?.includes("youtu.be");

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
        <h2 className="font-bold text-gray-900">{t("study.tabs.timeline")}</h2>
      </div>

      <div className="relative">
        {/* 수직 라인 */}
        <div className="absolute left-[52px] top-0 bottom-0 w-px bg-gray-200" />

        <div className="space-y-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-start gap-4 group">
              {/* 타임스탬프 */}
              {isYouTube && sourceUrl ? (
                <a
                  href={getYouTubeTimestampUrl(sourceUrl, seg.start)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-[44px] text-right text-xs font-mono text-blue-500 hover:text-blue-700 mt-2.5 cursor-pointer transition-colors"
                >
                  {formatTime(seg.start)}
                </a>
              ) : (
                <span className="flex-shrink-0 w-[44px] text-right text-xs font-mono text-gray-400 mt-2.5">
                  {formatTime(seg.start)}
                </span>
              )}

              {/* 도트 */}
              <div className="flex-shrink-0 w-4 h-4 mt-2 rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-500 transition-colors z-10" />

              {/* 텍스트 */}
              <div className="flex-1 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <p className="text-sm text-gray-700 leading-relaxed">{seg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
