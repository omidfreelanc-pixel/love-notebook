window.Playlist = (() => {
  const listEl = () => document.getElementById("playlist-list");
  let currentAudio = null;
  let currentBtn = null;

  function fmtDuration(sec) {
    if (!sec || sec < 0) return "";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (currentBtn) {
      currentBtn.textContent = "▶️";
      currentBtn = null;
    }
  }

  function render(items) {
    stopCurrent();
    if (!items.length) {
      listEl().innerHTML = `<div class="empty-state">هنوز آهنگی نفرستادید 🎵</div>`;
      return;
    }
    listEl().innerHTML = items
      .map((t) => {
        const title = t.title || "آهنگ بی‌نام";
        const performer = t.performer ? ` — ${t.performer}` : "";
        const dur = fmtDuration(t.duration);
        return `
        <div class="track-card">
          <button class="track-play" data-url="${encodeURIComponent(t.url || "")}" aria-label="پخش">▶️</button>
          <div class="track-info">
            <p class="track-title">${escapeHtml(title)}<span class="track-performer">${escapeHtml(performer)}</span></p>
            ${dur ? `<span class="track-dur">${dur}</span>` : ""}
          </div>
          <button class="entry-del" data-id="${t.id}" aria-label="حذف">🗑️</button>
        </div>`;
      })
      .join("");
  }

  async function load() {
    try {
      const data = await window.API.getTracks();
      render(data.tracks || []);
    } catch (err) {
      console.error("tracks load failed:", err);
    }
  }

  function togglePlay(btn) {
    const url = decodeURIComponent(btn.dataset.url || "");
    if (!url) return;
    // Clicking the already-playing track pauses it.
    if (currentBtn === btn && currentAudio && !currentAudio.paused) {
      stopCurrent();
      return;
    }
    stopCurrent();
    const audio = new Audio(url);
    audio.play().catch((err) => console.error("play failed:", err));
    audio.addEventListener("ended", stopCurrent);
    currentAudio = audio;
    currentBtn = btn;
    btn.textContent = "⏸️";
  }

  function init() {
    listEl().addEventListener("click", async (e) => {
      const play = e.target.closest(".track-play");
      const del = e.target.closest(".entry-del");
      if (play) {
        togglePlay(play);
      } else if (del) {
        if (!confirm("این آهنگ حذف بشه؟")) return;
        try {
          stopCurrent();
          await window.API.deleteTrack(del.dataset.id);
          await load();
        } catch (err) {
          console.error("delete track failed:", err);
        }
      }
    });
    load();
  }

  return { init, load, stopCurrent };
})();
