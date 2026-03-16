"""
Gemini Imagen 기반 학습 시각 자료 생성기
GOOGLE_API_KEY 미설정 시 graceful하게 None 반환
"""
import base64
import traceback
from typing import Optional
from google import genai
from ..core.config import get_settings

settings = get_settings()

VISUAL_TYPE_PROMPTS = {
    "concept_diagram": "Create a clear educational concept diagram showing the relationship between concepts. Use simple shapes, arrows, and labels. Clean white background, professional style.",
    "comparison_chart": "Create a clean comparison chart or table with clear headers and organized rows. Use contrasting colors for different categories. Educational and easy to read.",
    "process_flow": "Create a step-by-step process flow diagram with numbered steps, arrows showing direction, and brief labels. Clean and professional educational style.",
    "timeline": "Create a horizontal or vertical timeline with key events or milestones marked clearly. Use consistent spacing and clear labels. Educational infographic style.",
    "hierarchy": "Create a hierarchical tree diagram showing parent-child relationships. Use boxes or circles connected by lines. Clean organizational chart style.",
}


async def generate_study_visual(
    topic: str,
    content: str,
    visual_type: str = "concept_diagram",
) -> Optional[dict]:
    """
    학습 주제에 대한 시각 자료 생성

    Returns:
        {image_url: str (base64 data URI), visual_type: str, alt_text: str} or None
    """
    if not settings.GOOGLE_API_KEY:
        return None

    type_prompt = VISUAL_TYPE_PROMPTS.get(visual_type, VISUAL_TYPE_PROMPTS["concept_diagram"])

    prompt = (
        f"Educational visual for the topic: '{topic}'. "
        f"Context: {content[:500]}. "
        f"{type_prompt} "
        "Use Korean text labels where appropriate. "
        "No watermarks, no stock photo style. Clean infographic illustration."
    )

    try:
        client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        response = client.models.generate_images(
            model="imagen-3.0-generate-002",
            prompt=prompt,
            config=genai.types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9",
                safety_filter_level="BLOCK_ONLY_HIGH",
            ),
        )

        if not response.generated_images:
            return None

        image = response.generated_images[0]
        image_bytes = image.image.image_bytes
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64}"

        return {
            "image_url": data_uri,
            "visual_type": visual_type,
            "alt_text": f"{topic} - {visual_type.replace('_', ' ')}",
        }

    except Exception:
        traceback.print_exc()
        return None
