"""
콘텐츠에서 지식 추출 (summary, key_concepts, keywords, topic, subtopics)
GPT-4o 경량 호출 (~200 토큰 출력)
"""
import json
from openai import OpenAI
from ..core.config import get_settings

settings = get_settings()

KNOWLEDGE_PROMPT = """당신은 콘텐츠 분석 전문가입니다.
주어진 콘텐츠에서 핵심 지식을 추출하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "summary": "2-3문장 핵심 요약",
  "key_concepts": ["핵심개념1", "핵심개념2", ...],
  "keywords": ["키워드1", "키워드2", ...],
  "topic": "food|fitness|beauty|education|tech|business|lifestyle|other 중 하나",
  "subtopics": ["세부주제1", "세부주제2", ...]
}

규칙:
- summary: 한국어 2-3문장으로 핵심 내용 요약
- key_concepts: 3-7개, 구체적 개념
- keywords: 5-10개, SEO/검색 키워드
- topic: 반드시 위 카테고리 중 하나
- subtopics: 2-5개, 세부 분야
"""


async def extract_knowledge(content: str, transcript: str | None = None) -> dict:
    """콘텐츠에서 지식 추출"""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    user_message = f"[콘텐츠]\n{content[:3000]}"
    if transcript:
        user_message += f"\n\n[원본 스크립트]\n{transcript[:1000]}"

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {"role": "system", "content": KNOWLEDGE_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    result_text = response.choices[0].message.content or "{}"
    result = json.loads(result_text)

    return {
        "summary": result.get("summary", ""),
        "key_concepts": result.get("key_concepts", []),
        "keywords": result.get("keywords", []),
        "topic": result.get("topic", "other"),
        "subtopics": result.get("subtopics", []),
    }
