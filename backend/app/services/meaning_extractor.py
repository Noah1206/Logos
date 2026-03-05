import json
from openai import OpenAI
from typing import Optional
from ..models.schemas import ExtractedMeaning
from ..core.config import get_settings

settings = get_settings()


MEANING_EXTRACTION_PROMPT = """
당신은 영상 콘텐츠 분석 전문가입니다.
다음 영상 스크립트에서 마케팅에 활용할 수 있는 핵심 정보를 추출해주세요.

## 추출 항목
1. menu_items: 언급된 메뉴/상품/서비스명 (예: "딸기 케이크", "아메리카노")
2. prices: 가격 정보 (예: "5,000원", "1만원대")
3. events: 이벤트/프로모션 정보 (예: "오픈 기념 20% 할인")
4. atmosphere: 매장/서비스 분위기 키워드 (예: "아늑한", "모던한", "퇴근 후 한잔하기 좋은")
5. target_audience: 타겟 고객층 (예: "직장인", "데이트 커플", "가족 단위")
6. pain_points: 고객이 겪는 문제/니즈 (예: "퇴근 후 가볍게 한잔하고 싶을 때")
7. unique_selling_points: 차별점/강점 (예: "신선한 당일 베이킹", "24시간 영업")
8. location_hints: 위치 힌트 (예: "홍대입구역 3번 출구", "연남동 골목")

## 출력 형식
반드시 JSON 형식으로만 출력하세요.

## 영상 스크립트
{transcript}
"""


async def extract_meaning(transcript: str, location: Optional[str] = None) -> ExtractedMeaning:
    """
    영상 스크립트에서 의미 있는 정보 추출
    - 메뉴명, 가격, 이벤트, 분위기, 타겟 고객 등
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = MEANING_EXTRACTION_PROMPT.format(transcript=transcript)

    if location:
        prompt += f"\n\n참고: 이 매장/서비스의 위치는 '{location}' 근처입니다."

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "당신은 영상 콘텐츠에서 마케팅 정보를 추출하는 전문가입니다. JSON 형식으로만 응답합니다."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.3
    )

    raw_content = response.choices[0].message.content
    print(f"[MeaningExtractor] GPT 원본 응답:\n{raw_content}")
    result = json.loads(raw_content)

    return ExtractedMeaning(
        menu_items=result.get("menu_items", []),
        prices=result.get("prices", []),
        events=result.get("events", []),
        atmosphere=result.get("atmosphere", []),
        target_audience=result.get("target_audience", []),
        pain_points=result.get("pain_points", []),
        unique_selling_points=result.get("unique_selling_points", []),
        location_hints=result.get("location_hints", [])
    )
