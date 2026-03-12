"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { usePayment } from "@/hooks/usePayment";
import { useTranslation, useTranslationArray } from "@/i18n";
import VideoTimeline from "@/components/VideoTimeline";

type ReportTab = "detailed" | "summary" | "easy" | "script";

interface BlogSection {
  emoji: string;
  title: string;
  content: string;
  frame_index?: number | null;
  extraImages?: string[];
}

interface ResultData {
  videoTitle: string;
  platform: string;
  blogTitle: string;
  toc: { id: number; emoji: string; title: string }[];
  summary: string;
  sections: BlogSection[];
  hashtags: string[];
  frameUrls: string[];
  closingCta: string;
  rawContent?: string;
}

interface VideoResultData {
  videoUrl: string;
  videoPrompt: string;
}

// 인라인 편집 가능한 텍스트 컴포넌트
function EditableText({
  value,
  onChange,
  className = "",
  tag: Tag = "p",
}: {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
}) {
  const ref = useRef<HTMLElement>(null);
  const isFocused = useRef(false);

  const toHtml = (text: string) =>
    text.split("\n").map((s) => s || "<br>").join("<br>");

  const fromHtml = (el: HTMLElement) =>
    el.innerText.replace(/\u00A0/g, " ");

  // value가 외부에서 변경되면 DOM 동기화 (포커스 중이 아닐 때만)
  useEffect(() => {
    const el = ref.current;
    if (!el || isFocused.current) return;
    const current = fromHtml(el);
    if (current !== value) {
      el.innerHTML = toHtml(value);
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    isFocused.current = false;
    const el = ref.current;
    if (!el) return;
    const text = fromHtml(el);
    if (text !== value) {
      onChange(text);
    }
  }, [value, onChange]);

  const handleFocus = useCallback(() => {
    isFocused.current = true;
  }, []);

  // 초기 렌더 시 innerHTML로 줄바꿈 처리
  const initialHtml = toHtml(value);

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onFocus={handleFocus}
      dangerouslySetInnerHTML={{ __html: initialHtml }}
      className={`outline-none cursor-text rounded-md transition-all duration-200 focus:ring-2 focus:ring-purple-200 focus:bg-purple-50/30 hover:bg-gray-50 ${className}`}
    />
  );
}

