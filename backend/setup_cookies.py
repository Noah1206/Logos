#!/usr/bin/env python3
"""
Instagram 쿠키 설정 도우미

브라우저에서 Instagram 쿠키를 추출하여 cookies.txt로 저장합니다.
yt-dlp가 Instagram 콘텐츠를 다운로드할 때 이 쿠키를 사용합니다.

사용법:
  python setup_cookies.py           # 자동으로 브라우저 감지
  python setup_cookies.py chrome    # Chrome 브라우저 지정
  python setup_cookies.py safari    # Safari 브라우저 지정
"""

import subprocess
import sys
import os

COOKIES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cookies.txt")
BROWSERS = ["chrome", "brave", "firefox", "safari", "edge"]
TEST_URL = "https://www.instagram.com/reel/C1234567890/"  # 테스트용 (실제 다운로드 안 함)


def extract_cookies(browser: str) -> bool:
    """yt-dlp를 이용해 브라우저 쿠키를 cookies.txt로 추출"""
    print(f"  {browser}에서 Instagram 쿠키 추출 중...")

    cmd = [
        "yt-dlp",
        "--cookies-from-browser", browser,
        "--cookies", COOKIES_PATH,
        "--skip-download",
        "--no-warnings",
        "https://www.instagram.com/",
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=15,
        )

        if os.path.exists(COOKIES_PATH) and os.path.getsize(COOKIES_PATH) > 100:
            # 쿠키 파일에 instagram.com 쿠키가 있는지 확인
            with open(COOKIES_PATH, "r") as f:
                content = f.read()
            if "instagram.com" in content:
                return True
            else:
                print(f"    {browser}에 Instagram 로그인 정보 없음")
                os.remove(COOKIES_PATH)
                return False
        return False

    except subprocess.TimeoutExpired:
        print(f"    {browser} 타임아웃")
        return False
    except FileNotFoundError:
        print("    yt-dlp가 설치되어 있지 않습니다. pip install yt-dlp")
        return False
    except Exception as e:
        print(f"    {browser} 오류: {e}")
        return False


def verify_cookies() -> bool:
    """쿠키가 유효한지 간단히 검증"""
    if not os.path.exists(COOKIES_PATH):
        return False

    with open(COOKIES_PATH, "r") as f:
        content = f.read()

    has_sessionid = "sessionid" in content
    has_csrftoken = "csrftoken" in content

    if has_sessionid and has_csrftoken:
        print("\n  sessionid: OK")
        print("  csrftoken: OK")
        return True
    elif has_sessionid:
        print("\n  sessionid: OK")
        print("  csrftoken: 없음 (일부 기능 제한 가능)")
        return True
    else:
        print("\n  sessionid: 없음 (로그인 필요)")
        return False


def main():
    print("=" * 50)
    print(" Instagram 쿠키 설정 도우미")
    print("=" * 50)

    # 기존 쿠키 확인
    if os.path.exists(COOKIES_PATH):
        print(f"\n기존 cookies.txt 발견: {COOKIES_PATH}")
        if verify_cookies():
            print("\n기존 쿠키가 유효합니다!")
            choice = input("덮어쓸까요? (y/N): ").strip().lower()
            if choice != "y":
                print("기존 쿠키를 유지합니다.")
                return
        else:
            print("기존 쿠키가 유효하지 않습니다. 새로 추출합니다.")

    # 브라우저 지정 또는 자동 감지
    target_browser = sys.argv[1] if len(sys.argv) > 1 else None

    if target_browser:
        if target_browser not in BROWSERS:
            print(f"\n지원 브라우저: {', '.join(BROWSERS)}")
            sys.exit(1)
        browsers_to_try = [target_browser]
    else:
        browsers_to_try = BROWSERS

    print("\n[1/2] 브라우저에서 쿠키 추출")
    print("    (Instagram에 로그인된 브라우저가 필요합니다)\n")

    success = False
    for browser in browsers_to_try:
        if extract_cookies(browser):
            print(f"\n    {browser}에서 쿠키 추출 성공!")
            success = True
            break

    if not success:
        print("\n" + "=" * 50)
        print(" 자동 추출 실패!")
        print("=" * 50)
        print()
        print("수동으로 쿠키를 설정하려면:")
        print()
        print("1. Chrome에서 Instagram에 로그인")
        print('2. "Get cookies.txt LOCALLY" 확장 프로그램 설치')
        print("   https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc")
        print("3. instagram.com에서 확장 프로그램 클릭 → Export")
        print(f"4. 내보낸 파일을 {COOKIES_PATH}에 저장")
        print()
        print("또는 Firefox Container를 사용:")
        print("1. Firefox에서 Instagram에 로그인")
        print(f"2. python setup_cookies.py firefox")
        sys.exit(1)

    print("\n[2/2] 쿠키 검증")
    if verify_cookies():
        print(f"\n{'=' * 50}")
        print(f" 설정 완료!")
        print(f" 쿠키 파일: {COOKIES_PATH}")
        print(f"{'=' * 50}")
        print("\n이제 Instagram 릴스/포스트 변환이 가능합니다.")
    else:
        print("\n쿠키 파일이 생성되었지만 Instagram 로그인 정보가 없습니다.")
        print("브라우저에서 Instagram에 로그인한 후 다시 시도하세요.")
        if os.path.exists(COOKIES_PATH):
            os.remove(COOKIES_PATH)
        sys.exit(1)


if __name__ == "__main__":
    main()
