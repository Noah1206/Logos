(function () {
  const LOGOS_URL = "https://logos.builders";
  let currentBtn = null;

  function injectButton() {
    // 이미 버튼이 있으면 스킵
    if (document.getElementById("logos-convert-btn")) return;

    const btn = document.createElement("button");
    btn.id = "logos-convert-btn";
    btn.innerHTML =
      '<img src="https://logos.builders/images/brain-icon.png" alt="LOGOS.ai" />' +
      "블로그로 변환";

    btn.addEventListener("click", function () {
      const url = encodeURIComponent(window.location.href);
      window.open(LOGOS_URL + "/?url=" + url, "_blank");
    });

    document.body.appendChild(btn);
    currentBtn = btn;
  }

  function removeButton() {
    const btn = document.getElementById("logos-convert-btn");
    if (btn) {
      btn.remove();
      currentBtn = null;
    }
  }

  function checkAndInject() {
    if (window.location.pathname.startsWith("/shorts/")) {
      injectButton();
    } else {
      removeButton();
    }
  }

  // 초기 실행
  checkAndInject();

  // YouTube SPA 내비게이션 감지 (MutationObserver)
  const observer = new MutationObserver(function () {
    checkAndInject();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // popstate 이벤트로도 감지 (뒤로/앞으로 가기)
  window.addEventListener("popstate", checkAndInject);

  // YouTube의 yt-navigate-finish 이벤트
  window.addEventListener("yt-navigate-finish", checkAndInject);
})();
