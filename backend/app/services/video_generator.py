"""
블로그 글 → Veo 3 쇼츠/릴스 영상 생성
1. GPT로 블로그 글 → 영상 프롬프트 변환
2. Veo 3 API로 9:16 세로 영상 생성
"""
import os
import time
import uuid
from typing import Optional
from openai import OpenAI
from google import genai
from google.genai import types
from ..core.config import get_settings

settings = get_settings()

VIDEO_PROMPT_GENERATOR = """당신은 AI 영상 생성 프롬프트 전문가입니다.
아래 블로그 글을 읽고, 이 내용을 15초짜리 세로형(9:16) 쇼츠/릴스 영상으로 만들기 위한
영어 프롬프트를 작성해주세요.

규칙:
1. 반드시 영어로 작성 (Veo 3는 영어 프롬프트가 최적)
2. 시각적으로 매력적인 장면 묘사
3. 카메라 움직임 포함 (slow zoom, pan, tracking shot 등)
4. 분위기/조명/색감 지정
5. 쇼츠/릴스에 적합한 빠른 전환과 역동적 구성
6. 한국적 맥락을 반영 (한국 거리, 음식, 카페 등)
7. 텍스트 오버레이는 포함하지 말 것 (영상만)
8. 200자 이내로 간결하게

{style_hint}

블로그 글:
{blog_content}

영어 영상 프롬프트만 출력하세요 (설명 없이):"""


async def generate_video_from_blog(
    blog_content: str,
    style: Optional[str] = None
) -> tuple[str, str]:
    """
    블로그 글에서 쇼츠/릴스 영상 생성

    Returns: (video_prompt, video_file_path)
    """
    # Step 1: 블로그 → 영상 프롬프트 변환 (GPT)
    print("[VideoGen] 영상 프롬프트 생성 중...")
    video_prompt = await _generate_video_prompt(blog_content, style)
    print(f"[VideoGen] 프롬프트: {video_prompt[:100]}...")

    # Step 2: Veo 3로 영상 생성
    print("[VideoGen] Veo 3 영상 생성 중...")
    video_path = await _generate_with_veo3(video_prompt)
    print(f"[VideoGen] 영상 생성 완료: {video_path}")

    return video_prompt, video_path


async def _generate_video_prompt(
    blog_content: str,
    style: Optional[str] = None
) -> str:
    """GPT로 블로그 글을 영상 프롬프트로 변환"""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    style_hint = ""
    if style:
        style_hint = f"영상 스타일: {style}"

    prompt = VIDEO_PROMPT_GENERATOR.format(
        blog_content=blog_content[:2000],  # 토큰 절약
        style_hint=style_hint
    )

    response = client.chat.completions.create(
        model=settings.GPT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an expert at writing prompts for AI video generation models. Write concise, visual prompts in English."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=300
    )

    return response.choices[0].message.content.strip()


async def _generate_with_veo3(prompt: str) -> str:
    """Veo 3 API로 9:16 세로 영상 생성"""
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    operation = client.models.generate_videos(
        model="veo-3.0-generate-preview",
        prompt=prompt,
        config=types.GenerateVideosConfig(
            aspect_ratio="9:16",
            number_of_videos=1,
        ),
    )

    # 완료 대기 (polling)
    max_wait = 300  # 최대 5분
    elapsed = 0
    while not operation.done:
        if elapsed >= max_wait:
            raise TimeoutError("영상 생성 시간이 초과되었습니다 (5분)")
        print(f"[VideoGen] 생성 대기 중... ({elapsed}초)")
        time.sleep(10)
        elapsed += 10
        operation = client.operations.get(operation)

    # 결과 저장
    generated_video = operation.response.generated_videos[0]

    temp_dir = os.path.abspath(settings.TEMP_DIR)
    os.makedirs(temp_dir, exist_ok=True)
    video_filename = f"generated_{uuid.uuid4().hex[:8]}.mp4"
    video_path = os.path.join(temp_dir, video_filename)

    client.files.download(file=generated_video.video)
    generated_video.video.save(video_path)

    return video_path
