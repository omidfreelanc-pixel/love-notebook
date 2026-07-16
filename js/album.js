window.Album = (() => {
  const PER_PAGE = 4; // photos per album spread
  let photos = [];
  let page = 0;

  const spread = () => document.getElementById("album-spread");
  const pageInfo = () => document.getElementById("album-pageinfo");

  function totalPages() {
    return Math.max(1, Math.ceil(photos.length / PER_PAGE));
  }

  function render(dir) {
    const el = spread();

    if (photos.length === 0) {
      el.innerHTML = `<div class="album-empty">هنوز عکسی اضافه نکردید 🐾<br/>اولین خاطره‌تون رو بذارید!</div>`;
      pageInfo().textContent = "";
      document.getElementById("album-prev").disabled = true;
      document.getElementById("album-next").disabled = true;
      return;
    }

    const start = page * PER_PAGE;
    const slice = photos.slice(start, start + PER_PAGE);
    el.innerHTML = slice
      .map(
        (p) => `
        <div class="album-photo">
          <img src="${p.url}" alt="عکس" loading="lazy" />
        </div>`,
      )
      .join("");

    // Flip animation, RTL-aware.
    el.classList.remove("flip-next", "flip-prev");
    void el.offsetWidth;
    if (dir === "next") el.classList.add("flip-next");
    else if (dir === "prev") el.classList.add("flip-prev");

    pageInfo().textContent = `صفحه ${page + 1} از ${totalPages()}`;
    document.getElementById("album-prev").disabled = page <= 0;
    document.getElementById("album-next").disabled = page >= totalPages() - 1;
  }

  async function load() {
    try {
      const data = await window.API.getAlbum();
      photos = data.photos || [];
      if (page > totalPages() - 1) page = totalPages() - 1;
      render();
    } catch (err) {
      console.error("album load failed:", err);
    }
  }

  async function handleUpload(file) {
    if (!file) return;
    try {
      await window.API.uploadPhoto(file);
      await load();
      // Jump to the last page so the freshly added photo is visible.
      page = totalPages() - 1;
      render();
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
    document.getElementById("album-prev").addEventListener("click", () => {
      if (page > 0) { page--; render("prev"); }
    });
    document.getElementById("album-next").addEventListener("click", () => {
      if (page < totalPages() - 1) { page++; render("next"); }
    });
    load();
  }

  return { init, load };
})();
