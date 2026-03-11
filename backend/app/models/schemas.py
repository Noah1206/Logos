from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from enum import Enum


class Platform(str, Enum):
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"


class ConvertRequest(BaseModel):
    url: str
    location: Optional[str] = None  # 예: "홍대", "강남"
    tone: Optional[str] = None  # "일상" | "자영업자"


class VideoInfo(BaseModel):
    platform: Platform
    video_id: str
    title: Optional[str] = None
    duration: Optional[float] = None
    description: Optional[str] = None
    content_type: str = "video"  # "video" | "image"


class ExtractedMeaning(BaseModel):
    """영상에서 추출한 의미 정보"""
    menu_items: List[str] = []          # 메뉴명
    prices: List[str] = []               # 가격 정보
    events: List[str] = []               # 이벤트/프로모션
    atmosphere: List[str] = []           # 매장 분위기
    target_audience: List[str] = []      # 타겟 고객층
    pain_points: List[str] = []          # 고객 문제 상황
    unique_selling_points: List[str] = [] # 차별점
    location_hints: List[str] = []       # 위치 힌트


class SEOKeywords(BaseModel):
    """네이버 검색 의도 기반 키워드"""
    primary_keywords: List[str] = []      # 메인 키워드 (지역 + 업종)
    secondary_keywords: List[str] = []    # 세컨더리 키워드
    long_tail_keywords: List[str] = []    # 롱테일 키워드
    hashtags: List[str] = []              # 해시태그


class FrameAnalysis(BaseModel):
    """프레임별 분석 결과"""
    frame_index: int
    description: str                    # "불고기 덮밥 클로즈업, 계란 반숙"
    screen_text: List[str] = []
    category: str = ""                  # food|exterior|interior|person|menu|product|scenery|text_overlay|other
    quality_score: float = 0.5          # 0.0~1.0


class BlogSection(BaseModel):
    """블로그 본문 섹션 (동적 생성)"""
    emoji: str
    title: str
    content: str
    frame_index: Optional[int] = None   # 매칭된 프레임 (-1=없음, None=미지정)


class BlogStructure(BaseModel):
    """블로그 글 구조 (콘텐츠 유형에 따라 동적 섹션)"""
    title: str
    introduction: str           # 공감 도입부
    sections: List[BlogSection] = []  # 동적 섹션 (3-5개)
    closing_cta: str           # 행동 유도 CTA


class ConvertResponse(BaseModel):
    success: bool
    platform: str
    transcript: Optional[str] = None
    extracted_meaning: Optional[ExtractedMeaning] = None
    seo_keywords: Optional[SEOKeywords] = None
    blog_content: Optional[str] = None
    blog_structure: Optional[BlogStructure] = None
    study_structure: Optional["StudyStructure"] = None
    frame_urls: List[str] = []
    gallery_frame_urls: List[str] = []
    error: Optional[str] = None


class GenerateVideoRequest(BaseModel):
    """블로그 글 → 쇼츠/릴스 영상 생성 요청"""
    blog_content: str               # 블로그 글 전체 텍스트
    style: Optional[str] = None     # 영상 스타일 힌트 (예: "감성", "활기", "정보")


class GenerateVideoResponse(BaseModel):
    success: bool
    video_prompt: Optional[str] = None    # Veo에 보낸 프롬프트
    video_url: Optional[str] = None       # 생성된 영상 다운로드 URL
    error: Optional[str] = None


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = 0
    result: Optional[ConvertResponse] = None


# ─── Knowledge Extraction ───

class KnowledgeExtractionRequest(BaseModel):
    content: str
    transcript: Optional[str] = None


class KnowledgeExtractionResponse(BaseModel):
    summary: str
    key_concepts: List[str]
    keywords: List[str]
    topic: str
    subtopics: List[str]


# ─── Study Mode ───

class StudyRequest(BaseModel):
    mode: str  # "youtube" | "pdf"
    url: Optional[str] = None
    pdf_text: Optional[str] = None
    pdf_url: Optional[str] = None


class StudyConcept(BaseModel):
    name: str
    definition: str
    importance: str  # "high" | "medium" | "low"


class StudyStructure(BaseModel):
    title: str
    executive_summary: str
    key_concepts: List[StudyConcept]
    detailed_notes: List[dict]  # [{topic, content}]
    study_questions: List[dict]  # [{question, answer}]
    related_topics: List[str]


ConvertResponse.model_rebuild()


class StudyResponse(BaseModel):
    success: bool
    title: Optional[str] = None
    transcript: Optional[str] = None
    study_structure: Optional[StudyStructure] = None
    study_content: Optional[str] = None
    error: Optional[str] = None


# ─── AI Thinking ───

class ThinkRequest(BaseModel):
    question: str
    knowledge_context: List[dict] = []
    topic_filter: Optional[str] = None
