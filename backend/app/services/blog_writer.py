"""
핵심 블로그 생성 엔진
음성 + 화면 텍스트 + 영상 설명 → 네이버 블로그 SEO 최적화 글 (단일 GPT 호출)

이 모듈이 Shorts2Blog 서비스의 기둥입니다.
"""
import json
from openai import OpenAI
from typing import Optional, List
from ..models.schemas import BlogStructure, BlogSection, SEOKeywords
from ..core.config import get_settings

settings = get_settings()


BLOG_WRITER_PROMPT = """당신은 대한민국에서 가장 잘 나가는 네이버 블로그 작가입니다.
영상에서 추출한 정보를 받아서, 네이버 블로그에 바로 복사+붙여넣기 할 수 있는 완성된 글을 작성합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 네이버 블로그 글쓰기 절대 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【문체 규칙 - 진짜 사람처럼】
- 구어체 필수: ~했어요, ~인데요, ~거든요, ~더라고요, ~같아요, ~잖아요
- 한 문장은 자연스러운 호흡으로, 너무 짧지도 너무 길지도 않게
- 2-3문장마다 반드시 줄바꿈 (빈 줄 삽입)
- 독자에게 말하듯 친근하게, 친구한테 카톡 보내는 느낌
- "~입니다" 같은 딱딱한 존댓말 절대 금지
- AI가 쓴 느낌이 나면 실패임. 아래 표현 절대 쓰지 마세요:
  → "활용하다", "제공하다", "다양한", "살펴보겠습니다", "소개해드릴게요"
  → "그렇다면", "또한", "이처럼", "마지막으로", "종합해보면"
  → "~의 매력", "~의 세계", "한번 알아볼까요?"
- 대신 이런 식으로 자연스럽게:
  → "솔직히 저도 처음엔 반신반의했거든요"
  → "근데 막상 해보니까 진짜 다르더라고요"
  → "이거 은근 꿀팁인데요"
  → "저만 몰랐던 건가..."
  → "아 그리고 이건 꼭 알아두셔야 하는데요"
  → "진짜 이건 좀 놀라웠어요"
- 중간에 본인 경험/감정을 자연스럽게 섞기:
  → "저는 개인적으로~", "솔직히 말하면~", "처음엔 좀 그랬는데~"
- 가끔 질문형으로 독자 참여 유도:
  → "이거 아시는 분?", "공감되시죠?", "어때요 괜찮지 않나요?"

【분량 규칙 - 매우 중요】
- 전체 글 길이: 최소 1500자, 목표 2000~2500자 이상
- 도입부: 4-6문장 (충분히 공감대 형성)
- 각 섹션 본문: 최소 5-8문장 이상 (문단 나눠서)
- 단순 나열 금지! 각 포인트마다 부연 설명, 본인 느낌, 꿀팁을 추가하세요
- "짧고 간결하게"가 아니라 "읽기 쉽게 길게" 써야 함
- 정보가 부족해도 상상력을 발휘해서 자연스럽게 살을 붙이세요:
  → 예상 독자의 상황 묘사, 일반적인 꿀팁 추가, 비교/대조 등

【구조 규칙 - 체류시간 극대화】
1. 제목: [핵심키워드] + [호기심/공감 유발] (25자 내외)
   예) "홍대 카페 추천 | 이런 곳이 있었다니"
   예) "퇴근 후 운동 루틴 | 진짜 3kg 빠진 방법"

2. 도입부 (introduction): 공감 질문 또는 상황 묘사로 시작 (4-6문장)
   - "요즘 ~하신 분들 많지 않나요?" 식의 공감형
   - 또는 "지난주에 우연히 발견한 곳인데요" 식의 경험형
   - 첫 문장에서 독자가 "어 나도!" 하고 느껴야 함
   - 도입부만으로 2-3줄 이상 나와야 합니다
   - 독자의 상황을 구체적으로 묘사하면 좋아요

3. 본문 섹션 (5-7개): 이모지+소제목으로 구분
   - 각 섹션 최소 2-3문단 (문단 = 3-4문장)
   - 핵심 정보를 중간 섹션에 배치 (스크롤 유도)
   - 섹션 끝에 다음 섹션이 궁금해지는 연결 문장
   - 개인적인 감상이나 추가 팁을 꼭 넣으세요
   - 섹션마다 읽는 재미가 있어야 합니다

4. 마무리 CTA: 행동 유도 (2-3문장)
   - "근처 가시면 한번 들러보세요 🙂"
   - "궁금한 거 있으면 댓글로 물어봐주세요!"
   - 마무리도 여운이 남게 길게 쓰세요

【이모지 규칙】
- 소제목에 1개 (필수)
- 본문 중 포인트에만 1-2개 (과하면 안 됨)
- 절대 문장마다 이모지 넣지 말 것

【SEO 규칙】
- 제목에 핵심 검색 키워드 반드시 포함
- 도입부 첫 문단에 키워드 자연 삽입
- 소제목에도 키워드 활용
- 해시태그 10-15개 (검색 의도 기반, 넓은 범위)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 콘텐츠 유형별 자동 섹션 구성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

영상 내용을 분석해서 적절한 섹션을 자동으로 구성하세요:

맛집/카페 → 발견 계기 | 위치/접근성 | 메뉴 소개 | 맛 후기 | 분위기 | 추천 포인트 | 꿀팁
운동/피트니스 → 왜 이 운동인지 | 준비물 | 루틴 설명 | 자세 포인트 | 효과/후기 | 주의사항 | 추천 대상
뷰티/화장품 → 발견 계기 | 이 제품 뭔데 | 사용법 | 텍스처/느낌 | 솔직 후기 | 비교 | 추천 대상
교육/정보 → 왜 알아야 하는지 | 핵심 내용 | 구체적 설명 | 실전 팁 | 주의할 점 | 정리
여행 → 왜 갔는지 | 여기가 어딘데 | 볼거리 | 먹거리 | 꿀팁 | 추천 코스 | 총평
제품 리뷰 → 왜 샀는지 | 개봉기 | 실제 사용기 | 장점 | 단점 | 가성비 | 추천?
일상/브이로그 → 이런 날이었어요 | 하이라이트 | 느낀 점 | 공유하고 싶은 것
기타 → 영상 내용에 맞게 자유롭게 구성

위는 예시일 뿐, 영상 내용에 맞게 창의적으로 구성하세요.
섹션 수는 5-7개가 적당합니다. 최소 5개 이상!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 입력 정보 (여러 소스에서 추출)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 아래 정보를 종합해서 블로그 글을 작성하세요.
음성 스크립트, 화면 텍스트(자막/오버레이), 프레임 분석을 최우선으로 활용하세요.
캡션(영상 설명글)은 보조적 참고만 하세요 — 영상 자체 콘텐츠가 핵심입니다.
음성이 노래/음악이면 무시하고 화면 텍스트와 프레임 분석에 집중하세요.
정보가 부족하더라도, 주어진 내용을 바탕으로 자연스럽게 살을 붙여 작성하세요.

{sources}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 프레임 매칭 규칙 (이미지 배치용)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{frame_matching_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 출력 형식 (반드시 JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
    "title": "SEO 키워드 포함, 호기심 유발하는 제목",
    "introduction": "공감형 도입부 (4-6문장, 줄바꿈 포함, 독자 상황 구체 묘사)",
    "sections": [
        {{
            "emoji": "적절한 이모지 1개",
            "title": "소제목",
            "content": "본문 내용 (최소 5-8문장 이상, 문단별 줄바꿈, 개인 느낌과 꿀팁 포함)",
            "frame_index": 0
        }}
    ],
    "closing_cta": "행동 유도 마무리 (2-3문장, 여운 있게)",
    "hashtags": ["#해시태그1", "#해시태그2", "... 10-15개"],
    "primary_keywords": ["메인키워드1", "메인키워드2", "메인키워드3"]
}}

⚠️ 반드시 유효한 JSON만 출력하세요. 설명이나 마크다운 없이 JSON만!
⚠️ content 안의 줄바꿈은 \\n으로 표현하세요.
⚠️ 전체 글이 최소 1500자 이상이어야 합니다. 짧으면 실패!
⚠️ 섹션은 최소 5개 이상이어야 합니다.
"""