// 이미지 로딩 + 교체/삭제/크기 조절 컴포넌트
function BlogImage({ src, alt, onReplace, onDelete }: {
  src: string; alt: string;
  onReplace?: (newSrc: string) => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [scale, setScale] = useState(100); // 퍼센트
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/") || !onReplace) return;
    const reader = new FileReader();
    reader.onload = () => {
      onReplace(reader.result as string);
      setLoaded(false);
      setScale(100);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="my-8 relative group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onDragOver={(e) => { e.preventDefault(); setHovering(true); }}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHovering(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* 이미지 */}
      <div className="bg-gray-100 min-h-[120px] relative overflow-hidden" style={{ maxWidth: `${scale}%` }}>
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
            <span className="text-xs text-gray-400">{t("result.imageLoading")}</span>
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`w-full h-auto transition-opacity duration-500 cursor-pointer ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onClick={() => onReplace && fileRef.current?.click()}
        />
      </div>

      {/* 툴바 (hover 시) */}
      {hovering && loaded && (
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {/* 교체 */}
          {onReplace && (
            <button
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg shadow flex items-center justify-center transition-colors"
              title={t("result.changePhoto")}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </button>
          )}
          {/* 삭제 */}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-8 h-8 bg-white/90 hover:bg-red-50 rounded-lg shadow flex items-center justify-center transition-colors"
              title={t("result.deletePhoto")}
            >
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 크기 조절 슬라이더 (hover 시) */}
      {hovering && loaded && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 rounded-full shadow px-3 py-1.5 z-10">
          <span className="text-[10px] text-gray-400 w-5 text-right">S</span>
          <input
            type="range"
            min={30}
            max={100}
            value={scale}
            onChange={(e) => { e.stopPropagation(); setScale(Number(e.target.value)); }}
            onClick={(e) => e.stopPropagation()}
            className="w-24 h-1 accent-[#4F46E5] cursor-pointer"
          />
          <span className="text-[10px] text-gray-400 w-5">L</span>
          <span className="text-[10px] text-gray-500 font-medium w-8">{scale}%</span>
        </div>
      )}
    </div>
  );
}

// 선택 영역 서식 적용 플로팅 툴바
function FloatingToolbar({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selFontSize, setSelFontSize] = useState(16);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setVisible(false);
      return;
    }
    const range = selection.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setVisible(false);
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setVisible(false);
      return;
    }

    // 선택 영역의 현재 폰트 크기 감지
    const startNode = range.startContainer;
    const el = startNode.nodeType === Node.TEXT_NODE ? startNode.parentElement : startNode as Element;
    if (el) {
      const computed = window.getComputedStyle(el as HTMLElement);
      const size = parseInt(computed.fontSize, 10);
      if (!isNaN(size)) setSelFontSize(size);
    }

    setPosition({
      top: Math.max(10, rect.top - 52),
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("selectionchange", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition]);

  const applyStyle = useCallback((prop: string, value: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    // 선택 영역이 이미 스타일된 span 안에 있으면 해당 span 업데이트
    const ancestor = range.commonAncestorContainer;
    const parentEl = ancestor.nodeType === Node.TEXT_NODE
      ? ancestor.parentElement
      : ancestor as HTMLElement;

    if (
      parentEl &&
      parentEl.tagName === "SPAN" &&
      parentEl.style &&
      selection.toString() === parentEl.textContent
    ) {
      (parentEl as HTMLElement).style[prop as any] = value;
      return;
    }

    // 새 span으로 감싸기
    const span = document.createElement("span");
    (span.style as any)[prop] = value;
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);

    // 선택 유지
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
  }, []);

  const handleFontSize = useCallback(
    (delta: number) => {
      const newSize = Math.max(12, Math.min(32, selFontSize + delta));
      setSelFontSize(newSize);
      applyStyle("fontSize", `${newSize}px`);
    },
    [selFontSize, applyStyle]
  );

  const handleFontWeight = useCallback(
    (weight: number) => {
      applyStyle("fontWeight", String(weight));
    },
    [applyStyle]
  );

  if (!visible) return null;

  const weightButtons = [
    { label: "L", value: 300 },
    { label: "R", value: 400 },
    { label: "M", value: 500 },
    { label: "B", value: 700 },
  ];

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[200] bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-3 select-none animate-fade-in"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-gray-400 text-xs">{t("result.size")}</span>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFontSize(-1);
          }}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm transition-colors"
        >
          −
        </button>
        <span className="text-xs text-gray-600 w-6 text-center font-mono">
          {selFontSize}
        </span>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFontSize(1);
          }}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm transition-colors"
        >
          +
        </button>
      </div>
      <div className="w-px h-5 bg-gray-200" />
      <div className="flex items-center gap-1">
        {weightButtons.map((btn) => (
          <button
            key={btn.label}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFontWeight(btn.value);
            }}
            className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            style={{ fontWeight: btn.value }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// FastAPI 응답을 프론트엔드 표시 형식으로 변환
function mapResponseToResultData(data: any): ResultData {
  const structure = data.blog_structure;
  const keywords = data.seo_keywords;

  // 동적 섹션: 백엔드에서 콘텐츠 유형에 맞게 자동 생성 + 프레임 매칭
  const sections: BlogSection[] = (structure.sections ?? []).map(
    (s: any) => ({
      emoji: s.emoji ?? "📌",
      title: s.title ?? "",
      content: s.content ?? "",
      frame_index: s.frame_index ?? null,
      extraImages: [],
    })
  );

  const toc = sections.map((s, i) => ({
    id: i + 1,
    emoji: s.emoji,
    title: s.title,
  }));

  const hashtags = (keywords?.hashtags ?? []).map((tag: string) =>
    tag.startsWith("#") ? tag : `#${tag}`
  );

  return {
    videoTitle: data.video_info?.title ?? "영상",
    platform: data.platform ?? "youtube",
    blogTitle: structure.title,
    toc,
    summary: structure.introduction,
    sections,
    hashtags,
    frameUrls: data.frame_urls ?? [],
    closingCta: structure.closing_cta ?? "",
    rawContent: data.blog_content,
  };
}

function ResultContent() {
  const { t } = useTranslation();
  const blogLoadingMessages = useTranslationArray("result.blogLoading");
  const videoLoadingMessages = useTranslationArray("result.videoLoading");
  const studyLoadingMessages = useTranslationArray("study.loading");
  const blogLoadingTips = useTranslationArray("result.blogTips");
  const videoLoadingTips = useTranslationArray("result.videoTips");
  const studyLoadingTips = useTranslationArray("study.tips");

  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";
  const tone = searchParams.get("tone") || "";
  const pageMode = searchParams.get("mode") || "";
  const studyMode = searchParams.get("studyMode") || "";
  const isVideoMode = pageMode === "blog-to-video";
  const isStudyMode = pageMode === "study";

  const loadingMessages = isVideoMode ? videoLoadingMessages : isStudyMode ? studyLoadingMessages : blogLoadingMessages;
  const loadingTips = isVideoMode ? videoLoadingTips : isStudyMode ? studyLoadingTips : blogLoadingTips;

  const { data: session, update: updateSession } = useSession();
  const user = session?.user;

  const { purchasePackage, isProcessing } = usePayment({
    onSuccess: (credits) => {
      alert(t("payment.completed", { credits }));
      updateSession();
      setShowPricing(false);
    },
    onError: (error) => {
      if (!error.includes(t("payment.cancelled"))) {
        alert(t("payment.error", { error }));
      }
    },
  });

  const handlePurchase = (packageId: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    purchasePackage(packageId);
  };

  const [progress, setProgress] = useState(0); // 백엔드 목표값
  const [displayProgress, setDisplayProgress] = useState(0); // 화면 표시값 (점진 증가)
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sseMessage, setSseMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [messageFade, setMessageFade] = useState(true);
  const [tipFade, setTipFade] = useState(true);
  const [dots, setDots] = useState("");
  const [activeTab, setActiveTab] = useState<ReportTab>("detailed");
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [editedData, setEditedData] = useState<ResultData | null>(null);
  const [videoResult, setVideoResult] = useState<VideoResultData | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontWeight, setFontWeight] = useState<"light" | "normal" | "medium" | "bold">("normal");
  const [showToc, setShowToc] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [showPricing, setShowPricing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [userImages, setUserImages] = useState<string[]>([]);
  const [excludeFrames, setExcludeFrames] = useState(false);
  const [studyResult, setStudyResult] = useState<any>(null);
  const [openQuestions, setOpenQuestions] = useState<Set<number>>(new Set());
  const [blogStudyStructure, setBlogStudyStructure] = useState<any>(null);
  const [openBlogStudyQuestions, setOpenBlogStudyQuestions] = useState<Set<number>>(new Set());
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [insertAfterIdx, setInsertAfterIdx] = useState<number | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const sectionFileRef = useRef<HTMLInputElement>(null);
  const loadingFileRef = useRef<HTMLInputElement>(null);
  const [sidebarHistory, setSidebarHistory] = useState<{ blog: any[]; study: any[] }>({ blog: [], study: [] });
  const [blogSectionOpen, setBlogSectionOpen] = useState(true);
  const [studySectionOpen, setStudySectionOpen] = useState(true);

  // 사이드바 변환 기록 불러오기
  const refreshSidebarHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/conversions?limit=10");
      if (!res.ok) return;
      const { data } = await res.json();
      const blog: any[] = [];
      const study: any[] = [];
      for (const c of data) {
        if (c.mode === "study") study.push(c);
        else blog.push(c);
      }
      setSidebarHistory({ blog, study });
    } catch {}
  }, []);

  useEffect(() => {
    if (user) refreshSidebarHistory();
  }, [user, refreshSidebarHistory]);

  const handleSocialLogin = (provider: string) => {
    setLoginLoading(provider);
    signIn(provider, { callbackUrl: window.location.href });
  };

  const requireAuth = (action: () => void) => {
    // 임시 비활성화 — 무료 테스트 기간
    // if (!user) {
    //   setShowLoginModal(true);
    //   return;
    // }
    action();
  };

  const blogContentRef = useRef<HTMLDivElement>(null);

  // 변환 결과를 DB에 저장 (fire-and-forget)
  const saveConversion = useCallback(async (resultEvent: any, mapped: ResultData) => {
    try {
      const isInstagramFeed = url.includes("instagram.com/p/");
      const isInstagram = url.includes("instagram.com");
      const platformVal = isInstagram ? "instagram" : "youtube";
      let sourceType = "youtube_shorts";
      if (isInstagramFeed) sourceType = "instagram_feed";
      else if (isInstagram) sourceType = "instagram_reel";

      const modeVal = isInstagramFeed ? "feed-to-blog" : "video-to-blog";

      const body = {
        sourceUrl: url,
        sourceType,
        platform: platformVal,
        mode: modeVal,
        tone: tone || null,
        title: mapped.blogTitle,
        resultContent: mapped.rawContent || null,
        resultJson: mapped,
        transcript: resultEvent.transcript || null,
        creditUsed: 1,
      };

      const res = await fetch("/api/conversions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const { data: conversion } = await res.json();
        // URL을 ID 기반으로 교체 (짧고 깔끔한 URL)
        window.history.replaceState({}, "", `/result?id=${conversion.id}`);
        // 비동기로 지식 추출 트리거 (fire-and-forget)
        fetch("/api/knowledge/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversionId: conversion.id }),
        }).catch(() => {});
      } else {
        console.error("[Blog] Save failed:", res.status);
      }
    } catch (e) {
      console.error("[Blog] Save error:", e);
    }
    refreshSidebarHistory();
  }, [url, tone, refreshSidebarHistory]);

  // sessionStorage에서 사용자 설정 로드
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("user_images");
      if (stored) {
        setUserImages(JSON.parse(stored));
        sessionStorage.removeItem("user_images");
      }
      if (sessionStorage.getItem("exclude_frames") === "true") {
        setExcludeFrames(true);
        sessionStorage.removeItem("exclude_frames");
      }
    } catch {}
  }, []);

  // 블로그 본문에 이미지 붙여넣기 지원
  useEffect(() => {
    const container = blogContentRef.current;
    if (!container) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const img = document.createElement("img");
            img.src = dataUrl;
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            img.style.borderRadius = "8px";
            img.style.margin = "16px 0";
            img.style.display = "block";

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              if (container.contains(range.commonAncestorContainer)) {
                range.deleteContents();
                range.insertNode(img);
                range.setStartAfter(img);
                range.setEndAfter(img);
                selection.removeAllRanges();
                selection.addRange(range);
                return;
              }
            }
            container.appendChild(img);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    container.addEventListener("paste", handlePaste);
    return () => container.removeEventListener("paste", handlePaste);
  }, [isComplete]);

  // displayProgress: 백엔드 값 반영 + 사이사이 천천히 자동 증가 (최대 90%)
  useEffect(() => {
    if (isComplete || isError) return;
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        // 백엔드 목표값보다 뒤처져 있으면 빠르게 따라잡기
        if (prev < progress) {
          const gap = progress - prev;
          return Math.min(prev + Math.max(gap * 0.15, 0.5), progress);
        }
        // 백엔드 값에 도달했어도 90% 미만이면 천천히 올리기
        if (prev < 90) {
          // 높을수록 느려지게 (10%대: +0.3/tick, 70%대: +0.1/tick)
          const speed = Math.max(0.08, 0.35 - prev * 0.003);
          return prev + speed;
        }
        return prev;
      });
    }, 300);
    return () => clearInterval(timer);
  }, [progress, isComplete, isError]);

  // progress가 100이면 displayProgress도 즉시 100으로
  useEffect(() => {
    if (progress >= 100) setDisplayProgress(100);
  }, [progress]);

  // 로딩 메시지 순환
  useEffect(() => {
    if (isComplete || isError) return;
    const interval = setInterval(() => {
      setMessageFade(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        setMessageFade(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, [isComplete, isError, loadingMessages.length]);

  // 팁 메시지 순환
  useEffect(() => {
    if (isComplete || isError) return;
    const interval = setInterval(() => {
      setTipFade(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % loadingTips.length);
        setTipFade(true);
      }, 300);
    }, 4500);
    return () => clearInterval(interval);
  }, [isComplete, isError, loadingTips.length]);

  // 점 애니메이션
  useEffect(() => {
    if (isComplete || isError) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isComplete, isError]);

  // blog-to-video API 호출
  useEffect(() => {
    if (!isVideoMode) return;

    const blogContent = sessionStorage.getItem("blog-to-video-content");
    const style = sessionStorage.getItem("blog-to-video-style") || undefined;

    if (!blogContent) {
      setErrorMessage(t("result.noContent"));
      setIsError(true);
      return;
    }

    // 느린 프로그레스 (영상 생성은 2~5분)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80;
        }
        return prev + Math.random() * 3;
      });
    }, 2000);

    const callAPI = async () => {
      try {
        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blog_content: blogContent, style }),
        });

        const data = await res.json();
        clearInterval(progressInterval);

        if (!res.ok || !data.success) {
          setErrorMessage(data.error ?? t("result.videoError"));
          setIsError(true);
          return;
        }

        setVideoResult({
          videoUrl: data.video_url,
          videoPrompt: data.video_prompt ?? "",
        });
        setProgress(100);
        setTimeout(() => setIsComplete(true), 400);
      } catch {
        clearInterval(progressInterval);
        setErrorMessage(t("result.serverError"));
        setIsError(true);
      }
    };

    callAPI();
    return () => clearInterval(progressInterval);
  }, [isVideoMode]);

  // Study 모드 SSE 스트리밍
  useEffect(() => {
    if (!isStudyMode || id) return;

    let cancelled = false;
    let saved = false;

    const callStudySSE = async () => {
      try {
        const body: Record<string, any> = {};
        if (studyMode === "pdf") {
          body.mode = "pdf";
          const pdfUrlsRaw = sessionStorage.getItem("study-pdf-urls");
          if (pdfUrlsRaw) {
            try {
              body.pdf_urls = JSON.parse(pdfUrlsRaw);
            } catch {
              body.pdf_url = sessionStorage.getItem("study-pdf-url");
            }
          } else {
            body.pdf_url = sessionStorage.getItem("study-pdf-url");
          }
        } else {
          body.mode = "youtube";
          body.url = url || sessionStorage.getItem("study-url") || "";
        }

        const res = await fetch("/api/study/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setErrorMessage(errData.error || t("result.convertError"));
          setIsError(true);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.error) {
                setErrorMessage(event.message ?? t("result.conversionFailedShort"));
                setIsError(true);
                setProgress(0);
                setDisplayProgress(0);
                return;
              }
              if (event.message) setSseMessage(event.message);
              if (event.progress !== undefined && event.progress >= 0) setProgress(event.progress);

              if (event.result) {
                setStudyResult(event.result);
                setProgress(100);
                updateSession();

                // Save study conversion to DB (중복 방지)
                if (saved) { setTimeout(() => setIsComplete(true), 400); return; }
                saved = true;
                try {
                  const sourceUrl = url || sessionStorage.getItem("study-url") || sessionStorage.getItem("study-pdf-url") || "";
                  const convBody = {
                    sourceUrl,
                    sourceType: studyMode === "pdf" ? "pdf" : "youtube_long",
                    platform: studyMode === "pdf" ? "pdf" : "youtube",
                    mode: "study",
                    title: event.result.title || event.result.study_structure?.title || "학습 노트",
                    resultContent: event.result.study_content || null,
                    resultJson: event.result || null,
                    transcript: event.result.transcript || null,
                    creditUsed: 1,
                  };
                  const saveRes = await fetch("/api/conversions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(convBody),
                  });
                  if (saveRes.ok) {
                    const { data: conversion } = await saveRes.json();
                    window.history.replaceState({}, "", `/result?id=${conversion.id}&mode=study`);
                    fetch("/api/knowledge/extract", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ conversionId: conversion.id }),
                    }).catch(() => {});
                  } else {
                    console.error("[Study] Save failed:", saveRes.status, await saveRes.text());
                  }
                } catch (e) {
                  console.error("[Study] Save error:", e);
                }
                refreshSidebarHistory();

                setTimeout(() => setIsComplete(true), 400);
                return;
              }
            } catch {}
          }
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(t("result.serverError"));
          setIsError(true);
        }
      }
    };

    callStudySSE();
    return () => { cancelled = true; };
  }, [isStudyMode, studyMode]);

  // ID 기반 결과 로드 (공유 URL, 새로고침, 사이드바 히스토리 클릭)
  const id = searchParams.get("id") || "";
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const loadById = async () => {
      try {
        const res = await fetch(`/api/conversions/${id}`);
        if (!res.ok || cancelled) return;
        const { data: conversion } = await res.json();
        if (cancelled) return;
        const stored = conversion.resultJson as ResultData | null;
        if (stored) {
          if (conversion.mode === "study") {
            // 학습 노트: studyResult로 복원
            setStudyResult(stored);
          } else {
            // 블로그: resultData로 복원
            setResultData(stored as ResultData);
            setEditedData(JSON.parse(JSON.stringify(stored)));
          }
          setProgress(100);
          setTimeout(() => setIsComplete(true), 200);
        }
      } catch (e) {
        console.error("[ID Load] error:", e);
        setErrorMessage(t("result.serverError"));
        setIsError(true);
      }
    };
    loadById();
    return () => { cancelled = true; };
  }, [id]);

  // URL→블로그 SSE 스트리밍 API 호출 (캐시된 결과가 있으면 바로 표시)
  useEffect(() => {
    if (!url || isVideoMode || isStudyMode || id) return;

    // sessionStorage에 캐시된 결과 확인
    const cacheKey = `convert_result_${url}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const mapped = JSON.parse(cached) as ResultData;
        setResultData(mapped);
        setEditedData(JSON.parse(JSON.stringify(mapped)));
        setProgress(100);
        setIsComplete(true);
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    let cancelled = false;
    let saved = false;

    const callSSE = async () => {
      try {
        const res = await fetch("/api/convert/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, ...(tone && { tone }) }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setErrorMessage(data.error ?? t("result.convertError"));
          setIsError(true);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.error) {
                setErrorMessage(event.message ?? t("result.conversionFailedShort"));
                setIsError(true);
                setProgress(0);
                setDisplayProgress(0);
                return;
              }

              if (event.message) {
                setSseMessage(event.message);
              }

              if (event.progress !== undefined && event.progress >= 0) {
                setProgress(event.progress);
              }

              // 조기 갤러리 프레임 수신 (변환 완료 전)
              if (event.gallery_frame_urls?.length && !event.result) {
                setGalleryUrls((prev) =>
                  prev.length === 0 ? event.gallery_frame_urls : prev
                );
              }
              if (event.video_duration && !event.result) {
                setVideoDuration(event.video_duration);
              }

              if (event.result) {
                const mapped = mapResponseToResultData(event.result);
                // userImages를 섹션의 extraImages에 분배
                if (excludeFrames) {
                  // 프레임 제외 모드: frameUrls 비우고, userImages를 섹션에 골고루 분배
                  mapped.frameUrls = [];
                  if (userImages.length > 0) {
                    userImages.forEach((img, i) => {
                      const sIdx = i % mapped.sections.length;
                      if (!mapped.sections[sIdx].extraImages) mapped.sections[sIdx].extraImages = [];
                      mapped.sections[sIdx].extraImages!.push(img);
                    });
                  }
                } else if (userImages.length > 0) {
                  // frame_index가 없는(-1 또는 null) 섹션에 우선 분배, 남으면 순서대로
                  const noFrameSections = mapped.sections
                    .map((s, i) => ({ s, i }))
                    .filter(({ s }) => s.frame_index == null || s.frame_index < 0);
                  const targets = noFrameSections.length > 0
                    ? noFrameSections.map(({ i }) => i)
                    : mapped.sections.map((_, i) => i);
                  userImages.forEach((img, i) => {
                    const sIdx = targets[i % targets.length];
                    if (!mapped.sections[sIdx].extraImages) mapped.sections[sIdx].extraImages = [];
                    mapped.sections[sIdx].extraImages!.push(img);
                  });
                }
                setResultData(mapped);
                setEditedData(JSON.parse(JSON.stringify(mapped)));
                // 갤러리 프레임 URL 설정
                if (event.result.gallery_frame_urls?.length) {
                  setGalleryUrls((prev) =>
                    prev.length === 0 ? event.result.gallery_frame_urls : prev
                  );
                }
                if (event.result.video_duration) {
                  setVideoDuration(event.result.video_duration);
                }
                // 결과를 sessionStorage에 캐시
                sessionStorage.setItem(cacheKey, JSON.stringify(mapped));
                setProgress(100);
                updateSession();
                // DB에 변환 결과 저장 (중복 방지)
                if (!saved) { saved = true; saveConversion(event.result, mapped); }
                setTimeout(() => setIsComplete(true), 400);
                return;
              }
            } catch {
              // JSON 파싱 실패 무시 (heartbeat 등)
            }
          }
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(t("result.serverError"));
          setIsError(true);
        }
      }
    };

    callSSE();
    return () => { cancelled = true; };
  }, [url, isVideoMode]);

  const handleGoBack = () => {
    requireAuth(() => {
      window.location.href = "/";
    });
  };

  const handleCopyContent = async () => {
    const data = editedData ?? resultData;
    if (!data) return;

    // 프레임 매칭 로직 (렌더링과 동일 + 중복 방지)
    const hasFrameMatching = data.sections.some(
      (s) => s.frame_index != null && s.frame_index >= 0
    );
    const usedIndices = new Set(
      data.sections
        .map((s) => s.frame_index)
        .filter((fi): fi is number => fi != null && fi >= 0)
    );
    const introIndex = data.frameUrls.findIndex((_, i) => !usedIndices.has(i));
    const introActualIdx = data.frameUrls.length > 0 ? (introIndex >= 0 ? introIndex : 0) : -1;
    const introUrl = introActualIdx >= 0 ? data.frameUrls[introActualIdx] : undefined;

    // HTML 빌드 (이미지 포함)
    const htmlParts: string[] = [];
    const textParts: string[] = [];

    // 제목
    htmlParts.push(`<h1>${data.blogTitle}</h1>`);
    textParts.push(data.blogTitle, "");

    // 도입부
    htmlParts.push(`<p>${data.summary.replace(/\n/g, "<br>")}</p>`);
    textParts.push(data.summary, "");

    // 도입부 이미지
    if (introUrl) {
      htmlParts.push(`<p><img src="${introUrl}" style="max-width:100%;height:auto;" /></p>`);
    }

    // 본문 섹션
    data.sections.forEach((s, idx) => {
      if (showSubtitle) {
        const title = showEmoji ? `${s.emoji} ${s.title}` : s.title;
        htmlParts.push(`<h2>${title}</h2>`);
        textParts.push(title, "");
      }

      htmlParts.push(`<p>${s.content.replace(/\n/g, "<br>")}</p>`);
      textParts.push(s.content, "");

      // 섹션 이미지 (도입부와 중복 방지)
      let frameUrl: string | undefined;
      if (hasFrameMatching) {
        if (s.frame_index != null && s.frame_index >= 0 && s.frame_index < data.frameUrls.length && s.frame_index !== introActualIdx) {
          frameUrl = data.frameUrls[s.frame_index];
        }
      } else {
        const fallbackIdx = idx + 1;
        if (fallbackIdx !== introActualIdx) {
          frameUrl = data.frameUrls?.[fallbackIdx];
        }
      }
      if (frameUrl) {
        htmlParts.push(`<p><img src="${frameUrl}" style="max-width:100%;height:auto;" /></p>`);
      }

      // 사용자가 갤러리에서 추가한 이미지
      if (s.extraImages) {
        for (const imgUrl of s.extraImages) {
          htmlParts.push(`<p><img src="${imgUrl}" style="max-width:100%;height:auto;" /></p>`);
        }
      }
    });

    // 마무리 CTA
    if (data.closingCta) {
      htmlParts.push(`<p>${data.closingCta.replace(/\n/g, "<br>")}</p>`);
      textParts.push(data.closingCta, "");
    }

    // 해시태그
    htmlParts.push(`<p>${data.hashtags.join(" ")}</p>`);
    textParts.push(data.hashtags.join(" "));

    const htmlContent = htmlParts.join("");
    const textContent = textParts.join("\n");

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlContent], { type: "text/html" }),
          "text/plain": new Blob([textContent], { type: "text/plain" }),
        }),
      ]);
    } catch {
      // 폴백: text만 복사
      await navigator.clipboard.writeText(textContent);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadImages = async () => {
    const data = editedData ?? resultData;
    if (!data || !data.frameUrls || data.frameUrls.length === 0) return;

    setDownloading(true);
    try {
      for (let i = 0; i < data.frameUrls.length; i++) {
        const url = data.frameUrls[i];
        const response = await fetch(url);
        const blob = await response.blob();
        const ext = blob.type.includes("png") ? "png" : "jpg";
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `image_${i + 1}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }
    } catch (err) {
      console.error("Image download failed:", err);
      alert(t("result.imageDownloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  // 편집 헬퍼 함수
  const updateEdited = useCallback((updater: (d: ResultData) => void) => {
    setEditedData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as ResultData;
      updater(next);
      // TOC 동기화
      next.toc = next.sections.map((s, i) => ({
        id: i + 1,
        emoji: s.emoji,
        title: s.title,
      }));
      return next;
    });
  }, []);

  // 갤러리에서 프레임 삽입
  const handleInsertFrame = useCallback((frameUrl: string) => {
    // 변환 완료 전이면 userImages에 추가 (나중에 결과에 병합)
    if (!isComplete || !editedData) {
      setUserImages((prev) => [...prev, frameUrl]);
      setGalleryOpen(false);
      setInsertAfterIdx(null);
      return;
    }
    const targetIdx = insertAfterIdx ?? (editedData?.sections.length ?? 1) - 1;
    updateEdited((d) => {
      if (targetIdx >= 0 && targetIdx < d.sections.length) {
        if (!d.sections[targetIdx].extraImages) {
          d.sections[targetIdx].extraImages = [];
        }
        d.sections[targetIdx].extraImages!.push(frameUrl);
      }
    });
    setGalleryOpen(false);
    setInsertAfterIdx(null);
  }, [insertAfterIdx, editedData, updateEdited, isComplete]);

  // 파일 업로드로 사진 추가 (갤러리 대안)
  const handleSectionFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleInsertFrame(dataUrl);
    };
    reader.readAsDataURL(file);
  }, [handleInsertFrame]);

  // "+" 버튼 클릭 핸들러: 갤러리 있으면 갤러리, 없으면 파일 업로드
  const handleAddPhotoClick = useCallback((sectionIdx: number) => {
    setInsertAfterIdx(sectionIdx);
    if (galleryUrls.length > 0) {
      setGalleryOpen(true);
    } else {
      sectionFileRef.current?.click();
    }
  }, [galleryUrls]);

  // 표시용 데이터 (편집본 우선)
  const displayData = editedData ?? resultData;

  // 도입부 이미지 인덱스 (섹션에서 중복 방지용)
  const introFrameIndex = React.useMemo(() => {
    if (!displayData?.frameUrls?.length) return -1;
    const sectionUsed = new Set(
      displayData.sections
        .map((s) => s.frame_index)
        .filter((fi): fi is number => fi != null && fi >= 0)
    );
    const idx = displayData.frameUrls.findIndex((_, i) => !sectionUsed.has(i));
    return idx >= 0 ? idx : 0;
  }, [displayData?.frameUrls, displayData?.sections]);

  // 글자수 카운트
  const totalCharCount = React.useMemo(() => {
    if (!displayData) return 0;
    let count = 0;
    count += (displayData.blogTitle ?? "").length;
    count += (displayData.summary ?? "").length;
    for (const s of displayData.sections) {
      count += (s.title ?? "").length;
      count += (s.content ?? "").length;
    }
    count += (displayData.closingCta ?? "").length;
    count += displayData.hashtags.join(" ").length;
    return count;
  }, [displayData]);

  const tabs: { key: ReportTab; label: string }[] = [
    { key: "detailed", label: t("result.tabs.blogPost") },
    { key: "summary", label: t("result.tabs.summary") },
    { key: "easy", label: t("result.tabs.easy") },
    { key: "script", label: t("result.tabs.script") },
  ];

  const tagChips: string[] = [];

  if (!url && !id && !isVideoMode && !isStudyMode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t("result.noUrl")}</p>
          <button onClick={handleGoBack} className="text-gray-900 font-medium hover:underline">
            {t("common.goBack")}
          </button>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("result.conversionFailed")}</h2>
          <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t("result.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {!isComplete ? (
        /* Loading State */
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="flex items-center gap-3 mb-10 animate-pulse" style={{ animationDuration: "2.5s" }}>
            <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-10 w-10" />
            <span className="text-[28px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
          </div>
          <p
            className={`text-gray-900 font-semibold text-lg mb-2 transition-all duration-300 ${
              messageFade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {sseMessage || loadingMessages[messageIndex]}{dots}
          </p>
          <p className="text-[#4F46E5] text-sm font-medium mb-6">
            {Math.min(Math.round(displayProgress), 100)}%
          </p>
          <div className="w-72 h-2 bg-gray-200 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#4F46E5] to-[#818CF8] rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${Math.min(displayProgress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer rounded-full" />
            </div>
          </div>
          <div className="flex gap-1.5 mt-6 mb-8">
            {[0, 20, 40, 60, 80].map((threshold, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                  displayProgress > threshold
                    ? "bg-[#4F46E5] scale-110"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2.5 bg-[#EEF2FF] rounded-full transition-all duration-300 ${
              tipFade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
          >
            <span className="text-[#4F46E5] text-xs font-semibold">TIP</span>
            <p className="text-gray-500 text-sm">{loadingTips[tipIndex]}</p>
          </div>

          {/* 변환 중 사진 업로드 영역 */}
          {!isVideoMode && !isStudyMode && (
            <div className="mt-10 w-full max-w-sm">
              <input
                ref={loadingFileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setUserImages(prev => [...prev, reader.result as string]);
                    };
                    reader.readAsDataURL(file);
                  });
                  e.target.value = "";
                }}
              />
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#4F46E5] transition-colors cursor-pointer"
                onClick={() => loadingFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[#4F46E5]", "bg-[#EEF2FF]"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("border-[#4F46E5]", "bg-[#EEF2FF]"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-[#4F46E5]", "bg-[#EEF2FF]");
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setUserImages(prev => [...prev, reader.result as string]);
                    };
                    reader.readAsDataURL(file);
                  });
                }}
              >
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">{t("result.gallery.uploadDuringConversion")}</p>
                <p className="text-xs text-gray-400 mt-1">{t("result.gallery.uploadHint")}</p>
              </div>
              {userImages.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap justify-center">
                  {userImages.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserImages(prev => prev.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* 타임라인 열기 버튼 (프레임 조기 도착 시) */}
              {galleryUrls.length > 0 && (
                <button
                  onClick={() => setGalleryOpen(true)}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-medium rounded-xl hover:bg-[#4338CA] transition-colors animate-fade-in"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  {t("result.gallery.timelineReady")}
                </button>
              )}
            </div>
          )}
        </div>
      ) : isVideoMode && videoResult ? (
        /* Video Result State */
        <div className="flex min-h-screen">
          {/* ===== 왼쪽 사이드바 (공유 템플릿) ===== */}
          <aside
            className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 overflow-hidden ${
              sidebarOpen ? "w-60" : "w-0"
            }`}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 pt-5 pb-3">
              <div className="flex items-center gap-1.5">
                <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-6 w-6" />
                <span className="text-[15px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="flex-shrink-0 px-3 mb-4">
              <button onClick={handleGoBack} className="w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t("result.newConvertFull")}
              </button>
            </div>
            <nav className="flex-shrink-0 px-3">
              <div className="space-y-0.5">
                <button onClick={() => requireAuth(() => {})} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-[18px] h-[18px] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("result.conversionHistory")}
                </button>
              </div>
            </nav>
            <div className="flex-1" />
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-4">
              <div
                className={`flex items-center gap-3 px-2 ${!user ? "cursor-pointer hover:bg-gray-50 rounded-lg transition-colors" : ""}`}
                onClick={() => { if (!user) setShowLoginModal(true); }}
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate">{user?.name || t("common.guest")}</span>
                  <p className="text-xs text-gray-400 truncate">{user ? t("common.creditsLeft", { count: user.credits }) : t("common.loginRequired")}</p>
                </div>
              </div>
            </div>
          </aside>

          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* ===== 오른쪽 메인 콘텐츠 (비디오) ===== */}
          <div className={`animate-fade-in flex-1 transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-0"}`}>
            {/* 소스 바 */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="max-w-4xl mx-auto px-8 py-3 flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-[#4F46E5]">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 truncate">
                  {(() => {
                    const content = sessionStorage.getItem("blog-to-video-content") ?? "";
                    return content.length > 50 ? content.slice(0, 50) + "..." : content;
                  })()}
                </span>
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="max-w-4xl mx-auto px-8 pt-10 pb-32">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-8">
                {t("result.generatedVideo")}
              </h1>

              {/* 비디오 플레이어 */}
              <div className="flex justify-center mb-10">
                <div className="max-w-sm w-full">
                  <video
                    controls
                    className="w-full rounded-xl shadow-lg bg-black"
                    style={{ aspectRatio: "9/16" }}
                    src={videoResult.videoUrl}
                  />
                </div>
              </div>

              {/* AI 프롬프트 섹션 (접이식) */}
              {videoResult.videoPrompt && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setPromptOpen(!promptOpen)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">{t("result.aiVideoPrompt")}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${promptOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {promptOpen && (
                    <div className="px-5 pb-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed mt-3 whitespace-pre-line">
                        {videoResult.videoPrompt}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 하단 액션 바 */}
            <div className="border-t border-gray-200 mt-8">
              <div className="max-w-4xl mx-auto px-8 py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleGoBack}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t("result.newConvert")}
                  </button>
                  <a
                    href={videoResult.videoUrl}
                    download
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t("result.downloadVideo")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isStudyMode && studyResult?.study_structure ? (
        /* Study Result State — 블로그 결과 페이지와 동일한 레이아웃 */
        <div className="flex min-h-screen">
          {/* ===== 왼쪽 사이드바 (블로그와 완전 동일) ===== */}
          <aside
            className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 overflow-hidden ${
              sidebarOpen ? "w-60" : "w-0"
            }`}
          >
            {/* 로고 + 토글 */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 pt-5 pb-3">
              <div className="flex items-center gap-1.5">
                <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-6 w-6" />
                <span className="text-[15px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* 새 변환 버튼 */}
            <div className="flex-shrink-0 px-3 mb-4">
              <button onClick={handleGoBack} className="w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t("result.newConvertFull")}
              </button>
            </div>

            {/* 변환 기록 */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 mt-2">
              {/* 블로그 변환 */}
              <div className="mb-2">
                <button
                  onClick={() => setBlogSectionOpen((v) => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${blogSectionOpen ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  <svg className="w-[18px] h-[18px] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  <span className="text-sm font-medium text-gray-700">{t("result.blogHistory")}</span>
                </button>
                {blogSectionOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {sidebarHistory.blog.map((c: any) => (
                      <button key={c.id} onClick={() => window.location.href = `/result?id=${c.id}`} className="w-full flex items-center gap-2.5 px-3 py-2 pl-9 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-left">
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="truncate">{c.title || "Untitled"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 학습 노트 */}
              <div className="mb-2">
                <button
                  onClick={() => setStudySectionOpen((v) => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${studySectionOpen ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  <svg className="w-[18px] h-[18px] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <span className="text-sm font-medium text-gray-700">{t("result.studyHistory")}</span>
                </button>
                {studySectionOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {sidebarHistory.study.map((c: any) => (
                      <button key={c.id} onClick={() => window.location.href = `/result?id=${c.id}&mode=study`} className="w-full flex items-center gap-2.5 px-3 py-2 pl-9 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-left">
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="truncate">{c.title || "Untitled"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 하단 영역 */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("common.help")}
              </button>
            </div>

            {/* 유저 프로필 */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-4">
              <div
                className={`flex items-center gap-3 px-2 ${!user ? "cursor-pointer hover:bg-gray-50 rounded-lg transition-colors" : ""}`}
                onClick={() => { if (!user) setShowLoginModal(true); }}
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900 truncate">{user?.name || t("common.guest")}</span>
                    <span className="text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.5 rounded">{user && user.credits > 1 ? t("common.pro") : t("common.free")}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{t("result.creditRemaining", { count: user?.credits ?? 0 })}</p>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              {/* 업그레이드 버튼 */}
              <button
                onClick={() => setShowPricing(true)}
                className="w-full mt-3 py-2.5 bg-[#FEF9C3] hover:bg-[#FEF08A] text-gray-900 text-sm font-medium rounded-lg transition-colors"
              >
                {t("common.upgrade")}
              </button>
            </div>
          </aside>

          {/* 사이드바 닫혔을 때 열기 버튼 */}
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          )}

          {/* ===== 오른쪽 메인 콘텐츠 ===== */}
          <div className={`animate-fade-in flex-1 transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-0"}`}>
            <div className="max-w-4xl mx-auto px-8 pt-10 pb-32">
              {/* 제목 */}
              <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                {studyResult.study_structure.title}
              </h1>
              <div className="flex items-center gap-3 mb-10 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {new Date().toLocaleDateString()}
                </span>
                {studyResult.study_structure.key_concepts?.length > 0 && (
                  <span>{studyResult.study_structure.key_concepts.length} concepts</span>
                )}
                {studyResult.study_structure.study_questions?.length > 0 && (
                  <span>{studyResult.study_structure.study_questions.length} questions</span>
                )}
              </div>

              {/* 핵심 요약 */}
              <section id="study-summary" className="mb-10 scroll-mt-20">
                <div className="flex items-center gap-2 mt-10 mb-4">
                  <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                  <h2 className="font-bold text-gray-900">{t("study.result.executiveSummary")}</h2>
                </div>
                <p className="text-gray-600 leading-[2] whitespace-pre-line">{studyResult.study_structure.executive_summary}</p>
              </section>

              {/* 핵심 개념 */}
              <section id="study-concepts" className="mb-10 scroll-mt-20">
                <div className="flex items-center gap-2 mt-10 mb-4">
                  <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                  <h2 className="font-bold text-gray-900">{t("study.result.keyConcepts")}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studyResult.study_structure.key_concepts.map((concept: any, i: number) => (
                    <div key={i} className="rounded-2xl bg-gray-50 border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          concept.importance === "high" ? "bg-red-400" :
                          concept.importance === "medium" ? "bg-amber-400" :
                          "bg-gray-300"
                        }`} />
                        <h3 className="text-sm font-bold text-gray-900">{concept.name}</h3>
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          concept.importance === "high" ? "bg-red-50 text-red-500" :
                          concept.importance === "medium" ? "bg-amber-50 text-amber-600" :
                          "bg-gray-100 text-gray-400"
                        }`}>
                          {t(`study.result.importance.${concept.importance}`)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{concept.definition}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 상세 노트 */}
              <section id="study-notes" className="mb-10 scroll-mt-20">
                <div className="flex items-center gap-2 mt-10 mb-4">
                  <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                  <h2 className="font-bold text-gray-900">{t("study.result.detailedNotes")}</h2>
                </div>
                {studyResult.study_structure.detailed_notes.map((note: any, i: number) => (
                  <div key={i} id={`study-note-${i}`} className="mb-6 scroll-mt-20">
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-gray-300 text-xs font-mono">{String(i + 1).padStart(2, "0")}</span>
                      {note.topic}
                    </h3>
                    <p className="text-gray-600 leading-[2] whitespace-pre-line">{note.content}</p>
                    {i < studyResult.study_structure.detailed_notes.length - 1 && (
                      <div className="border-b border-gray-100 mt-6" />
                    )}
                  </div>
                ))}
              </section>

              {/* 연습 문제 */}
              <section id="study-questions" className="mb-10 scroll-mt-20">
                <div className="flex items-center gap-2 mt-10 mb-4">
                  <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                  <h2 className="font-bold text-gray-900">{t("study.result.studyQuestions")}</h2>
                </div>
                <div className="space-y-3">
                  {studyResult.study_structure.study_questions.map((q: any, i: number) => (
                    <div key={i} className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => {
                          const next = new Set(openQuestions);
                          next.has(i) ? next.delete(i) : next.add(i);
                          setOpenQuestions(next);
                        }}
                        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-100 transition-colors"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900 flex-1">{q.question}</span>
                        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${openQuestions.has(i) ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openQuestions.has(i) && (
                        <div className="px-5 pb-4 pl-14">
                          <p className="text-sm text-gray-600 leading-relaxed">{q.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 관련 주제 */}
              {studyResult.study_structure.related_topics?.length > 0 && (
                <section id="study-related" className="mb-10 scroll-mt-20">
                  <div className="flex items-center gap-2 mt-10 mb-4">
                    <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                    <h2 className="font-bold text-gray-900">{t("study.result.relatedTopics")}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studyResult.study_structure.related_topics.map((topic: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        {topic}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* 하단 액션 바 (블로그와 동일) */}
            <div className="border-t border-gray-200 mt-8">
              <div className="max-w-4xl mx-auto px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={handleGoBack} className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      {t("result.newConvert")}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert(t("result.linkCopied"));
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {t("result.copyLink")}
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      if (studyResult?.study_content) {
                        await navigator.clipboard.writeText(studyResult.study_content);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      copied ? "bg-green-500 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    {copied ? (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t("result.copied")}</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>{t("result.copyContent")}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Blog Result State - Sidebar + Content */
        <div className="flex min-h-screen">
          {/* ===== 왼쪽 사이드바 ===== */}
          <aside
            className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 overflow-hidden ${
              sidebarOpen ? "w-60" : "w-0"
            }`}
          >
            {/* 로고 + 토글 */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 pt-5 pb-3">
              <div className="flex items-center gap-1.5">
                <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-6 w-6" />
                <span className="text-[15px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* 새 변환 버튼 */}
            <div className="flex-shrink-0 px-3 mb-4">
              <button
                onClick={handleGoBack}
                className="w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t("result.newConvertFull")}
              </button>
            </div>

            {/* 변환 기록 - 블로그/학습 분리 */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 mt-1">
              {/* 블로그 변환 */}
              <div className="mb-3">
                <div className="flex items-center gap-2 px-3 py-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("result.blogHistory")}</span>
                </div>
                <div className="space-y-0.5">
                  {sidebarHistory.blog.map((c: any) => (
                    <button key={c.id} onClick={() => window.location.href = `/result?id=${c.id}`} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-left group">
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="truncate">{c.title || "Untitled"}</span>
                    </button>
                  ))}
                  {sidebarHistory.blog.length === 0 && !displayData && (
                    <p className="px-3 py-1.5 text-xs text-gray-300">{t("result.conversionHistory")}</p>
                  )}
                </div>
              </div>

              {/* 학습 노트 */}
              <div className="mb-3">
                <div className="flex items-center gap-2 px-3 py-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("result.studyHistory")}</span>
                </div>
                <div className="space-y-0.5">
                  {sidebarHistory.study.map((c: any) => (
                    <button key={c.id} onClick={() => window.location.href = `/result?id=${c.id}&mode=study`} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-left group">
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="truncate">{c.title || "Untitled"}</span>
                    </button>
                  ))}
                  {sidebarHistory.study.length === 0 && (
                    <p className="px-3 py-1.5 text-xs text-gray-300">{t("result.conversionHistory")}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 영역 */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("common.help")}
              </button>
            </div>

            {/* 유저 프로필 */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-4">
              <div
                className={`flex items-center gap-3 px-2 ${!user ? "cursor-pointer hover:bg-gray-50 rounded-lg transition-colors" : ""}`}
                onClick={() => { if (!user) setShowLoginModal(true); }}
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900 truncate">{user?.name || t("common.guest")}</span>
                    <span className="text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.5 rounded">{user && user.credits > 1 ? t("common.pro") : t("common.free")}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{t("result.creditRemaining", { count: user?.credits ?? 0 })}</p>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              {/* 업그레이드 버튼 */}
              <button
                onClick={() => setShowPricing(true)}
                className="w-full mt-3 py-2.5 bg-[#FEF9C3] hover:bg-[#FEF08A] text-gray-900 text-sm font-medium rounded-lg transition-colors"
              >
                {t("common.upgrade")}
              </button>
            </div>
          </aside>

          {/* 사이드바 닫혔을 때 열기 버튼 */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* ===== 오른쪽 메인 콘텐츠 ===== */}
          <div
            className={`animate-fade-in flex-1 transition-all duration-300 ${
              sidebarOpen ? "ml-60" : "ml-0"
            }`}
          >
            {/* 메인 콘텐츠 영역 */}
            <div className="max-w-4xl mx-auto px-8 pt-10 pb-32">
              {/* 큰 제목 (편집 가능) */}
              <EditableText
                tag="h1"
                value={displayData?.blogTitle ?? ""}
                onChange={(v) => updateEdited((d) => { d.blogTitle = v; })}
                className="text-3xl font-bold text-gray-900 leading-tight mb-8 px-1 -mx-1"
              />

              {/* 태그 칩 */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-gray-400 text-sm">{t("result.applied")}</span>
                {tagChips.map((chip) => (
                  <span
                    key={chip}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    {chip}
                  </span>
                ))}
                <button
                  onClick={() => setShowEmoji((v) => !v)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    showEmoji
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t("result.includeEmoji")}
                </button>
                <button
                  onClick={() => setShowSubtitle((v) => !v)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    showSubtitle
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t("result.separateSubtitle")}
                </button>
                <button
                  onClick={() => setShowToc((v) => !v)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    showToc
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t("result.toc")}
                </button>
              </div>

              {/* 편집 도구 바 */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {/* 정렬 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-sm mr-1">{t("result.align")}</span>
                  {([
                    { value: "left" as const, icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h16" />
                      </svg>
                    )},
                    { value: "center" as const, icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M6 12h12M4 18h16" />
                      </svg>
                    )},
                    { value: "right" as const, icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 12h12M5 18h16" />
                      </svg>
                    )},
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTextAlign(opt.value)}
                      className={`p-2 rounded-lg transition-colors ${
                        textAlign === opt.value
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {opt.icon}
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-gray-200" />

                {/* 폰트 크기 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-sm mr-1">{t("result.size")}</span>
                  <button
                    onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                    className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-600 w-8 text-center font-mono">{fontSize}</span>
                  <button
                    onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                    className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-200" />

                {/* 폰트 굵기 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-sm mr-1">{t("result.weight")}</span>
                  {([
                    { value: "light" as const, label: "Light" },
                    { value: "normal" as const, label: "Regular" },
                    { value: "medium" as const, label: "Medium" },
                    { value: "bold" as const, label: "Bold" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFontWeight(opt.value)}
                      className={`px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                        fontWeight === opt.value
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      style={{ fontWeight: opt.value === "light" ? 300 : opt.value === "normal" ? 400 : opt.value === "medium" ? 500 : 700 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 편집 안내 힌트 */}
              <div className="flex items-center gap-1.5 mb-10 text-gray-400 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {t("result.editHint")}
              </div>

              {/* 플로팅 툴바 (텍스트 선택 시 표시) */}
              <FloatingToolbar containerRef={blogContentRef} />

              {/* 블로그 본문 영역 (정렬 + 크기 + 굵기 적용) */}
              <div ref={blogContentRef} style={{ textAlign, fontSize: `${fontSize}px`, fontWeight: fontWeight === "light" ? 300 : fontWeight === "normal" ? 400 : fontWeight === "medium" ? 500 : 700 }}>

              {/* 요약(도입부) 텍스트 */}
              <div className="mb-6">
                <EditableText
                  value={displayData?.summary ?? ""}
                  onChange={(v) => updateEdited((d) => { d.summary = v; })}
                  className="text-gray-700 leading-[2] whitespace-pre-line px-1 -mx-1"
                />
              </div>

              {/* 도입부 이미지 */}
              {introFrameIndex >= 0 && displayData?.frameUrls[introFrameIndex] && (
                <BlogImage
                  src={displayData.frameUrls[introFrameIndex]}
                  alt="영상 프레임"
                  onReplace={(newSrc) => updateEdited((d) => { d.frameUrls[introFrameIndex] = newSrc; })}
                  onDelete={() => updateEdited((d) => { d.frameUrls.splice(introFrameIndex, 1); })}
                />
              )}

              {/* 목차 (토글) */}
              {showToc && displayData?.toc && (
                <div className="my-10 rounded-2xl bg-gray-50 border border-gray-200 px-6 py-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="text-sm font-bold text-gray-700">{t("result.toc")}</span>
                  </div>
                  <div className="space-y-1">
                    {displayData.toc.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 py-1.5 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors group"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-400 group-hover:border-gray-900 group-hover:text-gray-900 transition-colors">
                          {item.id}
                        </span>
                        <span>{showEmoji ? `${item.emoji} ` : ""}{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 본문 섹션 — 네이버 블로그 스타일 */}
              {displayData?.sections.map((section, idx) => {
                const hasFrameMatching = displayData.sections.some(
                  (s) => s.frame_index != null && s.frame_index >= 0
                );
                let frameUrl: string | undefined;
                if (hasFrameMatching) {
                  if (
                    section.frame_index != null &&
                    section.frame_index >= 0 &&
                    section.frame_index < displayData.frameUrls.length &&
                    section.frame_index !== introFrameIndex // 도입부 이미지와 중복 방지
                  ) {
                    frameUrl = displayData.frameUrls[section.frame_index];
                  }
                } else {
                  const fallbackIdx = idx + 1;
                  if (fallbackIdx !== introFrameIndex) { // 도입부 이미지와 중복 방지
                    frameUrl = displayData.frameUrls?.[fallbackIdx];
                  }
                }

                return (
                  <div key={idx} className="mb-4">
                    {/* 섹션 제목 */}
                    {showSubtitle && (
                      <div className="flex items-center gap-2 mt-10 mb-4">
                        <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                        <EditableText
                          tag="h2"
                          value={showEmoji ? `${section.emoji} ${section.title}` : section.title}
                          onChange={(v) => updateEdited((d) => {
                            const match = v.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*(.*)$/u);
                            if (match) {
                              d.sections[idx].emoji = match[1];
                              d.sections[idx].title = match[2];
                            } else {
                              d.sections[idx].title = v;
                            }
                          })}
                          className="font-bold text-gray-900 px-1 -mx-1"
                        />
                      </div>
                    )}

                    {/* 섹션 본문 */}
                    <EditableText
                      value={section.content}
                      onChange={(v) => updateEdited((d) => { d.sections[idx].content = v; })}
                      className="text-gray-600 leading-[2] whitespace-pre-line px-1 -mx-1"
                    />

                    {/* 섹션 이미지 */}
                    {frameUrl && (() => {
                      const frameIdx = hasFrameMatching
                        ? (section.frame_index != null && section.frame_index >= 0 ? section.frame_index : -1)
                        : idx + 1;
                      return (
                        <BlogImage
                          src={frameUrl}
                          alt={`프레임 - ${section.title}`}
                          onReplace={(newSrc) => {
                            if (frameIdx >= 0) {
                              updateEdited((d) => { d.frameUrls[frameIdx] = newSrc; });
                            }
                          }}
                          onDelete={() => {
                            if (frameIdx >= 0) {
                              updateEdited((d) => {
                                d.frameUrls.splice(frameIdx, 1);
                                // frame_index 보정
                                for (const s of d.sections) {
                                  if (s.frame_index != null && s.frame_index > frameIdx) {
                                    s.frame_index--;
                                  } else if (s.frame_index === frameIdx) {
                                    s.frame_index = -1;
                                  }
                                }
                              });
                            }
                          }}
                        />
                      );
                    })()}

                    {/* 사용자가 갤러리에서 추가한 이미지들 */}
                    {section.extraImages?.map((imgUrl, imgIdx) => (
                      <BlogImage
                        key={`extra-${idx}-${imgIdx}`}
                        src={imgUrl}
                        alt={`추가 이미지 ${imgIdx + 1}`}
                        onReplace={(newSrc) => {
                          updateEdited((d) => {
                            if (d.sections[idx].extraImages) {
                              d.sections[idx].extraImages![imgIdx] = newSrc;
                            }
                          });
                        }}
                        onDelete={() => {
                          updateEdited((d) => {
                            d.sections[idx].extraImages?.splice(imgIdx, 1);
                          });
                        }}
                      />
                    ))}

                    {/* 섹션 사이 "+" 사진 추가 버튼 */}
                    <div className="flex justify-center py-2 opacity-40 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleAddPhotoClick(idx)}
                        className="px-3 py-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg hover:text-[#4F46E5] hover:border-[#4F46E5] transition-colors"
                      >
                        {t("result.gallery.addPhoto")}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 해시태그 (편집 가능) */}
              {displayData?.hashtags && displayData.hashtags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-gray-100">
                  <EditableText
                    value={displayData.hashtags.join(" ")}
                    onChange={(v) => updateEdited((d) => {
                      d.hashtags = v.split(/\s+/).filter(Boolean).map(
                        (t) => t.startsWith("#") ? t : `#${t}`
                      );
                    })}
                    className="text-[#4F46E5] px-1 -mx-1"
                  />
                </div>
              )}

              {/* ===== 학습 노트 섹션 (블로그 변환에서 병렬 생성) ===== */}
              {blogStudyStructure && (
                <div className="mt-16 pt-10 border-t-2 border-gray-200">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{t("study.result.sectionTitle")}</h2>
                  </div>

                  {/* 핵심 요약 */}
                  <section id="blog-study-summary" className="mb-10 scroll-mt-20">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                      <h3 className="font-bold text-gray-900">{t("study.result.executiveSummary")}</h3>
                    </div>
                    <p className="text-gray-600 leading-[2] whitespace-pre-line">{blogStudyStructure.executive_summary}</p>
                  </section>

                  {/* 핵심 개념 */}
                  {blogStudyStructure.key_concepts?.length > 0 && (
                    <section id="blog-study-concepts" className="mb-10 scroll-mt-20">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                        <h3 className="font-bold text-gray-900">{t("study.result.keyConcepts")}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {blogStudyStructure.key_concepts.map((concept: any, i: number) => (
                          <div key={i} className="rounded-2xl bg-gray-50 border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                concept.importance === "high" ? "bg-red-400" :
                                concept.importance === "medium" ? "bg-amber-400" :
                                "bg-gray-300"
                              }`} />
                              <h4 className="text-sm font-bold text-gray-900">{concept.name}</h4>
                              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                concept.importance === "high" ? "bg-red-50 text-red-500" :
                                concept.importance === "medium" ? "bg-amber-50 text-amber-600" :
                                "bg-gray-100 text-gray-400"
                              }`}>
                                {t(`study.result.importance.${concept.importance}`)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">{concept.definition}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 상세 노트 */}
                  {blogStudyStructure.detailed_notes?.length > 0 && (
                    <section id="blog-study-notes" className="mb-10 scroll-mt-20">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                        <h3 className="font-bold text-gray-900">{t("study.result.detailedNotes")}</h3>
                      </div>
                      {blogStudyStructure.detailed_notes.map((note: any, i: number) => (
                        <div key={i} id={`blog-study-note-${i}`} className="mb-6 scroll-mt-20">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-gray-300 text-xs font-mono">{String(i + 1).padStart(2, "0")}</span>
                            {note.topic}
                          </h4>
                          <p className="text-gray-600 leading-[2] whitespace-pre-line">{note.content}</p>
                          {i < blogStudyStructure.detailed_notes.length - 1 && (
                            <div className="border-b border-gray-100 mt-6" />
                          )}
                        </div>
                      ))}
                    </section>
                  )}

                  {/* 연습 문제 */}
                  {blogStudyStructure.study_questions?.length > 0 && (
                    <section id="blog-study-questions" className="mb-10 scroll-mt-20">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                        <h3 className="font-bold text-gray-900">{t("study.result.studyQuestions")}</h3>
                      </div>
                      <div className="space-y-3">
                        {blogStudyStructure.study_questions.map((q: any, i: number) => (
                          <div key={i} className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
                            <button
                              onClick={() => {
                                const next = new Set(openBlogStudyQuestions);
                                next.has(i) ? next.delete(i) : next.add(i);
                                setOpenBlogStudyQuestions(next);
                              }}
                              className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-100 transition-colors"
                            >
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-900 flex-1">{q.question}</span>
                              <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${openBlogStudyQuestions.has(i) ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {openBlogStudyQuestions.has(i) && (
                              <div className="px-5 pb-4 pl-14">
                                <p className="text-sm text-gray-600 leading-relaxed">{q.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 관련 주제 */}
                  {blogStudyStructure.related_topics?.length > 0 && (
                    <section id="blog-study-related" className="mb-10 scroll-mt-20">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-6 bg-gray-800 rounded-sm flex-shrink-0" />
                        <h3 className="font-bold text-gray-900">{t("study.result.relatedTopics")}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {blogStudyStructure.related_topics.map((topic: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              </div>{/* /블로그 본문 정렬 wrapper */}
            </div>

            {/* 하단 액션 바 */}
            <div className="border-t border-gray-200 mt-8">
              <div className="max-w-4xl mx-auto px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {totalCharCount > 0 && (
                      <span className="text-xs text-gray-400 font-medium tabular-nums mr-1">
                        {totalCharCount.toLocaleString()}자
                      </span>
                    )}
                    <button
                      onClick={handleGoBack}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t("result.newConvert")}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert(t("result.linkCopied"));
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {t("result.copyLink")}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setInsertAfterIdx(null);
                        if (galleryUrls.length > 0) {
                          setGalleryOpen(true);
                        } else {
                          sectionFileRef.current?.click();
                        }
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t("result.gallery.addPhoto")}
                    </button>
                    {displayData?.frameUrls && displayData.frameUrls.length > 0 && (
                      <button
                        onClick={handleDownloadImages}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {downloading ? t("result.downloading") : t("result.downloadImages")}
                      </button>
                    )}
                    <button
                      onClick={handleCopyContent}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-medium ${
                        copied
                          ? "bg-green-500 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t("result.copied")}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {t("result.copyContent")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 섹션 사진 추가용 숨김 파일 입력 */}
      <input
        ref={sectionFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSectionFileUpload(file);
          e.target.value = "";
        }}
      />
      {/* 비디오 타임라인 (CapCut 스타일) */}
      {galleryOpen && galleryUrls.length > 0 && (
        <VideoTimeline
          frameUrls={galleryUrls}
          videoDuration={videoDuration}
          onSelectFrame={handleInsertFrame}
          onClose={() => {
            setGalleryOpen(false);
            setInsertAfterIdx(null);
          }}
          onUploadFromDevice={() => {
            sectionFileRef.current?.click();
          }}
        />
      )}

      {/* 요금제 모달 */}
      {showPricing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPricing(false)}
          />
          {/* 모달 본체 */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowPricing(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 헤더 */}
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t("pricing.selectPlan")}</h2>
              <p className="text-sm text-gray-500">
                {t("pricing.modalSubtitle")}
              </p>
            </div>

            {/* 요금제 카드 */}
            <div className="px-8 pb-8">
              <div className="grid md:grid-cols-3 gap-0 border border-gray-200 rounded-xl overflow-hidden">
                {/* 무료 테스터 */}
                <div className="p-5 border-b md:border-b-0 md:border-r border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t("pricing.free.name")}</h3>
                  <p className="text-xs text-gray-400 mb-3">{t("pricing.free.desc")}</p>
                  <div className="mb-0.5">
                    <span className="text-3xl font-bold text-gray-900">{t("pricing.free.price")}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{t("pricing.free.period")}</p>
                  <button
                    onClick={() => setShowPricing(false)}
                    className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-lg text-sm mb-5"
                  >
                    {t("common.currentPlan")}
                  </button>
                  <ul className="space-y-2.5">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5 text-xs">✓</span>
                        <span className="text-xs text-gray-600">{t(`pricing.modalFreeFeatures.${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 스타터 팩 */}
                <div className="p-5 border-b md:border-b-0 md:border-r border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t("pricing.starter.name")}</h3>
                  <p className="text-xs text-gray-400 mb-3">{t("pricing.starter.desc")}</p>
                  <div className="mb-0.5">
                    <span className="text-3xl font-bold text-gray-900">{t("pricing.starter.price")}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{t("pricing.starter.period")}</p>
                  <button
                    onClick={() => handlePurchase("starter")}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-[#4F46E5] text-white font-medium rounded-lg hover:bg-[#4338CA] active:scale-[0.98] transition-all text-sm mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? t("common.processing") : t("common.purchase")}
                  </button>
                  <ul className="space-y-2.5">
                    {[0, 1, 2, 3].map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5 text-xs">✓</span>
                        <span className="text-xs text-gray-600">{t(`pricing.modalStarterFeatures.${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 프로 팩 */}
                <div className="p-5 relative">
                  <span className="absolute top-4 right-4 px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-medium rounded-full">{t("common.recommended")}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t("pricing.pro.name")}</h3>
                  <p className="text-xs text-gray-400 mb-3">{t("pricing.modalProDesc")}</p>
                  <div className="mb-0.5">
                    <span className="text-3xl font-bold text-gray-900">{t("pricing.pro.price")}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{t("pricing.pro.period")}</p>
                  <button
                    onClick={() => handlePurchase("pro")}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-[#4F46E5] text-white font-medium rounded-lg hover:bg-[#4338CA] active:scale-[0.98] transition-all text-sm mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? t("common.processing") : t("common.purchase")}
                  </button>
                  <ul className="space-y-2.5">
                    {[0, 1, 2, 3].map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5 text-xs">✓</span>
                        <span className="text-xs text-gray-600">{t(`pricing.modalProFeatures.${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative z-10 bg-white rounded-2xl p-8 w-full max-w-sm mx-4 shadow-xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center justify-center gap-2 mb-6">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-7 w-7" />
              <span className="text-[22px] font-extrabold text-gray-900 font-[var(--font-poppins)] tracking-tight">LOGOS.ai</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{t("login.title")}</h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              {t("login.subtitle")}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleSocialLogin("kakao")}
                disabled={loginLoading !== null}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#FEE500] text-[#000000] font-medium rounded-lg hover:bg-[#FDD800] transition-colors disabled:opacity-60"
              >
                {loginLoading === "kakao" ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.758 1.819 5.178 4.545 6.545-.2.745-.727 2.702-.832 3.12-.13.52.19.512.4.373.164-.109 2.612-1.771 3.672-2.489.71.099 1.447.151 2.215.151 5.523 0 10-3.463 10-7.714S17.523 3 12 3z"/>
                  </svg>
                )}
                {loginLoading === "kakao" ? t("common.connecting") : t("login.kakao")}
              </button>

              <button
                onClick={() => handleSocialLogin("naver")}
                disabled={loginLoading !== null}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#03C75A] text-white font-medium rounded-lg hover:bg-[#02b350] transition-colors disabled:opacity-60"
              >
                {loginLoading === "naver" ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                  </svg>
                )}
                {loginLoading === "naver" ? t("common.connecting") : t("login.naver")}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              {t("login.terms")}<a href="#" className="underline">{t("login.termsOfService")}</a>{t("login.and")}<a href="#" className="underline">{t("login.privacyPolicy")}</a>{t("login.termsEnd")}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#4F46E5] rounded-full w-1/3 animate-pulse" />
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
