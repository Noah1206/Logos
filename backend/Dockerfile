FROM python:3.11-slim

# ffmpeg + deno (yt-dlp JS runtime) 설치
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg curl unzip \
    && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gallery-dl

# Playwright Chromium + 시스템 의존성 한번에 설치
RUN playwright install --with-deps chromium

COPY . .

RUN mkdir -p temp

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
