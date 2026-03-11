"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "@/i18n";

interface VideoTimelineProps {
  frameUrls: string[];
  videoDuration: number | null;
  onSelectFrame: (frameUrl: string) => void;
  onClose: () => void;
  onUploadFromDevice: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoTimeline({
  frameUrls,
  videoDuration,
  onSelectFrame,
  onClose,
  onUploadFromDevice,
}: VideoTimelineProps) {
  const { t } = useTranslation();
  const totalFrames = frameUrls.length;
  const duration = videoDuration || totalFrames;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload adjacent frames
  useEffect(() => {
    const start = Math.max(0, currentIndex - 3);
    const end = Math.min(totalFrames - 1, currentIndex + 3);
    for (let i = start; i <= end; i++) {
      const img = new Image();
      img.src = frameUrls[i];
    }
  }, [currentIndex, frameUrls, totalFrames]);

  // Calculate frame index from pointer position
  const getIndexFromPointer = useCallback(
    (clientX: number): number => {
      const strip = stripRef.current;
      if (!strip) return 0;
      const rect = strip.getBoundingClientRect();
      const scrollLeft = strip.scrollLeft;
      // Frame width: 80px desktop, 56px mobile (we'll use actual child width)
      const frameWidth = strip.firstElementChild
        ? (strip.firstElementChild as HTMLElement).offsetWidth +
          4 /* gap-1 = 4px */
        : 80;
      const x = clientX - rect.left + scrollLeft;
      const idx = Math.floor(x / frameWidth);
      return Math.max(0, Math.min(totalFrames - 1, idx));
    },
    [totalFrames]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const idx = getIndexFromPointer(e.clientX);
      setCurrentIndex(idx);
    },
    [getIndexFromPointer]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const idx = getIndexFromPointer(e.clientX);
      setCurrentIndex(idx);
    },
    [isDragging, getIndexFromPointer]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFrameClick = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleAddToBlog = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < frameUrls.length) {
      onSelectFrame(frameUrls[selectedIndex]);
    }
  }, [selectedIndex, frameUrls, onSelectFrame]);

  // Auto-scroll strip to keep currentIndex visible
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const child = strip.children[currentIndex] as HTMLElement | undefined;
    if (!child) return;
    const stripRect = strip.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    if (childRect.left < stripRect.left) {
      strip.scrollLeft -= stripRect.left - childRect.left + 40;
    } else if (childRect.right > stripRect.right) {
      strip.scrollLeft += childRect.right - stripRect.right + 40;
    }
  }, [currentIndex]);

  const currentTime = videoDuration
    ? (currentIndex / Math.max(totalFrames - 1, 1)) * videoDuration
    : currentIndex;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-2xl flex flex-col animate-slide-up max-h-[55vh] md:max-h-[55vh]"
      style={{ maxHeight: "min(55vh, 480px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-gray-900 text-sm">
          {t("result.gallery.title")}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              onUploadFromDevice();
            }}
            className="px-3 py-1.5 text-xs font-medium text-[#4F46E5] border border-[#4F46E5] rounded-lg hover:bg-[#EEF2FF] transition-colors"
          >
            {t("result.gallery.uploadFromDevice")}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-shrink-0 flex flex-col items-center py-3 px-4">
        <div className="relative w-full max-w-[320px] aspect-[9/16] max-h-[200px] md:max-h-[240px] rounded-xl overflow-hidden bg-gray-100 shadow-sm">
          <img
            src={frameUrls[currentIndex]}
            alt={`Frame ${currentIndex}`}
            className="w-full h-full object-cover transition-opacity duration-150"
            draggable={false}
          />
          {/* Timestamp overlay */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-black/60 rounded-full text-[11px] text-white font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          {/* Selected checkmark */}
          {selectedIndex === currentIndex && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-[#4F46E5] rounded-full flex items-center justify-center shadow">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Filmstrip */}
      <div className="flex-shrink-0 px-2 pb-1">
        <p className="text-[10px] text-gray-400 text-center mb-1.5">
          {t("result.gallery.scrubHint")}
        </p>
        <div
          ref={stripRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide py-1 px-1 cursor-grab active:cursor-grabbing select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "none" }}
        >
          {frameUrls.map((url, i) => {
            const isActive = i === currentIndex;
            const isSelected = i === selectedIndex;
            return (
              <div
                key={i}
                className={`flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-150 ${
                  isSelected
                    ? "border-[#4F46E5] ring-1 ring-[#4F46E5]/30"
                    : isActive
                    ? "border-[#818CF8]"
                    : "border-transparent"
                }`}
                style={{ width: 56, height: 56 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFrameClick(i);
                }}
              >
                <img
                  src={url}
                  alt={`${i}s`}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                  draggable={false}
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#4F46E5] rounded-full flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100">
        <button
          onClick={handleAddToBlog}
          disabled={selectedIndex === null}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            selectedIndex !== null
              ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:scale-[0.98]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {t("result.gallery.addToBlog")}
        </button>
      </div>
    </div>
  );
}
