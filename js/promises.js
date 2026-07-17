window.Promises = (() => {
  const listEl = () => document.getElementById("promises-list");

  function fmt(iso) {
    return window.formatJalali ? window.formatJalali(iso) : iso;
  }

  function render(items) {
    if (!items.length) {
      listEl().innerHTML = `<div class="empty-state">هنوز قولی ثبت نشده 🤝</div>`;
      return;
    }
    const meId = window.API.myId();
    listEl().innerHTML = items
      .map((p) => {
        const from = p.from_user?.first_name || "یه نفر";
        const to = p.to_user?.first_name || "یه نفر";
        const mineToGive = p.from_user_id === meId;
        return `
        <div class="entry-card promise-card ${p.fulfilled ? "is-done" : ""}">
          <div class="entry-card-body">
            <p class="entry-note">${escapeHtml(p.note)}</p>
            <div class="entry-meta">
              <span class="promise-dir">${escapeHtml(from)} ➜ ${escapeHtml(to)}</span>
              <span>📅 ${fmt(p.promise_date)}</span>
              ${p.fulfilled ? `<span class="badge-sent">انجام شد ✓</span>` : ""}
            </div>
          </div>
          <div class="entry-actions">
            <button class="entry-check" data-id="${p.id}" data-done="${p.fulfilled ? 1 : 0}" aria-label="تغییر وضعیت">${p.fulfilled ? "↩️" : "✅"}</button>
            <button class="entry-del" data-id="${p.id}" aria-label="حذف">🗑️</button>
          </div>
        </div>`;
      })
      .join("");
  }

  async function load() {
    try {
      const data = await window.API.getPromises();
      render(data.promises || []);
    } catch (err) {
      console.error("promises load failed:", err);
    }
  }

  function init() {
    const form = document.getElementById("promise-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.disabled = true;
      const fd = new FormData(form);
      try {
        await window.API.addPromise(fd.get("note"), fd.get("promise_date"), fd.get("direction"));
        form.reset();
        await load();
      } catch (err) {
        console.error("add promise failed:", err);
        alert("ثبت قول ناموفق بود.");
      } finally {
        btn.disabled = false;
      }
    });

    listEl().addEventListener("click", async (e) => {
      const check = e.target.closest(".entry-check");
      const del = e.target.closest(".entry-del");
      try {
        if (check) {
          await window.API.togglePromise(check.dataset.id, check.dataset.done !== "1");
          await load();
        } else if (del) {
          if (!confirm("این قول حذف بشه؟")) return;
          await window.API.deletePromise(del.dataset.id);
          await load();
        }
      } catch (err) {
        console.error("promise action failed:", err);
      }
    });

    load();
  }

  return { init, load };
})();
