"""
AI Thinking Engine
사용자의 축적된 지식 기반으로 아이디어 생성, 질문 응답, 개념 연결
"""
from typing import AsyncGenerator
from openai import OpenAI
from ..core.config import get_settings

settings = get_settings()

THINKING_PROMPT = """당신은 사용자의 개인 AI 브레인입니다.
사용자가 만든 콘텐츠에서 추출한 지식을 기반으로 도움을 줍니다.

역할:
1. 콘텐츠 아이디어 제안: 기존 주제를 바탕으로 새로운 콘텐츠 아이디어
2. 학습 내용 복습: 학습한 내용의 핵심을 정리하고 설명
3. 주제 연결: 서로 다른 콘텐츠 간의 연결점 발견
4. 질문 응답: 축적된 지식 기반으로 맞춤형 답변

규칙:
- 사용자의 실제 지식 데이터를 참조하여 구체적으로 답변
- 한국어로 자연스럽게 대화
- 실용적이고 바로 활용 가능한 인사이트 제공
- 지식 데이터에 없는 내용은 추측이라고 명시
"""


async def generate_thinking_response(
    question: str,
    knowledge_context: list[dict],
    topic_filter: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    사용자 질문 + 지식 컨텍스트 → GPT 스트리밍 응답
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # 지식 컨텍스트를 프롬프트로 구성
    context_parts = []
    for k in knowledge_context[:50]:  # 최대 50개
        parts = []
        if k.get("summary"):
            parts.append(f"요약: {k['summary']}")
        if k.get("keyConcepts"):
            concepts = k["keyConcepts"] if isinstance(k["keyConcepts"], list) else []
            parts.append(f"핵심 개념: {', '.join(concepts[:5])}")
        if k.get("keywords"):
            keywords = k["keywords"] if isinstance(k["keywords"], list) else []
            parts.append(f"키워드: {', '.join(keywords[:5])}")
        if k.get("topic"):
            parts.append(f"주제: {k['topic']}")

        if parts:
            title = k.get("conversion", {}).get("title", "")
            header = f"[{title}]" if title else f"[항목]"
            context_parts.append(f"{header}\n" + "\n".join(parts))

    context_text = "\n\n".join(context_parts) if context_parts else "아직 축적된 지식이 없습니다."

    messages = [
        {"role": "system", "content": THINKING_PROMPT},
        {
            "role": "user",
            "content": f"[사용자의 축적된 지식]\n{context_text}\n\n[질문]\n{question}",
        },
    ]

    stream = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=1500,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
