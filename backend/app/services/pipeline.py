"""
전체 변환 파이프라인
URL → 영상 다운로드 → (오디오 STT + 프레임 Vision 병렬) → 블로그 글 생성
"""
import asyncio
import re
import uuid
from typing import Optional, Callable, Awaitable
from ..models.schemas import ConvertResponse, StudyResponse
from .video_downloader import (
    download_video, extract_audio_from_video, extract_frames,
    extract_dense_frames, cleanup_temp_files, detect_platform,
    persist_frames, get_downloaded_images, convert_images_to_jpg
)
from .stt_service import transcribe_audio
from .vision_analyzer import analyze_frames
from .blog_writer import write_blog

# progress_callback 타입: (progress: int, message: str) -> None
ProgressCallback = Callable[[int, str], Awaitable[None]]


async def _noop_progress(progress: int, message: str) -> None:
    pass


async def run_conversion_pipeline(
    url: str,
    location: Optional[str] = None,
    tone: Optional[str] = None,
    progress_callback: Optional[ProgressCallback] = None,
) -> ConvertResponse:
    """
    전체 변환 파이프라인 실행

    1. 영상 다운로드 + 메타정보 추출
    2. 병렬: 오디오 STT + 프레임 Vision 분석
    3. 모든 정보 합쳐서 블로그 글 생성
    """
    video_path = None
    emit = progress_callback or _noop_progress

    try:
        # Step 1: 콘텐츠 다운로드
        await emit(5, "링크를 분석하고 있어요")
        platform, video_id = detect_platform(url)
        is_feed = bool(re.search(r'instagram\.com/p/', url))
        print(f"[Pipeline] 플랫폼 감지: {platform.value}, ID: {video_id}")

        await emit(10, "게시물을 가져오고 있어요" if is_feed else "영상을 다운로드하고 있어요")
        print("[Pipeline] 콘텐츠 다운로드 중...")
        content_path, video_info = await download_video(url)
        video_path = content_path  # cleanup용
        print(f"[Pipeline] 다운로드 완료: {content_path} (type: {video_info.content_type})")
        if video_info.title:
            print(f"[Pipeline] 제목: {video_info.title}")
        if video_info.description:
            print(f"[Pipeline] 설명: {video_info.description[:100]}...")
        await emit(30, "이미지를 분석 중이에요" if is_feed else "다운로드 완료! 콘텐츠를 분석 중이에요")

        dense_frame_paths: list = []

        if video_info.content_type == "image":
            # === 이미지 피드 (STT 스킵) ===
            await emit(35, "이미지를 분석하고 있어요")
            print("[Pipeline] 이미지 피드 감지 → Vision 분석만 수행")
            transcript = ""
            image_paths = get_downloaded_images(content_path)
            image_paths = await convert_images_to_jpg(image_paths)
            print(f"[Pipeline] 이미지 {len(image_paths)}장 수집")
            await emit(45, "이미지에서 텍스트와 정보를 추출 중이에요")
            frame_analyses, screen_text = await analyze_frames(image_paths)
            frame_paths = image_paths
            print(f"[Pipeline] 화면 분석: {len(frame_analyses)}개, 텍스트: {len(screen_text)}자")
            await emit(65, "이미지 분석 완료!")
        else:
            # === 비디오 (기존 그대로) ===
            await emit(35, "오디오와 프레임을 추출하고 있어요")
            print("[Pipeline] 오디오/프레임 추출 중...")
            audio_path, frame_paths, dense_frame_paths = await asyncio.gather(
                extract_audio_from_video(content_path),
                extract_frames(content_path, max_frames=6),
                extract_dense_frames(content_path, interval=1.0),
            )
            print(f"[Pipeline] 오디오: {audio_path}, 프레임: {len(frame_paths)}장, 갤러리: {len(dense_frame_paths)}장")

            await emit(50, "음성을 텍스트로 변환하고 있어요")
            print("[Pipeline] 음성 인식 + 화면 분석 중...")
            transcript, (frame_analyses, screen_text) = await asyncio.gather(
                transcribe_audio(audio_path),
                analyze_frames(frame_paths)
            )
            print(f"[Pipeline] 음성: {len(transcript)}자, 화면: {len(screen_text)}자")
            print(f"[Pipeline] 프레임 분석: {len(frame_analyses)}개")
            await emit(65, "음성 인식 + 화면 분석 완료!")

        if transcript:
            print(f"[Pipeline] 스크립트:\n{transcript[:200]}...")
        if screen_text:
            print(f"[Pipeline] 화면 텍스트:\n{screen_text[:200]}...")
        if video_info.description:
            print(f"[Pipeline] 캡션:\n{video_info.description[:300]}...")

        # Step 3.5: 프레임 이미지 영구 저장
        job_id = str(uuid.uuid4())
        frame_urls = []
        gallery_frame_urls = []
        if frame_paths:
            frame_urls = persist_frames(frame_paths, job_id, prefix="frame")
            print(f"[Pipeline] 프레임 {len(frame_urls)}장 저장 완료 (job_id: {job_id})")
        if video_info.content_type != "image" and dense_frame_paths:
            gallery_frame_urls = persist_frames(dense_frame_paths, job_id, prefix="gallery")
            print(f"[Pipeline] 갤러리 프레임 {len(gallery_frame_urls)}장 저장 완료")

        # Step 3.6: 컨텐츠 충분성 검증
        has_transcript = len(transcript.strip()) >= 15
        has_screen_text = len(screen_text.strip()) >= 10
        has_description = bool(video_info.description and len(video_info.description.strip()) >= 10)
        has_title = bool(video_info.title and len(video_info.title.strip()) >= 3)

        if not has_transcript and not has_screen_text and not has_description and not has_title:
            raise ValueError(
                "영상에서 충분한 정보를 추출할 수 없습니다. "
                "음성, 화면 텍스트, 영상 설명이 모두 부족합니다."
            )

        # Step 3.7: quality >= 0.3인 프레임만 blog writer에 전달
        frame_desc_list = [
            {
                "frame_index": fa.frame_index,
                "description": fa.description,
                "category": fa.category
            }
            for fa in frame_analyses
            if fa.quality_score >= 0.3
        ]
        print(f"[Pipeline] 블로그용 프레임: {len(frame_desc_list)}개 (quality >= 0.3)")

        # Step 4: 블로그 글 생성
        await emit(70, "SEO 최적화 블로그 글을 작성 중이에요")
        print("[Pipeline] 블로그 글 생성 중...")

        blog_result = await write_blog(
            transcript=transcript if has_transcript else None,
            screen_text=screen_text if has_screen_text else None,
            description=video_info.description if has_description else None,
            video_title=video_info.title,
            location=location,
            frame_descriptions=frame_desc_list if frame_desc_list else None,
            tone=tone
        )
        blog_structure, seo_keywords, blog_content = blog_result

        await emit(95, "블로그 글 작성 완료! 마무리 중이에요")
        print(f"[Pipeline] 블로그 생성 완료: {blog_structure.title}")
        print(f"[Pipeline] 섹션 {len(blog_structure.sections)}개, 해시태그 {len(seo_keywords.hashtags)}개")

        # Step 4.5: 중복 frame_index 후처리 (첫 번째만 유지)
        used = set()
        for section in blog_structure.sections:
            if section.frame_index is not None and section.frame_index >= 0:
                if section.frame_index in used:
                    section.frame_index = -1
                else:
                    used.add(section.frame_index)

        return ConvertResponse(
            success=True,
            platform=platform.value,
            transcript=transcript,
            seo_keywords=seo_keywords,
            blog_content=blog_content,
            blog_structure=blog_structure,
            frame_urls=frame_urls,
            gallery_frame_urls=gallery_frame_urls,
        )

    except Exception as e:
        print(f"[Pipeline] 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return ConvertResponse(
            success=False,
            platform="unknown",
            error=str(e)
        )

    finally:
        if video_path:
            cleanup_temp_files(video_path)


