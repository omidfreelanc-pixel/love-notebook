window.Album = (() => {
  const grid = () => document.getElementById("album-grid");

  function renderPhotos(photos) {
    grid().innerHTML = photos
      .map(
        (p) => `
        <div class="photo-frame">
          <img src="${p.url}" alt="عکس" loading="lazy" />
        </div>`,
      )
      .join("");
  }

  async function load() {
    try {
      const data = await window.API.getAlbum();
      renderPhotos(data.photos || []);
    } catch (err) {
      console.error("album load failed:", err);
    }
  }

  async function handleUpload(file) {
    if (!file) return;
    const tg = window.Telegram?.WebApp;
    tg?.MainButton?.showProgress?.(false);
    try {
      await window.API.uploadPhoto(file);
      await load();
    } catch (err) {
      console.error("upload failed:", err);
      alert("آپلود عکس ناموفق بود، دوباره امتحان کن.");
    }
  }

  function init() {
    document.getElementById("photo-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      handleUpload(file);
      e.target.value = "";
    });
    load();
  }

  return { init, load };
})();
