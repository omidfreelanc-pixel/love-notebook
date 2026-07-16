(function main() {
  const tg = window.Telegram?.WebApp;

  function showError(detail) {
    document.getElementById("loading-screen").classList.add("hidden");
    document.getElementById("error-screen").classList.remove("hidden");
    document.getElementById("error-detail").textContent = detail || "";
  }

  function initTabs() {
    const buttons = document.querySelectorAll(".nav-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");

        // Lazy-load album on first visit to that tab
        if (btn.dataset.tab === "tab-album") window.Album.load();
      });
    });
  }

  async function boot() {
    try {
      tg?.ready?.();
      tg?.expand?.();

      if (!tg?.initData) {
        showError("این اپ فقط داخل تلگرام کار می‌کنه.");
        return;
      }

      await window.API.authenticate(tg.initData);

      if (!window.API.isPaired()) {
        showError("هنوز به همسرت وصل نشدی. برگرد به چت ربات و کد دعوت رو رد و بدل کنید.");
        return;
      }

      initTabs();
      await window.Diary.init();
      window.DateSuggest.init();
      window.Gift.init();
      window.Album.init(); // pre-warm album for first tab switch

      document.getElementById("loading-screen").classList.add("hidden");
      document.getElementById("app").classList.remove("hidden");

      tg?.setHeaderColor?.("#ffd6e8");
      tg?.setBackgroundColor?.("#ffe3ee");
    } catch (err) {
      console.error("boot failed:", err);
      showError(String(err.message || err));
    }
  }

  boot();
})();