async def run_study_pipeline(
    mode: str,  # "youtube" | "pdf"
    url: Optional[str] = None,
    pdf_text: Optional[str] = None,
    pdf_url: Optional[str] = None,
    progress_callback: Optional[ProgressCallback] = None,
) -> StudyResponse:
    """
    Study 모드 파이프라인
    YouTube 장편 영상 or PDF → 학습 요약 생성
    """
    from .study_writer import write_study_notes
    from .pdf_extractor import extract_pdf_text

    emit = progress_callback or _noop_progress
    video_path = None

    try:
        text = ""
        transcript = ""

        if mode == "pdf":
            await emit(10, "PDF에서 학습 자료를 읽고 있어요")

            if pdf_text:
                text = pdf_text
            elif pdf_url:
                text = await extract_pdf_text(pdf_url=pdf_url)
            else:
                return StudyResponse(success=False, error="PDF 텍스트 또는 URL이 필요합니다")

            await emit(40, "텍스트 추출 완료! 핵심 내용을 파악 중이에요")

        elif mode == "youtube":
            if not url:
                return StudyResponse(success=False, error="YouTube URL이 필요합니다")

            await emit(5, "영상 내용을 파악하고 있어요")
            platform, video_id = detect_platform(url)

            await emit(10, "학습할 영상을 가져오고 있어요")
            content_path, video_info = await download_video(url)
            video_path = content_path

            await emit(30, "영상에서 핵심 내용을 추출하고 있어요")
            audio_path = await extract_audio_from_video(content_path)

            await emit(40, "강의 내용을 텍스트로 정리하고 있어요")
            transcript = await transcribe_audio(audio_path)

            if not transcript or len(transcript.strip()) < 30:
                return StudyResponse(
                    success=False,
                    error="영상에서 충분한 음성을 추출할 수 없습니다."
                )

            text = transcript
            if video_info.title:
                text = f"제목: {video_info.title}\n\n{text}"
            if video_info.description:
                text = f"{text}\n\n설명: {video_info.description[:500]}"

            await emit(55, "내용 파악 완료! 학습 노트를 준비 중이에요")

        else:
            return StudyResponse(success=False, error=f"지원하지 않는 모드: {mode}")

        # 학습 노트 생성
        await emit(65, "핵심 개념과 연습 문제를 만들고 있어요")
        study_structure, study_content = await write_study_notes(text)

        await emit(95, "학습 노트가 완성됐어요!")

        return StudyResponse(
            success=True,
            title=study_structure.title,
            transcript=transcript if transcript else None,
            study_structure=study_structure,
            study_content=study_content,
        )

    except Exception as e:
        print(f"[StudyPipeline] 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return StudyResponse(success=False, error=str(e))

    finally:
        if video_path:
            cleanup_temp_files(video_path)
