"""
GPT-4o Vision으로 영상 프레임에서 화면 텍스트 추출 + 프레임별 구조화 분석
인스타 릴스/유튜브 쇼츠의 자막, 텍스트 오버레이를 읽어옴
"""
import json
import base64
from typing import List, Tuple
from openai import OpenAI
from ..models.schemas import FrameAnalysis
from ..core.config import get_settings

settings = get_settings()

VISION_PROMPT = """이 이미지들은 하나의 짧은 영상(쇼츠/릴스)에서 추출한 프레임입니다.
각 프레임을 개별적으로 분석해서 JSON으로 응답해주세요.

분석 항목 (프레임별):
1. description: 프레임에 보이는 핵심 내용 한 줄 묘사 (한국어)
2. screen_text: 화면에 보이는 텍스트 목록 (자막, 캡션, 상호명, 메뉴판, 가격표, 설명 텍스트)
3. category: 아래 중 하나 선택
   - food: 음식, 메뉴, 요리
   - exterior: 매장/건물 외관, 간판
   - interior: 매장/공간 내부
   - person: 사람 중심 (리뷰어, 먹방 등)
   - menu: 메뉴판, 가격표
   - product: 제품, 상품
   - scenery: 풍경, 자연
   - text_overlay: 텍스트가 주된 내용
   - other: 위에 해당 없음
4. quality_score: 블로그에 쓸 만한 사진 품질 0.0~1.0
   - 1.0: 선명하고 내용이 풍부한 사진
   - 0.5: 보통
   - 0.0: 흐릿하거나 전환 중 화면

규칙:
- 보이는 텍스트만 정확히 추출 (추측 금지)
- 텍스트가 없으면 screen_text를 빈 배열로
- 프레임 순서는 이미지 순서대로 0, 1, 2, ...

반드시 아래 JSON 형식으로만 응답:
{
  "frames": [
    {
      "frame_index": 0,
      "description": "프레임 설명",
      "screen_text": ["텍스트1", "텍스트2"],
      "category": "food",
      "quality_score": 0.8
    }
  ]
}
"""


def _encode_image(image_path: str) -> str:
    """이미지를 base64로 인코딩"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


async def analyze_frames(frame_paths: List[str]) -> Tuple[List[FrameAnalysis], str]:
    """
    영상 프레임들을 GPT-4o Vision으로 분석하여 프레임별 구조화 데이터 추출

    Returns: (프레임별 분석 리스트, 통합 screen_text 문자열)
    """
    if not frame_paths:
        return [], ""

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # 이미지들을 content 배열로 구성
    content = [{"type": "text", "text": VISION_PROMPT}]

    for path in frame_paths:
        try:
            b64 = _encode_image(path)
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{b64}",
                    "detail": "low"  # 비용 절감
                }
            })
        except Exception as e:
            print(f"[Vision] 프레임 인코딩 실패: {path} - {e}")
            continue

    if len(content) <= 1:
        return [], ""

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {
                "role": "user",
                "content": content
            }
        ],
        response_format={"type": "json_object"},
        max_tokens=1500
    )

    raw = response.choices[0].message.content
    print(f"[Vision] 화면 분석 완료: {len(raw)}자")

    # JSON 파싱 → FrameAnalysis 리스트
    frame_analyses: List[FrameAnalysis] = []
    combined_text = ""

    try:
        data = json.loads(raw)
        frames_data = data.get("frames", [])

        for fd in frames_data:
            fa = FrameAnalysis(
                frame_index=fd.get("frame_index", 0),
                description=fd.get("description", ""),
                screen_text=fd.get("screen_text", []),
                category=fd.get("category", "other"),
                quality_score=fd.get("quality_score", 0.5)
            )
            frame_analyses.append(fa)

        # 통합 screen_text 생성 (기존 호환)
        all_texts = []
        all_descriptions = []
        for fa in frame_analyses:
            all_texts.extend(fa.screen_text)
            if fa.description:
                all_descriptions.append(fa.description)

        parts = []
        if all_texts:
            parts.append("[화면 텍스트]\n" + "\n".join(f"- {t}" for t in all_texts))
        if all_descriptions:
            parts.append("[영상 내용]\n" + "\n".join(f"- {d}" for d in all_descriptions))
        combined_text = "\n\n".join(parts)

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"[Vision] JSON 파싱 실패, raw text 폴백: {e}")
        combined_text = raw

    return frame_analyses, combined_text
