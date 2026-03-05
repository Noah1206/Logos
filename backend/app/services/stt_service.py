from openai import OpenAI
from ..core.config import get_settings

settings = get_settings()


async def transcribe_audio(audio_path: str) -> str:
    """
    OpenAI Whisper API를 사용하여 음성을 텍스트로 변환
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model=settings.WHISPER_MODEL,
            file=audio_file,
            language="ko",  # 한국어 최적화
            response_format="text"
        )

    return transcript
