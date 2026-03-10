"""
PDF에서 텍스트 추출
PyMuPDF(pymupdf) 사용, 스캔 PDF는 GPT-4o Vision 폴백
"""
import os
import httpx
from ..core.config import get_settings

settings = get_settings()


async def extract_pdf_text(pdf_url: str | None = None, pdf_path: str | None = None) -> str:
    """PDF에서 텍스트 추출"""
    try:
        import pymupdf
    except ImportError:
        import fitz as pymupdf

    temp_path = None

    if pdf_url:
        # URL에서 PDF 다운로드
        async with httpx.AsyncClient() as client:
            resp = await client.get(pdf_url, follow_redirects=True, timeout=30)
            resp.raise_for_status()
            temp_path = os.path.join(settings.TEMP_DIR, "temp_study.pdf")
            os.makedirs(settings.TEMP_DIR, exist_ok=True)
            with open(temp_path, "wb") as f:
                f.write(resp.content)
            pdf_path = temp_path

    if not pdf_path:
        raise ValueError("pdf_url or pdf_path required")

    # PyMuPDF로 텍스트 추출
    doc = pymupdf.open(pdf_path)
    text_parts = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            text_parts.append(text.strip())
    doc.close()

    # 임시 파일 정리
    if temp_path and os.path.exists(temp_path):
        os.remove(temp_path)

    full_text = "\n\n".join(text_parts)

    # 텍스트가 너무 적으면 (스캔 PDF 가능성) → 경고만
    if len(full_text.strip()) < 50:
        raise ValueError(
            "PDF에서 충분한 텍스트를 추출할 수 없습니다. "
            "스캔된 이미지 PDF일 수 있습니다."
        )

    return full_text
