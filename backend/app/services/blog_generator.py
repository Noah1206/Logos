import json
from openai import OpenAI
from typing import Optional
from ..models.schemas import ExtractedMeaning, SEOKeywords, BlogStructure
from ..core.config import get_settings

settings = get_settings()


BLOG_STRUCTURE_PROMPT = """
당신은 네이버 블로그 SEO 전문 작가입니다.
"사장님이 직접 쓴 것 같은" 자연스러운 블로그 글을 작성해주세요.

## 절대 규칙 (AI 티 제거)
1. 과한 전문어 금지 - 일상적인 표현 사용
2. 경험담 문장 삽입 - "저희 가게는~", "손님들이 자주~"
3. 이모지 약간 사용 - 자연스럽게 🙂 ☕ 🍰
4. 후기 느낌 - 마케터가 아닌 "사장님"이 쓴 것처럼
5. 짧은 문장 - 2-3줄마다 줄바꿈

## 블로그 구조 (네이버 체류시간 최적화)
1. **도입부 (introduction)**: 공감 상황 제시 (2-3문장)
   - "퇴근 후 가볍게 한잔하고 싶을 때 있잖아요"
   - 독자의 상황에 공감하는 문장으로 시작

2. **방문 이유 (visit_reason)**: 왜 여기를 가야 하는지 (2-3문장)
   - 차별점, 특별한 점 강조

3. **메뉴 소개 (menu_section)**: 대표 메뉴 소개 (3-5문장)
   - 가격, 맛, 특징 자연스럽게 설명
   - 개인적인 추천 포함

4. **분위기 (atmosphere_section)**: 매장 분위기 (2-3문장)
   - 어떤 사람에게 좋은지

5. **추천 포인트 (recommendation)**: 정리 (2-3문장)
   - 핵심 추천 이유

6. **CTA (closing_cta)**: 방문 유도 (1-2문장)
   - "근처 오시면 한번 들러보세요 🙂"

## 입력 정보
- 위치: {location}
- 메뉴: {menu_items}
- 가격: {prices}
- 분위기: {atmosphere}
- 타겟: {target_audience}
- 차별점: {unique_selling_points}
- SEO 키워드: {keywords}

## 출력 형식 (JSON)
{{
    "title": "검색 키워드 포함한 제목 (호기심 유발)",
    "introduction": "공감 도입부",
    "visit_reason": "방문 이유",
    "menu_section": "메뉴 소개",
    "atmosphere_section": "분위기",
    "recommendation": "추천 포인트",
    "closing_cta": "방문 유도 CTA"
}}
"""


async def generate_blog_structure(
    extracted_meaning: ExtractedMeaning,
    seo_keywords: SEOKeywords,
    location: Optional[str] = None
) -> BlogStructure:
    """
    블로그 글 구조 생성 (사장님 톤)
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    final_location = location or (
        extracted_meaning.location_hints[0]
        if extracted_meaning.location_hints
        else "서울"
    )

    prompt = BLOG_STRUCTURE_PROMPT.format(
        location=final_location,
        menu_items=", ".join(extracted_meaning.menu_items) or "다양한 메뉴",
        prices=", ".join(extracted_meaning.prices) or "합리적인 가격",
        atmosphere=", ".join(extracted_meaning.atmosphere) or "좋은 분위기",
        target_audience=", ".join(extracted_meaning.target_audience) or "모든 분",
        unique_selling_points=", ".join(extracted_meaning.unique_selling_points) or "특별함",
        keywords=", ".join(seo_keywords.primary_keywords[:3])
    )

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "당신은 자영업자 사장님처럼 글을 쓰는 블로그 작가입니다. AI 티가 나지 않게 자연스럽게 작성합니다. JSON 형식으로만 응답합니다."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.7
    )

    result = json.loads(response.choices[0].message.content)

    return BlogStructure(
        title=result.get("title", ""),
        introduction=result.get("introduction", ""),
        visit_reason=result.get("visit_reason", ""),
        menu_section=result.get("menu_section", ""),
        atmosphere_section=result.get("atmosphere_section", ""),
        recommendation=result.get("recommendation", ""),
        closing_cta=result.get("closing_cta", "")
    )


def format_blog_content(
    structure: BlogStructure,
    seo_keywords: SEOKeywords
) -> str:
    """
    블로그 구조를 네이버 블로그용 최종 포맷으로 변환
    """
    hashtags = " ".join(seo_keywords.hashtags[:7])

    content = f"""# {structure.title}

{structure.introduction}

---

## 왜 여기를 추천하냐면요

{structure.visit_reason}

---

## 메뉴 소개 ☕

{structure.menu_section}

---

## 분위기는요 ✨

{structure.atmosphere_section}

---

## 한줄 추천 💡

{structure.recommendation}

---

{structure.closing_cta}

---

{hashtags}
"""

    return content
