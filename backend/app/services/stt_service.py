from openai import OpenAI
from ..core.config import get_settings

settings = get_settings()


async def transcribe_audio(audio_path: str, with_timestamps: bool = False) -> str | tuple[str, list[dict]]:
    """
    OpenAI Whisper API를 사용하여 음성을 텍스트로 변환

    Args:
        audio_path: 오디오 파일 경로
        with_timestamps: True이면 (full_text, segments) 튜플 반환

    Returns:
        with_timestamps=False: 텍스트 문자열
        with_timestamps=True: (full_text, [{start, end, text}, ...]) 튜플
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    if with_timestamps:
        with open(audio_path, "rb") as audio_file:
            result = client.audio.transcriptions.create(
                model=settings.WHISPER_MODEL,
                file=audio_file,
                language="ko",
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        full_text = result.text or ""
        segments = []
        for seg in getattr(result, "segments", []) or []:
            segments.append({
                "start": round(seg.get("start", seg.start if hasattr(seg, "start") else 0), 2),
                "end": round(seg.get("end", seg.end if hasattr(seg, "end") else 0), 2),
                "text": seg.get("text", seg.text if hasattr(seg, "text") else "").strip(),
            })

        return full_text, segments
    else:
        with open(audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model=settings.WHISPER_MODEL,
                file=audio_file,
                language="ko",
                response_format="text",
            )

        return transcript
