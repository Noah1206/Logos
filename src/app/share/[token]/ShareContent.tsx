"use client";

interface BlogSection {
  emoji: string;
  title: string;
  content: string;
}

interface ResultJson {
  blogTitle?: string;
  summary?: string;
  sections?: BlogSection[];
  hashtags?: string[];
  closingCta?: string;
  frameUrls?: string[];
}

interface ConversionData {
  id: string;
  title: string | null;
  mode: string;
  platform: string;
  resultJson: unknown;
  createdAt: Date;
}

export default function ShareContent({ conversion }: { conversion: ConversionData }) {
  const data = conversion.resultJson as ResultJson | null;

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">콘텐츠를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <a href="/" className="flex items-center gap-2">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-6 w-6 translate-y-[2px]" />
              <span className="text-lg font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>LOGOS.ai</span>
            </a>
            <a
              href="/"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              나도 변환하기
            </a>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <article className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10">
          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
            {data.blogTitle || conversion.title}
          </h1>

          {/* 메타 */}
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-8">
            <span>{new Date(conversion.createdAt).toLocaleDateString("ko-KR")}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="capitalize">{conversion.platform}</span>
          </div>

          {/* 도입부 */}
          {data.summary && (
            <p className="text-gray-600 leading-[1.9] whitespace-pre-line mb-8">
              {data.summary}
            </p>
          )}

          {/* 섹션 */}
          {data.sections?.map((s, i) => (
            <section key={i} className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {s.emoji} {s.title}
              </h2>
              <p className="text-gray-600 leading-[1.9] whitespace-pre-line">
                {s.content}
              </p>
            </section>
          ))}

          {/* CTA */}
          {data.closingCta && (
            <p className="text-gray-600 leading-[1.9] whitespace-pre-line mb-8">
              {data.closingCta}
            </p>
          )}

          {/* 해시태그 */}
          {data.hashtags && data.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {data.hashtags.map((tag, i) => (
                <span key={i} className="text-sm text-blue-500">{tag}</span>
              ))}
            </div>
          )}
        </article>

        {/* 하단 CTA */}
        <div className="mt-8 text-center">
          <div className="inline-flex flex-col items-center gap-3 bg-white border border-gray-200 rounded-2xl px-8 py-6">
            <div className="flex items-center gap-2">
              <img src="/images/brain-icon.png" alt="LOGOS.ai" className="h-5 w-5" />
              <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>LOGOS.ai</span>
            </div>
            <p className="text-sm text-gray-500">이 글은 LOGOS.ai로 자동 생성되었습니다</p>
            <a
              href="/"
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              나도 변환하기 →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
