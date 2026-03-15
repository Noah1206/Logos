"use client";

import { useTranslation } from "@/i18n";

interface StudyTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasTimeline: boolean;
  hasMindMap: boolean;
}

const TABS = [
  { id: "notes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "mindmap", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  { id: "timeline", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "export", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
];

export default function StudyTabBar({ activeTab, onTabChange, hasTimeline, hasMindMap }: StudyTabBarProps) {
  const { t } = useTranslation();

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === "timeline" && !hasTimeline) return false;
    if (tab.id === "mindmap" && !hasMindMap) return false;
    return true;
  });

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-8">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
            activeTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
          </svg>
          <span className="hidden sm:inline">{t(`study.tabs.${tab.id}`)}</span>
        </button>
      ))}
    </div>
  );
}
