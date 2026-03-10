"""
학습 요약 생성 엔진
텍스트 (YouTube 영상 스크립트 또는 PDF 텍스트) → 구조화된 학습 노트
"""
import json
from openai import OpenAI
from ..models.schemas import StudyStructure, StudyConcept
from ..core.config import get_settings

settings = get_settings()

STUDY_WRITER_PROMPT = """당신은 최고의 교육 전문가이자 학습 코치입니다.
주어진 텍스트를 체계적인 학습 노트로 변환합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "학습 주제 제목",
  "executive_summary": "3-5문장의 핵심 요약. 이 내용의 가장 중요한 포인트를 간결하게.",
  "key_concepts": [
    {
      "name": "개념명",
      "definition": "개념에 대한 명확한 설명 (2-3문장)",
      "importance": "high|medium|low"
    }
  ],
  "detailed_notes": [
    {
      "topic": "세부 주제명",
      "content": "해당 주제에 대한 상세 설명 (3-5문장). 예시나 핵심 포인트 포함."
    }
  ],
  "study_questions": [
    {
      "question": "학습 확인 질문",
      "answer": "모범 답안 (2-3문장)"
    }
  ],
  "related_topics": ["관련 주제1", "관련 주제2"]
}

규칙:
- title: 학습 내용을 잘 나타내는 간결한 제목
- executive_summary: 전체 내용의 핵심을 3-5문장으로 압축
- key_concepts: 3-7개, importance는 내용 이해에 대한 중요도 기준
- detailed_notes: 3-6개 주제, 각 주제별 상세하고 명확한 설명
- study_questions: 3-5개, 학습 내용을 확인할 수 있는 질문과 답
- related_topics: 2-5개, 추가 학습할 수 있는 관련 주제
- 한국어로 작성하되, 원문이 영어인 경우 핵심 용어는 영어 병기
"""


async def write_study_notes(text: str) -> tuple[StudyStructure, str]:
    """
    텍스트를 학습 노트로 변환

    Returns:
        (StudyStructure, study_content_text)
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # 텍스트가 너무 길면 앞부분만 사용
    truncated = text[:12000]

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {"role": "system", "content": STUDY_WRITER_PROMPT},
            {"role": "user", "content": f"다음 내용을 학습 노트로 변환해주세요:\n\n{truncated}"},
        ],
        temperature=0.3,
        max_tokens=3000,
        response_format={"type": "json_object"},
    )

    result_text = response.choices[0].message.content or "{}"
    result = json.loads(result_text)

    # StudyStructure 생성
    key_concepts = [
        StudyConcept(
            name=c.get("name", ""),
            definition=c.get("definition", ""),
            importance=c.get("importance", "medium"),
        )
        for c in result.get("key_concepts", [])
    ]

    structure = StudyStructure(
        title=result.get("title", "학습 노트"),
        executive_summary=result.get("executive_summary", ""),
        key_concepts=key_concepts,
        detailed_notes=result.get("detailed_notes", []),
        study_questions=result.get("study_questions", []),
        related_topics=result.get("related_topics", []),
    )

    # 전체 텍스트 콘텐츠 생성 (복사용)
    content_parts = [
        f"# {structure.title}\n",
        f"## 핵심 요약\n{structure.executive_summary}\n",
        "## 핵심 개념",
    ]
    for c in structure.key_concepts:
        content_parts.append(f"- **{c.name}** [{c.importance}]: {c.definition}")

    content_parts.append("\n## 상세 노트")
    for note in structure.detailed_notes:
        content_parts.append(f"### {note.get('topic', '')}\n{note.get('content', '')}")

    content_parts.append("\n## 학습 문제")
    for q in structure.study_questions:
        content_parts.append(f"Q: {q.get('question', '')}\nA: {q.get('answer', '')}\n")

    content_parts.append(f"\n## 관련 주제\n{', '.join(structure.related_topics)}")

    study_content = "\n".join(content_parts)

    return structure, study_content
