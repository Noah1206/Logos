"""
네이버 블로그 크롤러
블로그 URL에서 blogId를 추출하고, RSS 피드 + 모바일 페이지를 통해 게시글 본문을 수집합니다.
"""
import re
import asyncio
import xml.etree.ElementTree as ET
from typing import Optional
from dataclasses import dataclass

import httpx


@dataclass
class BlogPost:
    title: str
    url: str
    content: str


def extract_blog_id(url: str) -> Optional[str]:
    """다양한 네이버 블로그 URL 형식에서 blogId 추출"""
    patterns = [
        r"blog\.naver\.com/([a-zA-Z0-9_-]+)",       # blog.naver.com/{blogId}
        r"m\.blog\.naver\.com/([a-zA-Z0-9_-]+)",     # m.blog.naver.com/{blogId}
        r"blog\.naver\.com/PostList\.naver\?blogId=([a-zA-Z0-9_-]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            blog_id = match.group(1)
            # 게시글 번호가 아닌 blogId만 반환
            if not blog_id.isdigit():
                return blog_id
    return None


async def fetch_rss_posts(blog_id: str, max_posts: int = 10) -> list[dict]:
    """RSS 피드에서 최근 게시글 URL 목록 수집"""
    rss_url = f"https://rss.blog.naver.com/{blog_id}.xml"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(rss_url, follow_redirects=True)

        if resp.status_code == 404:
            raise ValueError("블로그를 찾을 수 없습니다. URL을 확인해주세요.")
        if resp.status_code != 200:
            raise ValueError(f"블로그 RSS를 가져올 수 없습니다. (HTTP {resp.status_code})")

    # RSS XML 파싱
    root = ET.fromstring(resp.text)
    items = root.findall(".//item")

    if not items:
        raise ValueError("블로그에 게시글이 없습니다.")

    posts = []
    for item in items[:max_posts]:
        title = item.findtext("title", "")
        link = item.findtext("link", "")
        if link:
            posts.append({"title": title, "url": link})

    return posts


async def fetch_post_content(post_url: str) -> str:
    """모바일 페이지에서 게시글 본문 텍스트 추출"""
    # PC URL → 모바일 URL 변환
    mobile_url = post_url.replace("blog.naver.com", "m.blog.naver.com")
    if not mobile_url.startswith("http"):
        mobile_url = f"https://{mobile_url}"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
    }

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.get(mobile_url, headers=headers)

    if resp.status_code != 200:
        return ""

    html = resp.text

    # se-main-container 내 텍스트 추출 (스마트에디터 ONE)
    container_match = re.search(
        r'<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>(.*?)</div>\s*(?:</div>)*\s*(?:<div[^>]*class="[^"]*(?:comment|footer)',
        html, re.DOTALL
    )

    if not container_match:
        # 구형 에디터 대응
        container_match = re.search(
            r'<div[^>]*id="postViewArea"[^>]*>(.*?)</div>',
            html, re.DOTALL
        )

    if not container_match:
        # 폴백: __viewArea 등
        container_match = re.search(
            r'<div[^>]*class="[^"]*(?:post_ct|se_doc_viewer|post-view)[^"]*"[^>]*>(.*?)</div>',
            html, re.DOTALL
        )

    if not container_match:
        return ""

    content_html = container_match.group(1)

    # HTML 태그 제거 → 텍스트만 추출
    text = re.sub(r'<br\s*/?>', '\n', content_html)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&#\d+;', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    return text


async def crawl_blog(blog_id: str, max_posts: int = 7) -> list[BlogPost]:
    """블로그 크롤링: RSS에서 게시글 목록 → 각 게시글 본문 수집"""
    rss_posts = await fetch_rss_posts(blog_id, max_posts=max_posts)

    posts: list[BlogPost] = []
    for i, rss_post in enumerate(rss_posts):
        try:
            content = await fetch_post_content(rss_post["url"])
            if content and len(content) >= 50:  # 너무 짧은 글 제외
                posts.append(BlogPost(
                    title=rss_post["title"],
                    url=rss_post["url"],
                    content=content[:3000],  # 분석용으로 최대 3000자
                ))
        except Exception as e:
            print(f"[BlogCrawler] 게시글 크롤링 실패 ({rss_post['url']}): {e}")

        # rate limiting 방지
        if i < len(rss_posts) - 1:
            await asyncio.sleep(0.5)

    return posts