def _build_sources_text(
    transcript: Optional[str],
    screen_text: Optional[str],
    description: Optional[str],
    video_title: Optional[str],
    location: Optional[str],
    frame_descriptions: Optional[List[dict]] = None,
    user_context: Optional[str] = None
) -> str:
    """입력 소스들을 프롬프트용 텍스트로 조합"""
    parts = []

    if user_context:
        parts.append(f"【사용자 설명 (가장 중요한 맥락 정보)】\n{user_context}")

    if video_title:
        parts.append(f"【영상 제목】\n{video_title}")

    if transcript:
        parts.append(f"【음성 스크립트 (STT)】\n{transcript}")

    if screen_text:
        parts.append(f"【화면 텍스트 (영상에서 보이는 글자/자막)】\n{screen_text}")

    if description:
        parts.append(f"【영상 설명글】\n{description}")

    if frame_descriptions:
        lines = []
        for fd in frame_descriptions:
            cat = fd.get("category", "other")
            desc = fd.get("description", "")
            idx = fd.get("frame_index", 0)
            screen_texts = fd.get("screen_texts", [])
            line = f"프레임 {idx}: [{cat}] {desc}"
            if screen_texts:
                line += f" | 화면텍스트: {', '.join(screen_texts)}"
            lines.append(line)
        parts.append(f"【영상 프레임 분석】\n" + "\n".join(lines))

    if location:
        parts.append(
            f"【위치 정보】\n이 콘텐츠의 관련 위치: {location}\n"
            "(위치를 자연스럽게 키워드와 본문에 활용하세요)"
        )

    return "\n\n".join(parts) if parts else "(정보 없음)"


