import json
from openai import OpenAI
from typing import Optional
from ..models.schemas import ExtractedMeaning, SEOKeywords
from ..core.config import get_settings

settings = get_settings()


SEO_KEYWORD_PROMPT = """
당신은 네이버 블로그 SEO 전문가입니다.
다음 정보를 바탕으로 네이버 검색에서 상위 노출될 수 있는 키워드를 생성해주세요.

## 핵심 전략
1. **검색 의도 변환**: 영상 시청자가 네이버에서 검색할 만한 키워드 생성
2. **지역 + 업종 조합**: "홍대 카페", "강남 맛집" 형태의 키워드
3. **롱테일 키워드**: "홍대 데이트 카페 추천", "강남역 근처 조용한 카페"
4. **실제 검색 패턴**: 사람들이 실제로 검색하는 방식 반영

## 입력 정보
- 위치: {location}
- 메뉴/상품: {menu_items}
- 분위기: {atmosphere}
- 타겟 고객: {target_audience}
- 차별점: {unique_selling_points}

## 출력 형식 (JSON)
{{
    "primary_keywords": ["메인 키워드 3-5개 (지역+업종)"],
    "secondary_keywords": ["세컨더리 키워드 5-7개"],
    "long_tail_keywords": ["롱테일 키워드 5-10개"],
    "hashtags": ["해시태그 7-10개"]
}}

## 키워드 생성 규칙
- primary_keywords: 검색량 높은 핵심 키워드 (예: "홍대 카페", "연남동 맛집")
- secondary_keywords: 보조 키워드 (예: "홍대 디저트", "연남동 브런치")
- long_tail_keywords: 구체적 검색 의도 (예: "홍대 데이트 카페 추천", "연남동 조용한 카페")
- hashtags: SNS용 해시태그 (예: "#홍대카페", "#연남동맛집")
"""


async def generate_seo_keywords(
    extracted_meaning: ExtractedMeaning,
    location: Optional[str] = None
) -> SEOKeywords:
    """
    추출된 의미 정보를 바탕으로 네이버 SEO 키워드 생성

    핵심: 영상 시청자 → 네이버 검색 사용자 변환
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # 위치 정보 결정
    final_location = location or (
        extracted_meaning.location_hints[0]
        if extracted_meaning.location_hints
        else "서울"
    )

    prompt = SEO_KEYWORD_PROMPT.format(
        location=final_location,
        menu_items=", ".join(extracted_meaning.menu_items) or "일반 메뉴",
        atmosphere=", ".join(extracted_meaning.atmosphere) or "일반적인 분위기",
        target_audience=", ".join(extracted_meaning.target_audience) or "일반 고객",
        unique_selling_points=", ".join(extracted_meaning.unique_selling_points) or "특별함"
    )

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "당신은 네이버 블로그 SEO 키워드 전문가입니다. JSON 형식으로만 응답합니다."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.5
    )

    result = json.loads(response.choices[0].message.content)

    return SEOKeywords(
        primary_keywords=result.get("primary_keywords", []),
        secondary_keywords=result.get("secondary_keywords", []),
        long_tail_keywords=result.get("long_tail_keywords", []),
        hashtags=result.get("hashtags", [])
    )
