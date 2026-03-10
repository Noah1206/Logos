from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from typing import Dict
import asyncio
import json
import uuid
import os

from ..models.schemas import (
    ConvertRequest,
    ConvertResponse,
    GenerateVideoRequest,
    GenerateVideoResponse,
    JobResponse,
    JobStatus,
    KnowledgeExtractionRequest,
    KnowledgeExtractionResponse,
    StudyRequest,
    StudyResponse,
    ThinkRequest,
)
from ..services.pipeline import run_conversion_pipeline, run_study_pipeline
from ..services.video_generator import generate_video_from_blog
from ..services.knowledge_extractor import extract_knowledge
from ..services.thinking_engine import generate_thinking_response

router = APIRouter()

# 간단한 인메모리 작업 저장소 (실제로는 Redis 사용)
jobs: Dict[str, JobResponse] = {}


@router.post("/convert", response_model=ConvertResponse)
async def convert_video(request: ConvertRequest):
    """
    동기 방식 변환 API
    - 소규모 테스트용
    - 응답까지 대기 (30초~1분)
    """
    result = await run_conversion_pipeline(
        url=request.url,
        location=request.location,
        tone=request.tone
    )

    if not result.success:
        raise HTTPException(status_code=400, detail=result.error)

    return result


@router.post("/convert/stream")
async def convert_video_stream(request: ConvertRequest):
    """
    SSE 스트리밍 변환 API
    - 실시간 진행률 전송
    - 완료 시 결과 데이터 포함
    """
    progress_queue: asyncio.Queue = asyncio.Queue()

    async def progress_callback(progress: int, message: str):
        await progress_queue.put({"progress": progress, "message": message})

    async def event_generator():
        # 파이프라인을 백그라운드로 실행
        task = asyncio.create_task(
            run_conversion_pipeline(
                url=request.url,
                location=request.location,
                tone=request.tone,
                progress_callback=progress_callback,
            )
        )

        # 진행률 이벤트 전송
        while not task.done():
            try:
                event = await asyncio.wait_for(progress_queue.get(), timeout=1.0)
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            except asyncio.TimeoutError:
                # 클라이언트 연결 유지를 위한 heartbeat
                yield f": heartbeat\n\n"

        # 큐에 남은 이벤트 모두 전송
        while not progress_queue.empty():
            event = progress_queue.get_nowait()
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

        # 최종 결과 전송
        result: ConvertResponse = task.result()
        if result.success:
            result_data = result.model_dump()
            yield f"data: {json.dumps({'progress': 100, 'message': '완료!', 'result': result_data}, ensure_ascii=False)}\n\n"
        else:
            yield f"data: {json.dumps({'progress': -1, 'message': result.error or '변환 실패', 'error': True}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/convert/async", response_model=JobResponse)
async def convert_video_async(
    request: ConvertRequest,
    background_tasks: BackgroundTasks
):
    """
    비동기 방식 변환 API
    - 작업 ID 즉시 반환
    - 백그라운드에서 처리
    - /convert/status/{job_id}로 상태 확인
    """
    job_id = str(uuid.uuid4())

    # 작업 초기화
    jobs[job_id] = JobResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        progress=0
    )

    # 백그라운드 작업 등록
    background_tasks.add_task(
        process_conversion,
        job_id,
        request.url,
        request.location
    )

    return jobs[job_id]


async def process_conversion(job_id: str, url: str, location: str = None):
    """백그라운드 변환 처리"""
    try:
        # 상태 업데이트: 처리 중
        jobs[job_id].status = JobStatus.PROCESSING
        jobs[job_id].progress = 10

        # 파이프라인 실행
        result = await run_conversion_pipeline(url, location)

        # 결과 저장
        jobs[job_id].progress = 100
        jobs[job_id].result = result

        if result.success:
            jobs[job_id].status = JobStatus.COMPLETED
        else:
            jobs[job_id].status = JobStatus.FAILED

    except Exception as e:
        jobs[job_id].status = JobStatus.FAILED
        jobs[job_id].result = ConvertResponse(
            success=False,
            platform="unknown",
            error=str(e)
        )