def _build_frame_matching_section(frame_descriptions: Optional[List[dict]] = None) -> str:
    """프레임 매칭 규칙 텍스트 생성"""
    if not frame_descriptions:
        return "(프레임 정보 없음 - frame_index를 모두 -1로 설정)"

    return """각 섹션에 가장 관련 있는 프레임 번호를 frame_index에 지정하세요.
- 음식/메뉴 사진 → 메뉴 소개 섹션
- 외관/간판 사진 → 위치/접근성 섹션
- 내부 사진 → 분위기/인테리어 섹션
- 사람 사진 → 후기/체험 섹션
- 각 프레임은 최대 1개 섹션에만 매칭 (중복 금지)
- 매칭할 프레임이 없으면 frame_index를 -1로 설정"""


TONE_PROMPTS = {
    "일상": """【글 톤: 일상/라이프스타일】
- 개인 일기처럼 자연스럽고 감성적인 톤
- "오늘 뭐 했냐면~", "갑자기 생각나서~" 같은 일상 도입
- 나의 감정, 느낌, 소소한 발견에 초점
- 광고 느낌 최소화, 친구에게 이야기하듯
- CTA도 부드럽게: "여러분도 한번 가보세요~" 정도""",

    "자영업자": """【글 톤: 자영업자/매장 홍보】
- 매장의 강점을 자연스럽게 어필하는 마케팅 톤
- 가격, 위치, 영업시간, 메뉴 등 실용 정보 강조
- "이 가격에 이 퀄리티?" 같은 가성비 어필
- 방문을 유도하는 강한 CTA: "예약은 프로필 링크에서!"
- 위치/교통 접근성 자연스럽게 포함
- 이벤트/할인 정보 있으면 적극 활용""",
}


