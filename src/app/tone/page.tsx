"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const tones = [
  {
    key: "일상" as const,
    label: "일상 블로그",
    emoji: "✨",
    desc: "감성 브이로그 스타일",
    features: [
      "자연스러운 구어체",
      "감성적인 이모지 활용",
      "일상 공유 톤앤매너",
      "친근한 말투",
    ],
  },
  {
    key: "자영업자" as const,
    label: "자영업자 블로그",
    emoji: "🏪",
    desc: "매장 홍보 스타일",
    features: [
      "매장/서비스 어필 중심",
      "위치·가격 정보 강조",
      "방문 유도 CTA 포함",
      "신뢰감 있는 톤",
    ],
  },
];

function ToneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url") || "";
  const [selected, setSelected] = useState<"일상" | "자영업자" | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [checkedImages, setCheckedImages] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_FILE_SIZE
    );
    if (fileArray.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    const toProcess = fileArray.slice(0, remaining);

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          const newIndex = prev.length;
          setCheckedImages((cs) => new Set([...cs, newIndex]));
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  // 페이지 전체 붙여넣기
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addFiles]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setCheckedImages((prev) => {
      const next = new Set<number>();
      for (const idx of prev) {
        if (idx < index) next.add(idx);
        else if (idx > index) next.add(idx - 1);
      }
      return next;
    });
  };

  const toggleCheck = (index: number) => {
    setCheckedImages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleStart = () => {
    if (!selected || !url) return;
    // 체크된 이미지만 sessionStorage에 저장
    const selectedImages = images.filter((_, i) => checkedImages.has(i));
    if (selectedImages.length > 0) {
      sessionStorage.setItem("user_images", JSON.stringify(selectedImages));
    } else {
      sessionStorage.removeItem("user_images");
    }
    router.push(`/result?url=${encodeURIComponent(url)}&tone=${encodeURIComponent(selected)}`);
  };

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
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="pt-16 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            블로그 톤 선택
          </h1>
          <p className="text-gray-500 text-sm md:text-base mb-12">
            어떤 스타일의 블로그 글을 원하시나요?
          </p>

          {/* Tone Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {tones.map((tone) => (
              <button
                key={tone.key}
                onClick={() => setSelected(tone.key)}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                  selected === tone.key
                    ? "border-[#4F46E5] bg-[#EEF2FF] shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                {/* Selected indicator */}
                {selected === tone.key && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-[#4F46E5] rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className="text-3xl mb-3">{tone.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{tone.label}</h3>
                <p className={`text-sm mb-4 ${selected === tone.key ? "text-[#4F46E5]" : "text-gray-500"}`}>
                  {tone.desc}
                </p>
                <ul className="space-y-1.5">
                  {tone.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`w-1 h-1 rounded-full ${selected === tone.key ? "bg-[#4F46E5]" : "bg-gray-300"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Image Upload Section */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              사진 추가 <span className="text-sm font-normal text-gray-400">(선택)</span>
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              블로그에 넣고 싶은 사진이 있으면 추가해주세요. 복사+붙여넣기도 가능해요.
            </p>

            {/* Drop zone */}
            <div
              ref={dropZoneRef}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
              }}
              onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer ${
                isDragging
                  ? "border-[#4F46E5] bg-[#EEF2FF]"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {images.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <p className="text-sm text-gray-400">
                    클릭하거나 사진을 드래그하세요
                  </p>
                  <p className="text-xs text-gray-300">
                    Ctrl+V로 붙여넣기도 가능 · 최대 {MAX_IMAGES}장
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((src, i) => (
                    <div key={i} className="relative group">
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleCheck(i); }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          checkedImages.has(i)
                            ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/20"
                            : "border-transparent opacity-50"
                        }`}
                      >
                        <img
                          src={src}
                          alt={`업로드 ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* 체크박스 */}
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleCheck(i); }}
                        className={`absolute bottom-1.5 left-1.5 w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all ${
                          checkedImages.has(i)
                            ? "bg-[#4F46E5]"
                            : "bg-white/80 border border-gray-300"
                        }`}
                      >
                        {checkedImages.has(i) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <div className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-300 text-2xl hover:border-gray-300 hover:text-gray-400 transition-colors">
                      +
                    </div>
                  )}
                </div>
              )}
            </div>
            {images.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-right">
                {checkedImages.size}장 선택 / {images.length}장 업로드
              </p>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStart}
            disabled={!selected}
            className={`px-10 py-4 text-base font-medium rounded-full transition-all duration-200 ${
              selected
                ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] hover:scale-[0.98] active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            변환 시작
          </button>
        </div>
      </section>
    </main>
  );
}

export default function TonePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <ToneContent />
    </Suspense>
  );
}
