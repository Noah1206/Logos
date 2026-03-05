import os
import time
import shutil
import asyncio
import base64
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .core.config import get_settings

settings = get_settings()

# temp 폴더 생성
os.makedirs(settings.TEMP_DIR, exist_ok=True)

# Instagram 쿠키 파일 생성 (환경변수에서 base64 디코딩)
COOKIES_PATH = os.path.join(os.path.dirname(__file__), "..", "cookies.txt")
_cookies_b64 = os.environ.get("INSTAGRAM_COOKIES_B64")
if _cookies_b64:
    with open(COOKIES_PATH, "w") as f:
        f.write(base64.b64decode(_cookies_b64).decode())
    print(f"[Init] Instagram cookies 파일 생성: {COOKIES_PATH}")


async def cleanup_expired_frames():
    """1시간 이상 된 프레임 디렉토리 삭제 (10분마다 실행)"""
    frames_base = os.path.join(os.path.abspath(settings.TEMP_DIR), "frames")
    while True:
        try:
            if os.path.isdir(frames_base):
                now = time.time()
                for job_dir in os.listdir(frames_base):
                    job_path = os.path.join(frames_base, job_dir)
                    if not os.path.isdir(job_path):
                        continue
                    age = now - os.path.getmtime(job_path)
                    if age > 3600:  # 1시간
                        shutil.rmtree(job_path, ignore_errors=True)
                        print(f"[Cleanup] 만료된 프레임 삭제: {job_dir}")
        except Exception as e:
            print(f"[Cleanup] 프레임 정리 오류: {e}")
        await asyncio.sleep(600)  # 10분


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_expired_frames())
    yield
    task.cancel()


app = FastAPI(
    title="Shorts2Blog API",
    description="유튜브 쇼츠/인스타 릴스 → 네이버 블로그 SEO 변환 API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정 (Next.js 프론트엔드 허용)
cors_origins = [
    "http://localhost:3000",
    "http://localhost:6600",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:6600",
]
# 프로덕션 도메인 (환경변수로 추가)
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    cors_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {
        "service": "Shorts2Blog API",
        "version": "1.0.0",
        "docs": "/docs"
    }
