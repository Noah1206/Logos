"""
블로그 글쓰기 스타일 분석기
크롤링한 게시글들을 GPT-4o로 분석하여 작성자의 고유 문체를 프로필로 추출합니다.
"""
import json
from typing import Optional
from openai import OpenAI
from ..core.config import get_settings
from .blog_crawler import BlogPost

settings = get_settings()

STYLE_ANALYSIS_PROMPT = """당신은 블로그 글쓰기 스타일 분석 전문가입니다.

아래는 한 블로거가 작성한 여러 게시글입니다. 이 글들을 분석하여 이 블로거의 고유한 글쓰기 스타일을 JSON으로 정리해주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 분석 항목
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 문장 종결 어미: 이 블로거가 주로 사용하는 종결 어미 패턴 (예: ~했어요, ~했답니다, ~했거든요)
2. 자주 쓰는 표현: 반복적으로 등장하는 특징적인 표현이나 말버릇
3. 이모지 사용: 이모지 사용 빈도와 종류 (많이/적당히/거의 안 씀), 선호 이모지
4. 문단 구성: 문단 길이, 줄바꿈 빈도, 글 전체 흐름
5. 글 시작 패턴: 도입부를 어떤 식으로 시작하는지
6. 마무리 패턴: 글을 어떻게 끝내는지
7. 고유 특징: 위 분류에 포함되지 않는 독특한 스타일 (말줄임표, 감탄사, 질문형 등)
8. 문체 예시: 이 블로거의 문체를 잘 보여주는 대표 문장 3-5개 (원문 그대로)
9. 톤 요약: 이 블로거의 전체적인 톤을 한 문장으로 요약

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 블로거의 게시글들
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{posts}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 출력 형식 (반드시 JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
    "tone_summary": "이 블로거의 전체적인 톤 한 줄 요약",
    "sentence_endings": ["자주 쓰는 종결 어미 목록"],
    "frequent_expressions": ["자주 쓰는 표현 목록"],
    "emoji_style": {{
        "frequency": "많음|적당|거의없음",
        "preferred_emojis": ["선호 이모지 목록"]
    }},
    "paragraph_style": {{
        "avg_length": "짧음|보통|긺",
        "line_break_frequency": "잦음|보통|적음",
        "flow_description": "글 흐름 설명"
    }},
    "opening_patterns": ["도입부 시작 패턴 설명 목록"],
    "closing_patterns": ["마무리 패턴 설명 목록"],
    "unique_traits": ["고유 특징 목록"],
    "style_examples": ["대표 문장 3-5개 원문"],
    "writing_instructions": "이 블로거처럼 글을 쓰려면 지켜야 할 핵심 규칙 3-5문장"
}}

⚠️ 반드시 유효한 JSON만 출력하세요. 설명이나 마크다운 없이 JSON만!
"""


async def analyze_writing_style(posts: list[BlogPost]) -> dict:
    """크롤링한 게시글들의 글쓰기 스타일 분석"""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # 게시글들을 프롬프트용 텍스트로 조합
    posts_text = ""
    for i, post in enumerate(posts, 1):
        posts_text += f"\n--- 게시글 {i}: {post.title} ---\n{post.content}\n"

    prompt = STYLE_ANALYSIS_PROMPT.format(posts=posts_text)

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 블로그 글쓰기 스타일 분석 전문가입니다. "
                    "주어진 글들에서 작성자의 고유한 문체, 말투, 패턴을 정확하게 추출합니다. "
                    "반드시 JSON 형식으로만 응답합니다."
                )
            },
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=2048
    )

    raw = response.choices[0].message.content
    result = json.loads(raw)
    print(f"[StyleAnalyzer] 분석 완료: {result.get('tone_summary', 'N/A')}")
    return result