def _build_tone_section(tone: Optional[str] = None) -> str:
    """톤별 추가 프롬프트 텍스트 생성"""
    if not tone or tone not in TONE_PROMPTS:
        return ""
    return TONE_PROMPTS[tone]


async def write_blog(
    transcript: Optional[str] = None,
    screen_text: Optional[str] = None,
    description: Optional[str] = None,
    video_title: Optional[str] = None,
    location: Optional[str] = None,
    frame_descriptions: Optional[List[dict]] = None,
    tone: Optional[str] = None,
    user_context: Optional[str] = None
) -> tuple[BlogStructure, SEOKeywords, str]:
    """
    모든 소스를 종합하여 네이버 블로그 글 생성 (단일 GPT 호출)

    Returns: (blog_structure, seo_keywords, blog_content)
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    sources = _build_sources_text(
        transcript, screen_text, description, video_title, location,
        frame_descriptions=frame_descriptions,
        user_context=user_context
    )

    frame_matching = _build_frame_matching_section(frame_descriptions)

    # 톤별 추가 프롬프트 삽입
    tone_section = _build_tone_section(tone)
    if tone_section:
        sources = tone_section + "\n\n" + sources

    prompt = BLOG_WRITER_PROMPT.format(
        sources=sources,
        frame_matching_section=frame_matching
    )
    print(f"[BlogWriter] 톤: {tone or '기본'}")

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 네이버 블로그 월 방문자 10만 이상의 인플루언서입니다. "
                    "영상에서 추출한 다양한 정보(음성, 화면 텍스트, 설명)를 종합하여 "
                    "네이버 블로그에 최적화된 글을 작성합니다. "
                    "AI 티가 절대 나지 않는, 진짜 사람이 경험하고 직접 쓴 것 같은 자연스러운 글을 씁니다. "
                    "글은 항상 길고 풍성하게, 최소 1500자 이상으로 작성합니다. "
                    "짧은 글은 절대 쓰지 않습니다. 읽는 재미가 있게 살을 붙여서 씁니다. "
                    "반드시 JSON 형식으로만 응답합니다."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.82,
        max_tokens=4096
    )

    raw_content = response.choices[0].message.content
    print(f"[BlogWriter] GPT 응답 길이: {len(raw_content)}자")
    result = json.loads(raw_content)

    # BlogStructure 구성
    sections = [
        BlogSection(
            emoji=s.get("emoji", "📌"),
            title=s.get("title", ""),
            content=s.get("content", ""),
            frame_index=s.get("frame_index")
        )
        for s in result.get("sections", [])
    ]

    blog_structure = BlogStructure(
        title=result.get("title", ""),
        introduction=result.get("introduction", ""),
        sections=sections,
        closing_cta=result.get("closing_cta", "")
    )

    # SEOKeywords 구성
    hashtags = result.get("hashtags", [])
    hashtags = [
        tag if tag.startswith("#") else f"#{tag}"
        for tag in hashtags
    ]

    seo_keywords = SEOKeywords(
        primary_keywords=result.get("primary_keywords", []),
        hashtags=hashtags
    )

    # 복사용 전체 블로그 텍스트 생성
    blog_content = _format_full_content(blog_structure, seo_keywords)

    return blog_structure, seo_keywords, blog_content


def _format_full_content(
    structure: BlogStructure,
    keywords: SEOKeywords
) -> str:
    """복사+붙여넣기용 전체 블로그 텍스트 생성"""
    parts = [
        structure.title,
        "",
        structure.introduction,
        "",
    ]

    for section in structure.sections:
        parts.append(f"{section.emoji} {section.title}")
        parts.append("")
        parts.append(section.content)
        parts.append("")

    parts.append(structure.closing_cta)
    parts.append("")
    parts.append(" ".join(keywords.hashtags))

    return "\n".join(parts)
