"""
학습 요약 생성 엔진
텍스트 (YouTube 영상 스크립트 또는 PDF 텍스트) → 구조화된 학습 노트
"""
import json
from openai import OpenAI
from ..models.schemas import StudyStructure, StudyConcept, BackgroundKnowledge, StudyPrerequisite, RecommendedResource
from ..core.config import get_settings

settings = get_settings()

STUDY_WRITER_PROMPT = """당신은 최고의 교육 전문가이자 학습 코치입니다.
주어진 텍스트를 체계적이고 심층적인 학습 노트로 변환합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "학습 주제 제목",
  "executive_summary": "5-8문장의 핵심 요약. 이 내용의 가장 중요한 포인트, 주요 논점, 결론을 포괄적으로 정리.",
  "background_knowledge": {
    "overview": "이 주제를 이해하기 위한 배경 설명 (3-5문장). 해당 분야의 맥락과 중요성.",
    "prerequisites": [
      {
        "topic": "선행 지식 주제명",
        "description": "왜 이 지식이 필요한지 (1-2문장)",
        "difficulty": "beginner|intermediate|advanced"
      }
    ],
    "context": "이 주제가 더 큰 학문/산업 맥락에서 어떤 위치인지 (2-3문장)"
  },
  "key_concepts": [
    {
      "name": "개념명",
      "definition": "개념에 대한 명확한 설명 (2-3문장)",
      "importance": "high|medium|low",
      "parent_concept": "상위 개념명 (없으면 null)",
      "related_concepts": ["연관 개념1", "연관 개념2"],
      "example": "이 개념의 구체적인 예시 또는 활용 사례 (1-2문장)"
    }
  ],
  "detailed_notes": [
    {
      "topic": "세부 주제명",
      "content": "해당 주제에 대한 상세 설명 (8-12문장). 핵심 내용을 풍부한 맥락과 함께 서술.",
      "key_takeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
      "deeper_analysis": "심층 분석 (3-5문장). 이 주제의 함의, 한계점, 다른 관점, 실제 적용 시 고려사항 등.",
      "visual_suggestion": "concept_diagram|comparison_chart|process_flow|timeline|hierarchy|none"
    }
  ],
  "study_questions": [
    {
      "question": "학습 확인 질문",
      "answer": "모범 답안 (2-3문장)",
      "difficulty": "basic|intermediate|advanced",
      "hint": "문제 풀이 힌트 (1문장)"
    }
  ],
  "recommended_resources": [
    {
      "type": "youtube_search",
      "topic": "추천 검색 주제",
      "search_query": "유튜브 검색어",
      "description": "이 자료를 추천하는 이유 (1문장)"
    },
    {
      "type": "further_reading",
      "topic": "추천 읽기 자료 주제",
      "search_query": "검색어",
      "description": "이 자료를 추천하는 이유 (1문장)"
    }
  ],
  "related_topics": ["관련 주제1", "관련 주제2"],
  "concept_hierarchy": {
    "root": "전체 주제명",
    "children": [
      {
        "name": "대분류 개념",
        "children": [
          {"name": "세부 개념1", "children": []},
          {"name": "세부 개념2", "children": []}
        ]
      }
    ]
  }
}

규칙:
- title: 학습 내용을 잘 나타내는 간결한 제목
- executive_summary: 전체 내용의 핵심을 5-8문장으로 포괄적으로 정리
- background_knowledge: 이 주제의 배경 맥락
  - overview: 배경 설명 3-5문장
  - prerequisites: 2-4개의 선행 지식 항목
  - context: 더 큰 맥락에서의 위치 2-3문장
- key_concepts: 5-10개, importance는 내용 이해에 대한 중요도 기준
  - parent_concept: 이 개념의 상위 개념명 (최상위면 null)
  - related_concepts: 1-3개의 연관 개념 (key_concepts 내 다른 개념명)
  - example: 구체적 예시나 활용 사례
- detailed_notes: 5-8개 주제, 각 주제별 깊이 있는 설명
  - content: 8-12문장의 풍부한 설명
  - key_takeaways: 각 섹션의 핵심 포인트 2-4개
  - deeper_analysis: 심층 분석 3-5문장 (함의, 한계, 다른 관점)
  - visual_suggestion: 해당 내용에 적합한 시각 자료 타입 (없으면 "none")
- study_questions: 5-8개, 난이도별 다양한 질문
  - difficulty: basic(기본), intermediate(중급), advanced(심화)
  - hint: 문제 풀이 힌트
- recommended_resources: 3-5개, 추가 학습 자료 추천
  - youtube_search: 유튜브에서 검색할 관련 주제
  - further_reading: 추가 읽기 자료 (논문, 책, 블로그 등)
- related_topics: 2-5개, 추가 학습할 수 있는 관련 주제
- concept_hierarchy: 마인드맵용 계층 트리 (root → children → children 구조)
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
    truncated = text[:24000]

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {"role": "system", "content": STUDY_WRITER_PROMPT},
            {"role": "user", "content": f"다음 내용을 학습 노트로 변환해주세요:\n\n{truncated}"},
        ],
        temperature=0.3,
        max_tokens=12000,
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
            parent_concept=c.get("parent_concept"),
            related_concepts=c.get("related_concepts", []),
            example=c.get("example"),
        )
        for c in result.get("key_concepts", [])
    ]

    # BackgroundKnowledge 파싱
    bg_raw = result.get("background_knowledge")
    background_knowledge = None
    if bg_raw and isinstance(bg_raw, dict):
        prerequisites = [
            StudyPrerequisite(
                topic=p.get("topic", ""),
                description=p.get("description", ""),
                difficulty=p.get("difficulty", "beginner"),
            )
            for p in bg_raw.get("prerequisites", [])
        ]
        background_knowledge = BackgroundKnowledge(
            overview=bg_raw.get("overview", ""),
            prerequisites=prerequisites,
            context=bg_raw.get("context", ""),
        )

    # RecommendedResources 파싱
    recommended_resources = [
        RecommendedResource(
            type=r.get("type", "further_reading"),
            topic=r.get("topic"),
            search_query=r.get("search_query"),
            description=r.get("description"),
        )
        for r in result.get("recommended_resources", [])
    ]

    structure = StudyStructure(
        title=result.get("title", "학습 노트"),
        executive_summary=result.get("executive_summary", ""),
        key_concepts=key_concepts,
        detailed_notes=result.get("detailed_notes", []),
        study_questions=result.get("study_questions", []),
        related_topics=result.get("related_topics", []),
        concept_hierarchy=result.get("concept_hierarchy"),
        background_knowledge=background_knowledge,
        recommended_resources=recommended_resources,
    )

    # 전체 텍스트 콘텐츠 생성 (복사용)
    content_parts = [
        f"# {structure.title}\n",
        f"## 핵심 요약\n{structure.executive_summary}\n",
    ]

    if structure.background_knowledge:
        content_parts.append("## 배경 지식")
        content_parts.append(structure.background_knowledge.overview)
        if structure.background_knowledge.prerequisites:
            content_parts.append("\n**선행 지식:**")
            for p in structure.background_knowledge.prerequisites:
                content_parts.append(f"- {p.topic}: {p.description}")
        if structure.background_knowledge.context:
            content_parts.append(f"\n{structure.background_knowledge.context}")

    content_parts.append("\n## 핵심 개념")
    for c in structure.key_concepts:
        content_parts.append(f"- **{c.name}** [{c.importance}]: {c.definition}")
        if c.example:
            content_parts.append(f"  예시: {c.example}")

    content_parts.append("\n## 상세 노트")
    for note in structure.detailed_notes:
        content_parts.append(f"### {note.get('topic', '')}\n{note.get('content', '')}")
        takeaways = note.get("key_takeaways", [])
        if takeaways:
            content_parts.append("\n**핵심 포인트:**")
            for t in takeaways:
                content_parts.append(f"- {t}")
        deeper = note.get("deeper_analysis", "")
        if deeper:
            content_parts.append(f"\n**심층 분석:**\n{deeper}")

    content_parts.append("\n## 학습 문제")
    for q in structure.study_questions:
        difficulty = q.get("difficulty", "")
        prefix = f"[{difficulty}] " if difficulty else ""
        content_parts.append(f"{prefix}Q: {q.get('question', '')}\nA: {q.get('answer', '')}\n")

    if structure.recommended_resources:
        content_parts.append("\n## 추가 학습 자료")
        for r in structure.recommended_resources:
            content_parts.append(f"- [{r.type}] {r.topic or ''}: {r.description or ''}")

    content_parts.append(f"\n## 관련 주제\n{', '.join(structure.related_topics)}")

    study_content = "\n".join(content_parts)

    return structure, study_content
