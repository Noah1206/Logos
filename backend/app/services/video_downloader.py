import os
import re
import uuid
import glob
import json
import asyncio
import httpx
from typing import Optional, Tuple, List
from ..models.schemas import Platform, VideoInfo
from ..core.config import get_settings

settings = get_settings()

COOKIES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "cookies.txt")

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}


BROWSER_CANDIDATES = ["chrome", "brave", "firefox", "safari", "edge"]


def _get_instagram_cookie_args() -> list:
    """서버 쿠키 파일이 있으면 --cookies, 없으면 빈 리스트 (브라우저 폴백은 별도 처리)"""
    if os.path.exists(COOKIES_PATH):
        return ["--cookies", COOKIES_PATH]
    return []


def _get_browser_cookie_args(browser: str) -> list:
    """특정 브라우저에서 쿠키 추출 인자 반환"""
    return ["--cookies-from-browser", browser]


def _get_proxy_args() -> list:
    """프록시 설정이 있으면 --proxy 인자 반환"""
    if settings.PROXY_URL:
        return ["--proxy", settings.PROXY_URL]
    return []


async def _download_via_rapidapi(url: str, temp_dir: str, temp_id: str) -> Optional[str]:
    """
    RapidAPI instagram-video-downloader13 으로 다운로드 (최종 폴백)
    엔드포인트: POST /index.php  url=<instagram_url>
    Returns: 다운로드된 파일 경로 또는 None
    """
    if not settings.RAPIDAPI_KEY:
        print("[RapidAPI] RAPIDAPI_KEY 미설정, 스킵")
        return None

    RAPIDAPI_HOST = "instagram-video-downloader13.p.rapidapi.com"

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            print("[RapidAPI] instagram-video-downloader13 시도 중...")
            response = await client.post(
                f"https://{RAPIDAPI_HOST}/index.php",
                data={"url": url},
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "x-rapidapi-host": RAPIDAPI_HOST,
                    "x-rapidapi-key": settings.RAPIDAPI_KEY,
                },
            )

            if response.status_code != 200:
                print(f"[RapidAPI] API 응답 오류: {response.status_code}")
                return None

            data = response.json()
            if not data.get("success"):
                print(f"[RapidAPI] 실패 응답: {str(data)[:200]}")
                return None

            # medias 배열에서 비디오/이미지 URL 추출
            medias = data.get("medias", [])
            media_url = None
            media_type = "video"

            # 비디오 우선 탐색
            for m in medias:
                if m.get("type") == "video" and m.get("url"):
                    media_url = m["url"]
                    media_type = "video"
                    break

            # 비디오 없으면 이미지
            if not media_url:
                for m in medias:
                    if m.get("type") == "image" and m.get("url"):
                        media_url = m["url"]
                        media_type = "image"
                        break

            # medias가 비어있으면 thumbnail 사용
            if not media_url:
                media_url = data.get("thumbnail")
                media_type = "image"

            if not media_url:
                print(f"[RapidAPI] 미디어 URL을 찾을 수 없음")
                return None

            # 미디어 파일 다운로드
            print(f"[RapidAPI] {media_type} 다운로드 중...")
            media_response = await client.get(
                media_url, follow_redirects=True, timeout=60
            )
            if media_response.status_code != 200:
                print(f"[RapidAPI] 미디어 다운로드 실패: {media_response.status_code}")
                return None

            ext = ".mp4" if media_type == "video" else ".jpg"
            file_path = os.path.join(temp_dir, f"{temp_id}{ext}")

            with open(file_path, "wb") as f:
                f.write(media_response.content)

            file_size = os.path.getsize(file_path)
            if file_size < 1000:
                os.remove(file_path)
                print(f"[RapidAPI] 파일 크기 너무 작음 ({file_size}B)")
                return None

            print(f"[RapidAPI] 다운로드 성공: {file_size / 1024:.1f}KB ({media_type})")
            return file_path

    except Exception as e:
        print(f"[RapidAPI] 오류: {e}")
        return None


