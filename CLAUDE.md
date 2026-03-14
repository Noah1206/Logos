# Shorts2Blog - 쇼츠/릴스 → 네이버 블로그 SEO 자동 변환 SaaS

## 프로젝트 개요

**서비스명**: Shorts2Blog (가칭)
**핵심 가치**: 유튜브 쇼츠/인스타 릴스 링크만 넣으면 네이버 블로그 SEO 최적화 글로 자동 변환

### 타겟 고객
- 학원장, 헬스장 관장, 동네 맛집 사장님
- 개인 크리에이터, 1인 마케터
- 영상 콘텐츠는 만들지만 블로그 글 작성에 시간이 없는 자영업자

### 핵심 문제 해결
- 영상 → 블로그 글 변환에 1시간+ 소요 → **1분 내 자동 완료**
- 블로그 대행사 비용 월 수십~백만원 → **건당 1,000원 미만**

---

## 기술 스택

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **상태관리**: Zustand (필요시)
- **폼 처리**: React Hook Form + Zod

### Backend
- **API Routes**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth)
- **ORM**: Prisma

### 외부 API
- **음성 추출**: OpenAI Whisper API 또는 AssemblyAI
- **텍스트 생성**: OpenAI GPT-4o / Claude API
- **영상 다운로드**: yt-dlp (유튜브), Instaloader (인스타)

### 결제
- **결제 게이트웨이**: 포트원(PortOne) + KG이니시스
- **과금 방식**: 크레딧 기반 종량제

### 배포
- **호스팅**: Vercel
- **도메인**: 추후 결정

---

## 핵심 기능 (MVP)

### 1. 링크 입력 및 변환
```
입력: 유튜브 쇼츠 URL 또는 인스타 릴스 URL
처리:
  1. URL 파싱 및 플랫폼 감지
  2. 영상 오디오 추출
  3. STT(Speech-to-Text) 변환
  4. AI 프롬프트로 네이버 블로그 스타일 재작성
출력: 네이버 블로그 최적화 글 (복사 가능)
```

### 2. 네이버 블로그 최적화 요소
- 이모지 적절히 포함
- 소제목(##) 분리 구조
- 체류시간 늘리는 단락 구성
- 네이버 SEO 키워드 자연 삽입
- 행간/여백 최적화된 포맷

### 3. 크레딧 시스템
- 회원가입 시 무료 1회 제공
- 스타터 팩: 9,900원 / 10건
- 프로 팩: 29,000원 / 50건

---

## 프로젝트 구조

```
/src
├── app/
│   ├── page.tsx              # 메인 (변환 UI)
│   ├── layout.tsx
│   ├── api/
│   │   ├── convert/route.ts  # 변환 API
│   │   ├── auth/[...]/       # 인증 관련
│   │   └── payment/route.ts  # 결제 웹훅
│   ├── pricing/page.tsx      # 가격 페이지
│   └── dashboard/page.tsx    # 사용 내역
├── components/
│   ├── ui/                   # 공통 UI 컴포넌트
│   ├── ConvertForm.tsx       # 링크 입력 폼
│   ├── ResultDisplay.tsx     # 결과 표시
│   └── CreditBadge.tsx       # 크레딧 잔여량
├── lib/
│   ├── openai.ts             # OpenAI 클라이언트
│   ├── video-extractor.ts    # 영상 오디오 추출
│   ├── stt.ts                # Speech-to-Text
│   └── blog-generator.ts     # 블로그 글 생성
├── hooks/
│   └── useCredits.ts         # 크레딧 관리 훅
└── types/
    └── index.ts
```

---

## 개발 우선순위

### 완료된 기능
- [x] 프로젝트 초기 설정 (Next.js + Tailwind)
- [x] 메인 UI (입력창 + 버튼 + 결과창)
- [x] 유튜브 쇼츠 오디오 추출 기능
- [x] OpenAI Whisper STT 연동
- [x] GPT-4o 블로그 글 생성 프롬프트
- [x] Supabase Auth 연동 (이메일/소셜 로그인)
- [x] 크레딧 시스템 DB 설계
- [x] 무료 1회 변환 로직
- [x] 포트원 + KG이니시스 연동
- [x] 크레딧 패키지 구매 플로우
- [x] 결제 완료 웹훅 처리
- [x] 글 톤/스타일 커스터마이징
- [x] i18n 영어/한국어 전환
- [x] Google Analytics 태그
- [x] sitemap.xml / robots.txt
- [x] 인스타 릴스/피드 지원 (프론트 + FastAPI 프록시)
- [x] 변환 히스토리 저장 (DB 자동 저장 + 사이드바 표시)
- [x] 네이버 블로그 에디터 최적화 복사 (소제목·이미지·해시태그 포맷)
- [x] 변환 결과 공유 링크 (shareToken + OG태그 + 공개 뷰)
- [x] 크롬 확장 프로그램 (유튜브 쇼츠 → 원클릭 변환)
- [x] 무료 블로그 SEO 점수 체크기 (/tools/seo-check)
- [x] ?url= 쿼리 파라미터 자동 입력

### 미구현 기능
1. [ ] 네이버 블로그 직접 발행 (API 연동)
2. [ ] 네이버 키워드 순위 체크 기능

---

## 핵심 프롬프트 (블로그 생성용)

```
당신은 네이버 블로그 SEO 전문 작가입니다.

다음 영상 스크립트를 네이버 블로그 포스팅으로 변환해주세요.

[변환 규칙]
1. 제목: 검색 키워드 포함, 호기심 유발
2. 도입부: 공감 유도 + 문제 제기 (2-3문장)
3. 본문: 소제목(##)으로 구분, 각 섹션 3-5문장
4. 이모지: 자연스럽게 포인트마다 1-2개
5. 문장: 짧고 읽기 쉽게, 구어체 사용
6. 마무리: CTA(행동 유도) 포함
7. 해시태그: 관련 키워드 5-7개

[영상 스크립트]
{transcript}

[출력 형식]
마크다운 형식으로, 네이버 블로그에 바로 붙여넣기 가능하게 작성
```

---

## 코딩 컨벤션

### 파일명
- 컴포넌트: PascalCase (예: `ConvertForm.tsx`)
- 유틸/훅: camelCase (예: `useCredits.ts`)
- API 라우트: kebab-case 폴더 구조

### 컴포넌트
- 함수형 컴포넌트 + TypeScript
- Props는 interface로 정의
- 서버 컴포넌트 우선, 필요시 'use client'

### API
- 에러 응답 일관된 형식: `{ error: string, code: string }`
- 성공 응답: `{ data: T, message?: string }`

### 환경변수
```
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_PORTONE_STORE_ID=
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=
PORTONE_API_SECRET=
```

---

## 참고 자료

- [Next.js 14 문서](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [포트원 V2 문서](https://developers.portone.io/)
- [포트원 + KG이니시스 연동](https://developers.portone.io/opi/ko/integration/pg/v2/inicis-v2)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

---

## 주의사항

1. **영상 다운로드 법적 이슈**: 사용자 본인 콘텐츠만 변환하도록 약관 명시
2. **API 비용 관리**: 토큰 사용량 모니터링, 크레딧 가격에 마진 포함
3. **인스타 API 제한**: 공식 API 없음, 스크래핑 시 주의 필요
4. **네이버 블로그 SEO**: 최신 알고리즘 변화 지속 모니터링
