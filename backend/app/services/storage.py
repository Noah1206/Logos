"""Supabase Storage를 이용한 프레임 이미지 영구 저장"""

import os
from typing import List, Optional
from ..core.config import get_settings

BUCKET_NAME = "frames"

_client = None


def _get_client():
    """Supabase 클라이언트 싱글턴"""
    global _client
    if _client is not None:
        return _client

    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None

    from supabase import create_client
    _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # 버킷 존재 확인 (최초 1회)
    try:
        _client.storage.get_bucket(BUCKET_NAME)
    except Exception:
        try:
            _client.storage.create_bucket(
                BUCKET_NAME,
                options={"public": True, "file_size_limit": 5 * 1024 * 1024},
            )
            print(f"[Storage] 버킷 생성: {BUCKET_NAME}")
        except Exception as e:
            print(f"[Storage] 버킷 생성 실패 (이미 존재할 수 있음): {e}")

    return _client


def upload_frames(frame_paths: List[str], job_id: str, prefix: str = "frame") -> Optional[List[str]]:
    """프레임 이미지를 Supabase Storage에 업로드하고 공개 URL 반환.

    실패 시 None 반환 (호출자가 로컬 폴백 처리).
    """
    client = _get_client()
    if not client:
        return None

    settings = get_settings()
    uploaded_urls = []

    for i, frame_path in enumerate(frame_paths):
        if not os.path.exists(frame_path):
            continue

        filename = f"{prefix}_{i:02d}.jpg"
        storage_path = f"{job_id}/{filename}"

        try:
            with open(frame_path, "rb") as f:
                file_data = f.read()

            client.storage.from_(BUCKET_NAME).upload(
                storage_path,
                file_data,
                {"content-type": "image/jpeg", "upsert": "true"},
            )

            public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{storage_path}"
            uploaded_urls.append(public_url)
        except Exception as e:
            print(f"[Storage] 업로드 실패 {storage_path}: {e}")
            return None

    return uploaded_urls