async def _download_instagram_via_playwright(url: str, temp_dir: str, temp_id: str) -> Optional[dict]:
    """
    Playwright + Stealth로 Instagram 콘텐츠 다운로드.
    브라우저 세션 내에서 응답 바이트를 직접 캡처 (CDN URL 재다운로드 불필요).
    fMP4(DASH) 대응: 모든 비디오 세그먼트를 순서대로 수집 후 결합.

    Returns: {"path": str, "caption": str|None, "title": str|None} 또는 None
    """
    try:
        from playwright.async_api import async_playwright
        from playwright_stealth import Stealth
    except ImportError:
        print("[Playwright] playwright 또는 playwright-stealth 미설치, 스킵")
        return None

    # fMP4 대응: 모든 비디오 세그먼트를 순서대로 수집
    video_parts: list[bytes] = []
    best_image: dict = {"data": b"", "size": 0}

    async def _on_response(response):
        """네트워크 응답에서 미디어 바이트를 직접 캡처"""
        content_type = response.headers.get("content-type", "")
        try:
            if "video" in content_type:
                body = await response.body()
                if len(body) > 100:  # init segment도 포함 (작은 것도 수집)
                    video_parts.append(body)
                    print(f"[Playwright] video segment: {len(body)/1024:.1f}KB (총 {len(video_parts)}개)")
            elif any(x in content_type for x in ["image/jpeg", "image/webp"]):
                if "scontent" in response.url:
                    # 프로필/썸네일 사이즈 패턴 제외
                    skip_patterns = ["/s150x150/", "/s44x44/", "/s32x32/", "/s64x64/", "/s128x128/"]
                    if any(p in response.url for p in skip_patterns):
                        return
                    body = await response.body()
                    # 최소 50KB 이상만 (프로필 사진은 보통 < 20KB)
                    if len(body) > 51200 and len(body) > best_image["size"]:
                        best_image["data"] = body
                        best_image["size"] = len(body)
        except Exception:
            pass

    try:
        print(f"[Playwright] Stealth 모드로 Instagram 접근 중... URL: {url}")
        stealth = Stealth()

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                locale="ko-KR",
            )
            await stealth.apply_stealth_async(context)

            # 쿠키 없이 먼저 시도 (공개 게시물은 쿠키 불필요, 쿠키가 오히려 리다이렉트 유발)
            page = await context.new_page()
            page.on("response", _on_response)

            # 페이지 로드
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
            except Exception:
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    await page.wait_for_timeout(5000)
                except Exception as e:
                    print(f"[Playwright] 페이지 로드 실패: {e}")
                    await browser.close()
                    return None

            # 리다이렉트 감지 - 실제 URL 확인
            current_url = page.url
            print(f"[Playwright] 현재 페이지 URL: {current_url}")

            # 로그인 페이지로 리다이렉트된 경우 → 쿠키로 재시도
            if "/accounts/login" in current_url or "/challenge" in current_url:
                print("[Playwright] 로그인 리다이렉트 감지 → 쿠키로 재시도")
                video_parts.clear()
                best_image["data"] = b""
                best_image["size"] = 0
                await page.close()

                # 쿠키 로드
                if os.path.exists(COOKIES_PATH):
                    cookies = _parse_netscape_cookies(COOKIES_PATH)
                    if cookies:
                        await context.add_cookies(cookies)
                        print(f"[Playwright] cookies.txt에서 {len(cookies)}개 쿠키 로드")

                page = await context.new_page()
                page.on("response", _on_response)
                try:
                    await page.goto(url, wait_until="networkidle", timeout=30000)
                except Exception:
                    try:
                        await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                        await page.wait_for_timeout(5000)
                    except Exception:
                        await browser.close()
                        return None

                current_url = page.url
                print(f"[Playwright] 쿠키 재시도 후 URL: {current_url}")

            # 비디오 재생 트리거 (더 많은 세그먼트 로드 유도)
            try:
                await page.click("video", timeout=3000)
                await page.wait_for_timeout(3000)
            except Exception:
                pass

            await page.wait_for_timeout(2000)

            # DOM에서 게시물 이미지 추출 (캐러셀 포함 - 프로필/추천 필터링)
            dom_image_urls = await page.evaluate("""
                () => {
                    const urls = [];
                    const seen = new Set();
                    const skipSizes = ['/s150x150/', '/s44x44/', '/s32x32/', '/s64x64/', '/s128x128/'];
                    const article = document.querySelector('article');
                    if (!article) return urls;
                    const imgs = article.querySelectorAll('img[srcset], img[src*="scontent"]');
                    for (const img of imgs) {
                        // 작은 이미지 제외 (프로필 사진 등)
                        if (img.naturalWidth > 0 && img.naturalWidth < 200) continue;
                        if (img.naturalHeight > 0 && img.naturalHeight < 200) continue;
                        // alt 텍스트로 프로필 사진 제외
                        const alt = (img.alt || '').toLowerCase();
                        if (alt.includes('profile') || alt.includes('프로필')) continue;
                        let url = null;
                        if (img.srcset) {
                            const parts = img.srcset.split(',');
                            const last = parts[parts.length - 1].trim().split(' ')[0];
                            if (last) url = last;
                        }
                        if (!url) url = img.src;
                        // 프로필 썸네일 URL 패턴 제외
                        if (url && skipSizes.some(s => url.includes(s))) continue;
                        if (url && !seen.has(url) && url.includes('scontent')) {
                            seen.add(url);
                            urls.push(url);
                        }
                    }
                    return urls;
                }
            """)

            # 캐러셀이면 넘기면서 추가 이미지 수집
            if dom_image_urls:
                for _ in range(10):  # 최대 10번 넘기기
                    try:
                        next_btn = await page.query_selector('article button[aria-label="Next"], article button[aria-label="다음"]')
                        if not next_btn:
                            break
                        await next_btn.click()
                        await page.wait_for_timeout(800)
                        new_urls = await page.evaluate("""
                            () => {
                                const urls = [];
                                const skipSizes = ['/s150x150/', '/s44x44/', '/s32x32/', '/s64x64/', '/s128x128/'];
                                const article = document.querySelector('article');
                                if (!article) return urls;
                                const imgs = article.querySelectorAll('img[srcset], img[src*="scontent"]');
                                for (const img of imgs) {
                                    if (img.naturalWidth > 0 && img.naturalWidth < 200) continue;
                                    if (img.naturalHeight > 0 && img.naturalHeight < 200) continue;
                                    const alt = (img.alt || '').toLowerCase();
                                    if (alt.includes('profile') || alt.includes('프로필')) continue;
                                    let url = null;
                                    if (img.srcset) {
                                        const parts = img.srcset.split(',');
                                        const last = parts[parts.length - 1].trim().split(' ')[0];
                                        if (last) url = last;
                                    }
                                    if (!url) url = img.src;
                                    if (url && skipSizes.some(s => url.includes(s))) continue;
                                    if (url && url.includes('scontent')) urls.push(url);
                                }
                                return urls;
                            }
                        """)
                        added = False
                        seen = set(dom_image_urls)
                        for u in new_urls:
                            if u not in seen:
                                dom_image_urls.append(u)
                                seen.add(u)
                                added = True
                        if not added:
                            break
                    except Exception:
                        break

            dom_image_url = dom_image_urls[0] if dom_image_urls else None
            print(f"[Playwright] DOM 게시물 이미지 {len(dom_image_urls)}장 발견")

            # DOM에서 video src 추출 → 브라우저 fetch로 다운로드
            video_blob_url = await page.evaluate("""
                () => {
                    const v = document.querySelector('video');
                    if (v && v.src && !v.src.startsWith('blob:')) return v.src;
                    const s = v && v.querySelector('source');
                    if (s && s.src && !s.src.startsWith('blob:')) return s.src;
                    return null;
                }
            """)

            dom_video_data = None
            if video_blob_url:
                print(f"[Playwright] DOM video src 발견: {video_blob_url[:80]}...")
                try:
                    resp = await page.request.get(video_blob_url)
                    if resp.ok:
                        dom_video_data = await resp.body()
                        print(f"[Playwright] DOM video fetch 성공: {len(dom_video_data)/1024:.1f}KB")
                except Exception as e:
                    print(f"[Playwright] DOM video fetch 실패: {e}")

            # DOM 이미지 fetch (캐러셀 전체 다운로드)
            dom_image_data_list: list[bytes] = []
            dom_image_data = None
            if dom_image_urls and not dom_video_data:
                for i, img_url in enumerate(dom_image_urls):
                    try:
                        resp = await page.request.get(img_url)
                        if resp.ok:
                            img_data = await resp.body()
                            if len(img_data) > 1000:
                                dom_image_data_list.append(img_data)
                                print(f"[Playwright] DOM 이미지 {i+1}/{len(dom_image_urls)} fetch: {len(img_data)/1024:.1f}KB")
                    except Exception as e:
                        print(f"[Playwright] DOM 이미지 {i+1} fetch 실패: {e}")
                dom_image_data = dom_image_data_list[0] if dom_image_data_list else None
                print(f"[Playwright] 총 {len(dom_image_data_list)}장 이미지 다운로드 완료")

            # DOM에서 캡션(설명글) 추출 (yt-dlp 메타데이터 대체)
            caption = await page.evaluate("""
                () => {
                    // 방법 1: article 내 실제 캡션 텍스트 (가장 정확)
                    // Instagram 캡션은 article 내 h1 다음의 span들에 있음
                    const article = document.querySelector('article');
                    if (article) {
                        // 캡션 영역: 댓글/좋아요가 아닌, 게시물 본문 캡션
                        const h1 = article.querySelector('h1');
                        if (h1) {
                            // h1 자체의 텍스트 또는 h1 부모의 전체 텍스트
                            const captionText = h1.textContent || '';
                            if (captionText.length > 5) return captionText.trim();
                        }
                        // h1이 없으면 캡션 컨테이너 찾기
                        const captionSpans = article.querySelectorAll('span[dir="auto"]');
                        let best = '';
                        for (const s of captionSpans) {
                            const t = (s.textContent || '').trim();
                            if (t.length > best.length && t.length > 5) best = t;
                        }
                        if (best) return best;
                        // 일반 span 중 가장 긴 것
                        const allSpans = article.querySelectorAll('span');
                        for (const s of allSpans) {
                            const t = (s.textContent || '').trim();
                            if (t.length > best.length && t.length > 10) best = t;
                        }
                        if (best) return best;
                    }
                    // 방법 2: meta 태그 (잘릴 수 있지만 폴백)
                    const meta = document.querySelector('meta[property="og:description"]');
                    if (meta && meta.content && meta.content.length > 20) return meta.content;
                    const desc = document.querySelector('meta[name="description"]');
                    if (desc && desc.content && desc.content.length > 20) return desc.content;
                    return null;
                }
            """)

            # DOM에서 제목 추출
            page_title = await page.evaluate("""
                () => {
                    const ogTitle = document.querySelector('meta[property="og:title"]');
                    if (ogTitle && ogTitle.content) return ogTitle.content;
                    return document.title || null;
                }
            """)

            if caption:
                print(f"[Playwright] 캡션 추출: {caption[:100]}...")
            if page_title:
                print(f"[Playwright] 제목 추출: {page_title[:80]}")

            await browser.close()

        total_parts_size = sum(len(p) for p in video_parts)
        print(f"[Playwright] 캡처: video segments {len(video_parts)}개 ({total_parts_size/1024:.1f}KB), 이미지 {best_image['size']/1024:.1f}KB")

        def _result(path):
            return {"path": path, "caption": caption, "title": page_title}

        # 방법 1: DOM에서 직접 fetch한 완전한 MP4 (가장 안정적)
        if dom_video_data and len(dom_video_data) > 10000:
            file_path = os.path.join(temp_dir, f"{temp_id}.mp4")
            with open(file_path, "wb") as f:
                f.write(dom_video_data)
            if await _verify_video(file_path):
                print(f"[Playwright] DOM video 저장 완료: {len(dom_video_data)/1024:.1f}KB")
                return _result(file_path)
            else:
                print("[Playwright] DOM video가 유효하지 않음, 세그먼트 결합 시도")
                os.remove(file_path)

        # 방법 2: 모든 비디오 세그먼트 결합 (fMP4/DASH)
        if video_parts and total_parts_size > 1000:
            file_path = os.path.join(temp_dir, f"{temp_id}_raw.mp4")
            with open(file_path, "wb") as f:
                for part in video_parts:
                    f.write(part)

            if await _verify_video(file_path):
                final_path = os.path.join(temp_dir, f"{temp_id}.mp4")
                os.rename(file_path, final_path)
                print(f"[Playwright] 세그먼트 결합 비디오 저장: {total_parts_size/1024:.1f}KB")
                return _result(final_path)

            # 결합 실패 시: ffmpeg로 remux 시도
            print("[Playwright] 세그먼트 결합 파일이 유효하지 않음, remux 시도...")
            remuxed_path = os.path.join(temp_dir, f"{temp_id}.mp4")
            remux_cmd = [
                "ffmpeg", "-y",
                "-i", file_path,
                "-c", "copy",
                "-movflags", "+faststart",
                remuxed_path
            ]
            proc = await asyncio.create_subprocess_exec(
                *remux_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()
            os.remove(file_path)

            if os.path.exists(remuxed_path) and os.path.getsize(remuxed_path) > 1000:
                print(f"[Playwright] remux 성공: {os.path.getsize(remuxed_path)/1024:.1f}KB")
                return _result(remuxed_path)

            # remux도 실패 시: 가장 큰 세그먼트 단독 저장
            if video_parts:
                biggest = max(video_parts, key=len)
                file_path = os.path.join(temp_dir, f"{temp_id}.mp4")
                with open(file_path, "wb") as f:
                    f.write(biggest)
                if await _verify_video(file_path):
                    print(f"[Playwright] 최대 세그먼트 저장: {len(biggest)/1024:.1f}KB")
                    return _result(file_path)
                os.remove(file_path)

        # 이미지 폴백: DOM 추출 이미지 우선 (캐러셀 전체 저장)
        if dom_image_data_list and len(dom_image_data_list) > 0:
            if len(dom_image_data_list) == 1:
                # 단일 이미지
                file_path = os.path.join(temp_dir, f"{temp_id}.jpg")
                with open(file_path, "wb") as f:
                    f.write(dom_image_data_list[0])
                print(f"[Playwright] DOM 게시물 이미지 저장: {len(dom_image_data_list[0])/1024:.1f}KB")
                return _result(file_path)
            else:
                # 캐러셀: 폴더에 여러 이미지 저장
                img_dir = os.path.join(temp_dir, temp_id)
                os.makedirs(img_dir, exist_ok=True)
                for i, img_data in enumerate(dom_image_data_list):
                    img_path = os.path.join(img_dir, f"{temp_id}_{i+1:02d}.jpg")
                    with open(img_path, "wb") as f:
                        f.write(img_data)
                print(f"[Playwright] 캐러셀 {len(dom_image_data_list)}장 저장 → {img_dir}")
                return _result(img_dir)

        # 네트워크 캡처 이미지 (DOM 추출 실패 시)
        if best_image["size"] > 1000:
            file_path = os.path.join(temp_dir, f"{temp_id}.jpg")
            with open(file_path, "wb") as f:
                f.write(best_image["data"])
            print(f"[Playwright] 네트워크 캡처 이미지 저장: {best_image['size']/1024:.1f}KB")
            return _result(file_path)

        print("[Playwright] 미디어를 찾지 못함")
        return None

    except Exception as e:
        print(f"[Playwright] 오류: {e}")
        return None


async def _verify_video(file_path: str) -> bool:
    """ffprobe로 비디오 파일 유효성 검증"""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=codec_name,width,height",
            "-of", "csv=p=0",
            file_path
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        result = stdout.decode().strip()
        if proc.returncode == 0 and result:
            print(f"[Playwright] ffprobe 검증 OK: {result}")
            return True
        print(f"[Playwright] ffprobe 검증 실패: {stderr.decode()[:200]}")
        return False
    except Exception:
        return False


async def _download_best_media(
    urls: list[str], temp_dir: str, temp_id: str, ext: str, media_type: str
) -> Optional[str]:
    """여러 CDN URL 중 가장 큰 파일을 다운로드"""
    best_content = None
    best_size = 0

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        for i, vurl in enumerate(urls[:5]):
            try:
                print(f"[Playwright] CDN 다운로드 시도 {i+1}: {vurl[:80]}...")
                resp = await client.get(vurl, headers={
                    "Referer": "https://www.instagram.com/",
                    "Origin": "https://www.instagram.com",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                })
                print(f"[Playwright] CDN 응답: HTTP {resp.status_code}, {len(resp.content)}B")
                if resp.status_code == 200 and len(resp.content) > best_size:
                    best_size = len(resp.content)
                    best_content = resp.content
            except Exception as e:
                print(f"[Playwright] CDN 다운로드 오류: {e}")
                continue

    if not best_content or best_size < 1000:
        print(f"[Playwright] {media_type} 다운로드 실패 (best_size={best_size}B)")
        return None

    file_path = os.path.join(temp_dir, f"{temp_id}{ext}")
    with open(file_path, "wb") as f:
        f.write(best_content)

    print(f"[Playwright] {media_type} 다운로드 성공: {best_size / 1024:.1f}KB")
    return file_path


def _parse_netscape_cookies(cookies_path: str) -> list[dict]:
    """Netscape 형식 cookies.txt를 Playwright 쿠키 형식으로 변환"""
    cookies = []
    try:
        with open(cookies_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t")
                if len(parts) < 7:
                    continue
                domain, http_only_flag, path, secure, expires, name, value = parts[:7]
                if "instagram.com" not in domain:
                    continue
                cookie: dict = {
                    "name": name,
                    "value": value,
                    "domain": domain if domain.startswith(".") else f".{domain}",
                    "path": path,
                    "secure": secure.upper() == "TRUE",
                    "httpOnly": http_only_flag.upper() == "TRUE",
                }
                try:
                    exp = int(expires)
                    if exp > 0:
                        cookie["expires"] = exp
                except ValueError:
                    pass
                cookies.append(cookie)
    except Exception:
        pass
    return cookies


async def _download_instagram_embed(url: str, temp_dir: str, temp_id: str) -> Optional[str]:
    """
    Instagram embed 페이지에서 비디오/이미지 URL 직접 추출 (로그인 불필요)
    Returns: 다운로드된 파일 경로 또는 None
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Sec-Fetch-Mode": "navigate",
        }

        # embed URL 생성
        embed_url = url.rstrip('/') + '/embed/'
        print(f"[Embed] Instagram embed 페이지 시도: {embed_url}")

        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            response = await client.get(embed_url, headers=headers)

            if response.status_code != 200:
                print(f"[Embed] HTTP {response.status_code}")
                return None

            html = response.text

            # video_url 추출 (JSON 데이터에서)
            video_url = None
            for pattern in [
                r'"video_url"\s*:\s*"([^"]+)"',
                r'"contentUrl"\s*:\s*"([^"]+)"',
                r'video_url&quot;:&quot;([^&]+)&',
                r'"src"\s*:\s*"(https://[^"]*\.mp4[^"]*)"',
            ]:
                match = re.search(pattern, html)
                if match:
                    video_url = match.group(1).replace('\\u0026', '&').replace('\\/', '/')
                    break

            if video_url:
                print(f"[Embed] 비디오 URL 발견, 다운로드 중...")
                media_response = await client.get(
                    video_url, headers=headers, follow_redirects=True, timeout=60
                )
                if media_response.status_code == 200 and len(media_response.content) > 1000:
                    file_path = os.path.join(temp_dir, f"{temp_id}.mp4")
                    with open(file_path, 'wb') as f:
                        f.write(media_response.content)
                    print(f"[Embed] 비디오 다운로드 성공: {os.path.getsize(file_path) / 1024:.1f}KB")
                    return file_path

            # 이미지 URL 추출
            img_url = None
            for pattern in [
                r'"display_url"\s*:\s*"([^"]+)"',
                r'"thumbnailUrl"\s*:\s*"([^"]+)"',
                r'display_url&quot;:&quot;([^&]+)&',
                r'class="EmbeddedMediaImage"[^>]*src="([^"]+)"',
            ]:
                match = re.search(pattern, html)
                if match:
                    img_url = match.group(1).replace('\\u0026', '&').replace('\\/', '/')
                    break

            if img_url:
                print(f"[Embed] 이미지 URL 발견, 다운로드 중: {img_url[:80]}...")
                media_response = await client.get(
                    img_url, headers=headers, follow_redirects=True, timeout=60
                )
                print(f"[Embed] 이미지 응답: HTTP {media_response.status_code}, {len(media_response.content)}B")
                if media_response.status_code == 200 and len(media_response.content) > 1000:
                    file_path = os.path.join(temp_dir, f"{temp_id}.jpg")
                    with open(file_path, 'wb') as f:
                        f.write(media_response.content)
                    print(f"[Embed] 이미지 다운로드 성공: {os.path.getsize(file_path) / 1024:.1f}KB")
                    return file_path

            print("[Embed] 미디어 URL을 찾을 수 없음")
            return None

    except Exception as e:
        print(f"[Embed] 오류: {e}")
        return None


async def _download_instagram_via_gallery_dl(url: str, temp_dir: str, temp_id: str) -> Optional[str]:
    """
    gallery-dl로 Instagram 콘텐츠 다운로드 (릴스/포스트 모두 지원)
    Returns: 다운로드된 파일 경로 또는 None
    """
    import shutil

    gallery_dir = os.path.join(temp_dir, f"gallery_{temp_id}")
    os.makedirs(gallery_dir, exist_ok=True)

    cookie_args = (
        ["--cookies", COOKIES_PATH]
        if os.path.exists(COOKIES_PATH)
        else []
    )

    cmd = ["gallery-dl", *cookie_args, "-d", gallery_dir, url]
    print(f"[gallery-dl] Instagram 다운로드 시도...")

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=60)
        print(f"[gallery-dl] returncode: {process.returncode}")
        if stderr:
            print(f"[gallery-dl] stderr: {stderr.decode()[:300]}")
    except asyncio.TimeoutError:
        print("[gallery-dl] 타임아웃")
        shutil.rmtree(gallery_dir, ignore_errors=True)
        return None
    except FileNotFoundError:
        print("[gallery-dl] gallery-dl 미설치, 스킵")
        shutil.rmtree(gallery_dir, ignore_errors=True)
        return None

    # 다운로드된 파일 수집
    downloaded_videos = []
    downloaded_images = []
    for root, dirs, files in os.walk(gallery_dir):
        for f in sorted(files):
            full = os.path.join(root, f)
            if f.lower().endswith(('.mp4', '.webm', '.mkv', '.mov')):
                downloaded_videos.append(full)
            elif _is_image_file(f):
                downloaded_images.append(full)

    if not downloaded_videos and not downloaded_images:
        shutil.rmtree(gallery_dir, ignore_errors=True)
        print("[gallery-dl] 다운로드된 파일 없음")
        return None

    # 비디오 우선
    if downloaded_videos:
        src = downloaded_videos[0]
        ext = os.path.splitext(src)[1]
        dest = os.path.join(temp_dir, f"{temp_id}{ext}")
        shutil.copy2(src, dest)
        shutil.rmtree(gallery_dir, ignore_errors=True)
        print(f"[gallery-dl] 비디오 다운로드 성공: {os.path.getsize(dest) / 1024:.1f}KB")
        return dest

    # 이미지
    src = downloaded_images[0]
    ext = os.path.splitext(src)[1]
    dest = os.path.join(temp_dir, f"{temp_id}{ext}")
    shutil.copy2(src, dest)

    # 캐러셀 이미지도 복사
    for i, img_src in enumerate(downloaded_images[1:], start=1):
        img_ext = os.path.splitext(img_src)[1]
        img_dest = os.path.join(temp_dir, f"{temp_id}.{i}{img_ext}")
        shutil.copy2(img_src, img_dest)

    shutil.rmtree(gallery_dir, ignore_errors=True)
    print(f"[gallery-dl] 이미지 다운로드 성공: {len(downloaded_images)}장")
    return dest


def _is_image_file(path: str) -> bool:
    """파일 확장자로 이미지 여부 판별"""
    _, ext = os.path.splitext(path.lower())
    return ext in IMAGE_EXTENSIONS


def _is_instagram_post(url: str) -> bool:
    """인스타그램 /p/ (피드 게시물) URL인지 확인"""
    return bool(re.search(r'instagram\.com/p/', url))


def detect_platform(url: str) -> Tuple[Platform, str]:
    """URL에서 플랫폼과 비디오 ID 추출"""

    # YouTube Shorts 패턴
    youtube_patterns = [
        r'youtube\.com/shorts/([a-zA-Z0-9_-]+)',
        r'youtu\.be/([a-zA-Z0-9_-]+)',
        r'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)',
    ]

    for pattern in youtube_patterns:
        match = re.search(pattern, url)
        if match:
            return Platform.YOUTUBE, match.group(1)

    # Instagram Reels 패턴
    instagram_patterns = [
        r'instagram\.com/reel/([a-zA-Z0-9_-]+)',
        r'instagram\.com/reels/([a-zA-Z0-9_-]+)',
        r'instagram\.com/p/([a-zA-Z0-9_-]+)',
    ]

    for pattern in instagram_patterns:
        match = re.search(pattern, url)
        if match:
            return Platform.INSTAGRAM, match.group(1)

    # Instagram 프로필 URL 감지 → 친절한 안내
    if re.search(r'instagram\.com/([a-zA-Z0-9_.]+)/?(\?|$)', url):
        raise ValueError(
            "인스타그램 프로필 링크는 변환할 수 없어요. "
            "릴스나 게시물의 링크를 넣어주세요. "
            "(예: instagram.com/reel/... 또는 instagram.com/p/...)"
        )

    raise ValueError(f"지원하지 않는 URL 형식입니다: {url}")


async def download_video(url: str) -> Tuple[str, VideoInfo]:
    """
    영상 파일 전체를 다운로드 + 메타정보 추출
    Returns: (콘텐츠 파일 경로, 비디오 정보)
    """
    platform, video_id = detect_platform(url)

    temp_id = str(uuid.uuid4())
    temp_dir = os.path.abspath(settings.TEMP_DIR)
    os.makedirs(temp_dir, exist_ok=True)

    is_post = _is_instagram_post(url)

    # 비디오 콘텐츠 (YouTube, Instagram Reels) → yt-dlp
    # Instagram /p/ URL도 yt-dlp로 먼저 시도 (릴스가 /p/로 공유되는 경우 대응)
    output_template = os.path.join(temp_dir, f"{temp_id}.%(ext)s")

    cmd = [
        "yt-dlp",
        "-o", output_template,
        "--no-playlist",
        "--write-info-json",
        "-f", "mp4/best[ext=mp4]/best",
    ]

    if platform == Platform.YOUTUBE:
        cmd.extend(["--max-filesize", "50M"])

    cmd.append(url)

    # Instagram: 다단계 폴백 체인
    # 1) Playwright+Stealth (최우선) → 2) yt-dlp+쿠키 → 3) embed → 4) gallery-dl → 5) RapidAPI
    if platform == Platform.INSTAGRAM:
        download_success = False
        stdout_text = ""
        stderr_text = ""

        # 1단계: Playwright + Stealth (쿠키 없이 작동, 가장 안정적)
        print("[Download] Instagram 1단계: Playwright+Stealth 시도...")
        pw_result = await _download_instagram_via_playwright(url, temp_dir, temp_id)
        if pw_result:
            pw_path = pw_result["path"]
            # Playwright에서 캡션/제목을 추출했으면 yt-dlp 메타데이터 불필요
            video_info = VideoInfo(
                platform=platform,
                video_id=video_id,
                title=pw_result.get("title"),
                description=pw_result.get("caption"),
            )
            # yt-dlp 메타데이터도 시도 (추가 정보 보완)
            await _fetch_instagram_metadata(url, temp_id, temp_dir)
            ytdlp_info = _parse_video_info(temp_dir, temp_id, platform, video_id)
            if ytdlp_info.title and not video_info.title:
                video_info.title = ytdlp_info.title
            if ytdlp_info.description and not video_info.description:
                video_info.description = ytdlp_info.description
            video_info.content_type = "image" if (_is_image_file(pw_path) or os.path.isdir(pw_path)) else "video"
            if video_info.description:
                print(f"[Download] 캡션 확보: {video_info.description[:80]}...")
            return pw_path, video_info

        # 2단계: yt-dlp + cookies.txt (있으면)
        cookie_args = _get_instagram_cookie_args()
        if cookie_args:
            print("[Download] Instagram 2단계: yt-dlp + cookies.txt...")
            for f in glob.glob(os.path.join(temp_dir, f"{temp_id}*")):
                os.remove(f)
            cmd_cookies = cmd[:-1] + cookie_args + [url]
            process = await asyncio.create_subprocess_exec(
                *cmd_cookies,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            stderr_text = stderr.decode() if stderr else ""
            print(f"[Download] yt-dlp (cookies.txt) returncode: {process.returncode}")
            download_success = process.returncode == 0

        # 3단계: Instagram embed 페이지 스크래핑
        if not download_success:
            print("[Download] Instagram 3단계: embed 스크래핑...")
            for f in glob.glob(os.path.join(temp_dir, f"{temp_id}*")):
                os.remove(f)
            embed_path = await _download_instagram_embed(url, temp_dir, temp_id)
            if embed_path:
                await _fetch_instagram_metadata(url, temp_id, temp_dir)
                video_info = _parse_video_info(temp_dir, temp_id, platform, video_id)
                video_info.content_type = "image" if _is_image_file(embed_path) else "video"
                return embed_path, video_info

        # 4단계: gallery-dl 폴백
        if not download_success:
            print("[Download] Instagram: gallery-dl 폴백 시도...")
            for f in glob.glob(os.path.join(temp_dir, f"{temp_id}*")):
                os.remove(f)
            gallery_path = await _download_instagram_via_gallery_dl(url, temp_dir, temp_id)
            if gallery_path:
                await _fetch_instagram_metadata(url, temp_id, temp_dir)
                video_info = _parse_video_info(temp_dir, temp_id, platform, video_id)
                video_info.content_type = "image" if _is_image_file(gallery_path) else "video"
                return gallery_path, video_info

        # 5단계: RapidAPI 폴백
        if not download_success:
            print("[Download] Instagram: RapidAPI 폴백 시도...")
            for f in glob.glob(os.path.join(temp_dir, f"{temp_id}*")):
                os.remove(f)
            rapidapi_path = await _download_via_rapidapi(url, temp_dir, temp_id)
            if rapidapi_path:
                await _fetch_instagram_metadata(url, temp_id, temp_dir)
                video_info = _parse_video_info(temp_dir, temp_id, platform, video_id)
                if _is_image_file(rapidapi_path):
                    video_info.content_type = "image"
                else:
                    video_info.content_type = "video"
                return rapidapi_path, video_info
    else:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        stdout_text = stdout.decode() if stdout else ""
        stderr_text = stderr.decode() if stderr else ""
        print(f"[Download] yt-dlp returncode: {process.returncode}")

    if stdout_text:
        print(f"[Download] stdout: {stdout_text[:500]}")
    if stderr_text:
        print(f"[Download] stderr: {stderr_text[:500]}")

    if platform == Platform.INSTAGRAM and not download_success:
        raise Exception(
            f"Instagram 다운로드 실패 (Playwright+Stealth 포함 모든 방법 시도됨). "
            f"가능한 원인: 1) 비공개 계정 2) 삭제된 게시물 3) 지역 제한. "
            f"상세: {stderr_text[:200]}"
        )

    if process.returncode != 0:
        raise Exception(f"영상 다운로드 실패: {stderr_text}")

    # 실제 생성된 콘텐츠 파일 찾기 (info.json 제외)
    all_files = glob.glob(os.path.join(temp_dir, f"{temp_id}*"))
    content_files = [f for f in all_files if not f.endswith('.info.json')]
    print(f"[Download] 찾은 파일: {all_files}")
    if not content_files:
        raise Exception(f"콘텐츠 다운로드에 실패했습니다. yt-dlp stdout: {stdout_text[:200]}")

    # content_type 판별
    video_files = [f for f in content_files if not _is_image_file(f)]

    if video_files:
        content_path = video_files[0]
        content_type = "video"
    else:
        content_path = content_files[0]
        content_type = "video"

    video_info = _parse_video_info(temp_dir, temp_id, platform, video_id)
    video_info.content_type = content_type

    return content_path, video_info


async def _download_instagram_post(
    url: str, platform: Platform, video_id: str, temp_id: str, temp_dir: str
) -> Tuple[str, VideoInfo]:
    """Instagram 이미지 게시물(/p/)을 gallery-dl로 다운로드"""
    import shutil

    gallery_dir = os.path.join(temp_dir, f"gallery_{temp_id}")
    os.makedirs(gallery_dir, exist_ok=True)

    # gallery-dl로 이미지 다운로드
    cookie_args = ["--cookies", COOKIES_PATH] if os.path.exists(COOKIES_PATH) else ["--cookies-from-browser", "brave"]
    cmd = [
        "gallery-dl",
        *cookie_args,
        "-d", gallery_dir,
        url
    ]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    stdout_text = stdout.decode() if stdout else ""
    stderr_text = stderr.decode() if stderr else ""
    print(f"[Download] gallery-dl returncode: {process.returncode}")
    if stdout_text:
        print(f"[Download] gallery-dl stdout: {stdout_text[:500]}")
    if stderr_text:
        print(f"[Download] gallery-dl stderr: {stderr_text[:500]}")

    # 다운로드된 파일 수집 (이미지 + 동영상 모두)
    downloaded_images = []
    downloaded_videos = []
    for root, dirs, files in os.walk(gallery_dir):
        for f in sorted(files):
            full = os.path.join(root, f)
            if _is_image_file(f):
                downloaded_images.append(full)
            elif f.lower().endswith(('.mp4', '.webm', '.mkv', '.mov')):
                downloaded_videos.append(full)

    if not downloaded_images and not downloaded_videos:
        shutil.rmtree(gallery_dir, ignore_errors=True)
        raise Exception(
            f"Instagram 콘텐츠 다운로드 실패: {stderr_text[:200]}"
        )

    # 동영상이 있으면 video 모드로 전환
    if downloaded_videos:
        print(f"[Download] gallery-dl 동영상 {len(downloaded_videos)}개 다운로드")
        src = downloaded_videos[0]
        ext = os.path.splitext(src)[1]
        dest = os.path.join(temp_dir, f"{temp_id}{ext}")
        shutil.copy2(src, dest)
        shutil.rmtree(gallery_dir, ignore_errors=True)

        # 메타정보 추출
        await _fetch_instagram_metadata(url, temp_id, temp_dir)
        video_info = _parse_video_info(temp_dir, temp_id, platform, video_id)
        video_info.content_type = "video"
        return dest, video_info

    print(f"[Download] gallery-dl 이미지 {len(downloaded_images)}장 다운로드")

    # UUID 패턴으로 이름 변경 (get_downloaded_images 호환)
    image_paths = []
    for i, src in enumerate(downloaded_images):
        ext = os.path.splitext(src)[1]
        if i == 0:
            dest = os.path.join(temp_dir, f"{temp_id}{ext}")
        else:
            dest = os.path.join(temp_dir, f"{temp_id}.{i}{ext}")
        shutil.copy2(src, dest)
        image_paths.append(dest)

    shutil.rmtree(gallery_dir, ignore_errors=True)

    await _fetch_instagram_metadata(url, temp_id, temp_dir)

    video_info = _parse_video_info(temp_dir, temp_id, platform, video_id)
    video_info.content_type = "image"

    return image_paths[0], video_info


async def _fetch_instagram_metadata(
    url: str, temp_id: str, temp_dir: str
) -> None:
    """yt-dlp로 Instagram 메타정보만 추출 (다운로드 없이)"""
    meta_cmd = [
        "yt-dlp",
        *_get_instagram_cookie_args(),
        "--skip-download",
        "--write-info-json",
        "-o", os.path.join(temp_dir, f"{temp_id}.%(ext)s"),
        url
    ]
    meta_process = await asyncio.create_subprocess_exec(
        *meta_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    await meta_process.communicate()


def _parse_video_info(
    temp_dir: str, temp_id: str, platform: Platform, video_id: str
) -> VideoInfo:
    """info.json에서 메타정보 파싱"""
    info_files = glob.glob(os.path.join(temp_dir, f"{temp_id}.info.json"))

    title = None
    duration = None
    description = None

    if info_files:
        try:
            with open(info_files[0], 'r', encoding='utf-8') as f:
                info = json.load(f)
            title = info.get("title")
            duration = info.get("duration")
            description = info.get("description", "")
        except Exception:
            pass

    return VideoInfo(
        platform=platform,
        video_id=video_id,
        title=title,
        duration=duration,
        description=description
    )


async def extract_audio_from_video(video_path: str) -> str:
    """다운로드된 비디오에서 오디오 추출 (ffmpeg)"""
    audio_path = os.path.splitext(video_path)[0] + "_audio.mp3"

    # 파일 존재/크기 확인
    if not os.path.exists(video_path):
        raise Exception(f"비디오 파일이 없습니다: {video_path}")

    file_size = os.path.getsize(video_path)
    print(f"[Audio] 입력 파일: {video_path} ({file_size / 1024:.1f}KB)")

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "libmp3lame",
        "-q:a", "2",
        audio_path
    ]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stdout, stderr = await process.communicate()
    stderr_text = stderr.decode() if stderr else ""

    if not os.path.exists(audio_path):
        # 오디오 트랙이 없는 영상일 수 있음 (무음 릴스)
        # 빈 오디오 파일 생성으로 폴백
        # 마지막 10줄만 출력 (버전 정보 스킵)
        err_lines = stderr_text.strip().split('\n')
        err_tail = '\n'.join(err_lines[-10:])
        print(f"[Audio] ffmpeg 실패 (returncode={process.returncode}): {err_tail[:500]}")
        print("[Audio] 오디오 트랙 없음 → 빈 오디오 생성")
        silence_cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
            "-t", "1",
            "-acodec", "libmp3lame",
            "-q:a", "9",
            audio_path
        ]
        process2 = await asyncio.create_subprocess_exec(
            *silence_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process2.communicate()

        if not os.path.exists(audio_path):
            raise Exception(f"오디오 추출 실패. ffmpeg: {stderr_text[:200]}")

    return audio_path


async def _get_video_duration(video_path: str) -> float:
    """ffprobe로 영상 길이(초) 반환"""
    probe_cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path
    ]

    process = await asyncio.create_subprocess_exec(
        *probe_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stdout, _ = await process.communicate()
    try:
        return float(stdout.decode().strip())
    except (ValueError, AttributeError):
        return 30.0


async def extract_frames(video_path: str, max_frames: int = 6) -> List[str]:
    """
    비디오에서 구간별 대표 프레임 추출 (thumbnail 필터)

    영상을 max_frames 구간으로 나누고, 각 구간에서 ffmpeg thumbnail 필터가
    히스토그램 분석으로 가장 대표적인 프레임을 자동 선택.
    → 비슷한 장면 중복 최소화, 다양한 시각 콘텐츠 확보
    """
    base = os.path.splitext(video_path)[0]
    frame_dir = base + "_frames"
    os.makedirs(frame_dir, exist_ok=True)

    duration = await _get_video_duration(video_path)
    segment_duration = duration / max_frames

    frame_paths = []
    for i in range(max_frames):
        start = segment_duration * i
        if start >= duration:
            break

        frame_path = os.path.join(frame_dir, f"frame_{i:02d}.jpg")

        # thumbnail 필터: 해당 구간에서 히스토그램 기반 대표 프레임 자동 선택
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-t", str(segment_duration),
            "-i", video_path,
            "-vf", "thumbnail",
            "-frames:v", "1",
            "-pix_fmt", "yuvj420p",
            "-q:v", "3",
            frame_path
        ]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()

        if os.path.exists(frame_path):
            frame_paths.append(frame_path)

    print(f"[Frames] 구간별 대표 프레임 추출: {len(frame_paths)}장 (영상 {duration:.1f}초)")
    return frame_paths


async def extract_dense_frames(video_path: str, interval: float = 1.0) -> List[str]:
    """영상 전체에서 interval초 간격으로 프레임 추출 (갤러리용)"""
    base = os.path.splitext(video_path)[0]
    frame_dir = base + "_dense_frames"
    os.makedirs(frame_dir, exist_ok=True)

    duration = await _get_video_duration(video_path)
    output_pattern = os.path.join(frame_dir, "dense_%03d.jpg")

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", f"fps=1/{interval}",
        "-pix_fmt", "yuvj420p",
        "-q:v", "4",
        output_pattern
    ]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    await process.communicate()

    # ffmpeg fps 필터는 1-indexed: dense_001.jpg, dense_002.jpg, ...
    frame_paths = sorted(glob.glob(os.path.join(frame_dir, "dense_*.jpg")))
    print(f"[DenseFrames] {len(frame_paths)}장 추출 (영상 {duration:.1f}초, {interval}초 간격)")
    return frame_paths


def persist_frames(frame_paths: List[str], job_id: str, prefix: str = "frame") -> List[str]:
    """프레임 이미지를 영구 디렉토리로 복사하여 서빙 가능하게 함"""
    import shutil

    frames_dir = os.path.join(os.path.abspath(settings.TEMP_DIR), "frames", job_id)
    os.makedirs(frames_dir, exist_ok=True)

    saved_urls = []
    for i, frame_path in enumerate(frame_paths):
        if not os.path.exists(frame_path):
            continue
        filename = f"{prefix}_{i:02d}.jpg"
        dest = os.path.join(frames_dir, filename)
        shutil.copy2(frame_path, dest)
        saved_urls.append(f"/api/frames/{job_id}/{filename}")

    return saved_urls


def get_downloaded_images(primary_path: str) -> List[str]:
    """같은 UUID 기반 이미지 파일 전부 수집 (캐러셀 지원)

    - 폴더 경로: 폴더 내 모든 이미지 파일 반환
    - 파일 경로: yt-dlp 패턴 {uuid}.jpg, {uuid}.1.jpg, {uuid}.2.jpg ...
    """
    # Playwright 캐러셀: 폴더 경로가 올 수 있음
    if os.path.isdir(primary_path):
        all_files = glob.glob(os.path.join(primary_path, "*"))
        return sorted([f for f in all_files if _is_image_file(f)])

    base_dir = os.path.dirname(primary_path)
    base_name = os.path.splitext(os.path.basename(primary_path))[0]
    # 캐러셀 넘버링 제거하여 원본 UUID 추출 (e.g., "abc123.1" → "abc123")
    base_uuid = re.sub(r'\.\d+$', '', base_name)
    all_files = glob.glob(os.path.join(base_dir, f"{base_uuid}*"))
    return sorted([f for f in all_files if _is_image_file(f)])


async def convert_images_to_jpg(image_paths: List[str]) -> List[str]:
    """webp 등 이미지를 jpg로 변환 (serve_frame이 .jpg만 허용)"""
    result = []
    for path in image_paths:
        if path.lower().endswith('.jpg') or path.lower().endswith('.jpeg'):
            result.append(path)
            continue

        jpg_path = os.path.splitext(path)[0] + ".jpg"
        cmd = [
            "ffmpeg", "-y",
            "-i", path,
            "-q:v", "2",
            jpg_path
        ]
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()

        if os.path.exists(jpg_path):
            result.append(jpg_path)
        else:
            # 변환 실패 시 원본 사용 (Vision API가 webp 지원)
            result.append(path)

    return result


def cleanup_temp_files(video_path: str):
    """비디오, 오디오, 프레임 등 모든 임시 파일 정리"""
    try:
        base = os.path.splitext(video_path)[0]

        # 비디오 파일
        if os.path.exists(video_path):
            os.remove(video_path)

        # 같은 UUID 기반 파일들 (info.json, audio 등)
        for leftover in glob.glob(f"{base}*"):
            if os.path.isfile(leftover):
                try:
                    os.remove(leftover)
                except Exception:
                    pass

        # 프레임 디렉토리
        frame_dir = base + "_frames"
        if os.path.isdir(frame_dir):
            import shutil
            shutil.rmtree(frame_dir, ignore_errors=True)

    except Exception as e:
        print(f"임시 파일 삭제 실패: {e}")
