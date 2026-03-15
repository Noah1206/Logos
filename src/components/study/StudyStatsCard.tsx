"use client";

import { useTranslation } from "@/i18n";

interface StudyStatsCardProps {
  stats: {
    totalStudies: number;
    totalConcepts: number;
    totalConnections: number;
  } | null;
}

export default function StudyStatsCard({ stats }: StudyStatsCardProps) {
  const { t } = useTranslation();

  if (!stats) return null;

  const items = [
    {
      label: t("study.stats.studies"),
      value: stats.totalStudies,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      label: t("study.stats.concepts"),
      value: stats.totalConcepts,
      color: "from-violet-500 to-violet-600",
      bgColor: "bg-violet-50",
      textColor: "text-violet-600",
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    },
    {
      label: t("study.stats.connections"),
      value: stats.totalConnections,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${item.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{item.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