@router.get("/convert/status/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """작업 상태 조회"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")

    return jobs[job_id]


@router.post("/generate-video", response_model=GenerateVideoResponse)
async def generate_video(request: GenerateVideoRequest):
    """
    블로그 글 → 쇼츠/릴스 영상 생성 (Veo 3)
    - 블로그 글을 기반으로 9:16 세로 영상 생성
    - 생성에 2~5분 소요
    """
    try:
        video_prompt, video_path = await generate_video_from_blog(
            blog_content=request.blog_content,
            style=request.style
        )

        # 파일명만 반환 (다운로드 엔드포인트에서 사용)
        video_filename = os.path.basename(video_path)

        return GenerateVideoResponse(
            success=True,
            video_prompt=video_prompt,
            video_url=f"/api/video/{video_filename}"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return GenerateVideoResponse(
            success=False,
            error=str(e)
        )


@router.get("/video/{filename}")
async def download_video(filename: str):
    """생성된 영상 파일 다운로드"""
    from ..core.config import get_settings
    settings = get_settings()

    file_path = os.path.join(os.path.abspath(settings.TEMP_DIR), filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="영상 파일을 찾을 수 없습니다")

    return FileResponse(
        file_path,
        media_type="video/mp4",
        filename=filename
    )


@router.get("/frames/{job_id}/{filename}")
async def serve_frame(job_id: str, filename: str):
    """추출된 프레임 이미지 서빙"""
    # path traversal 방지
    if ".." in job_id or "/" in job_id or ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="잘못된 요청입니다")

    # 파일명 검증 (frame_XX.jpg 또는 gallery_XX.jpg 형식만 허용)
    import re as _re
    if not _re.match(r'^(frame|gallery)_\d+\.jpg$', filename):
        raise HTTPException(status_code=400, detail="잘못된 파일명입니다")

    from ..core.config import get_settings
    settings = get_settings()

    file_path = os.path.join(
        os.path.abspath(settings.TEMP_DIR), "frames", job_id, filename
    )

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다")

    return FileResponse(file_path, media_type="image/jpeg")


@router.post("/extract-knowledge", response_model=KnowledgeExtractionResponse)
async def extract_knowledge_endpoint(request: KnowledgeExtractionRequest):
    """콘텐츠에서 지식 추출"""
    result = await extract_knowledge(
        content=request.content,
        transcript=request.transcript,
    )
    return KnowledgeExtractionResponse(**result)


@router.post("/study/stream")
async def study_stream(request: StudyRequest):
    """Study 모드 SSE 스트리밍"""
    progress_queue: asyncio.Queue = asyncio.Queue()

    async def progress_callback(progress: int, message: str):
        await progress_queue.put({"progress": progress, "message": message})

    async def event_generator():
        task = asyncio.create_task(
            run_study_pipeline(
                mode=request.mode,
                url=request.url,
                pdf_text=request.pdf_text,
                pdf_url=request.pdf_url,
                progress_callback=progress_callback,
            )
        )

        while not task.done():
            try:
                event = await asyncio.wait_for(progress_queue.get(), timeout=1.0)
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            except asyncio.TimeoutError:
                yield f": heartbeat\n\n"

        while not progress_queue.empty():
            event = progress_queue.get_nowait()
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

        result: StudyResponse = task.result()
        if result.success:
            result_data = result.model_dump()
            yield f"data: {json.dumps({'progress': 100, 'message': '완료!', 'result': result_data}, ensure_ascii=False)}\n\n"
        else:
            yield f"data: {json.dumps({'progress': -1, 'message': result.error or '학습 요약 실패', 'error': True}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/think")
async def think_endpoint(request: ThinkRequest):
    """AI Thinking 스트리밍 응답"""
    async def event_generator():
        async for chunk in generate_thinking_response(
            question=request.question,
            knowledge_context=request.knowledge_context,
            topic_filter=request.topic_filter,
        ):
            yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'done': True}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "service": "shorts2blog-api"}
