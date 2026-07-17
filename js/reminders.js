window.Reminders = (() => {
  const listEl = () => document.getElementById("reminders-list");

  function fmt(iso) {
    // reuse diary's Jalali formatter if available
    return window.formatJalali ? window.formatJalali(iso) : iso;
  }

  function render(items) {
    if (!items.length) {
      listEl().innerHTML = `<div class="empty-state">هنوز یادآوری‌ای ثبت نشده ⏰</div>`;
      return;
    }
    listEl().innerHTML = items
      .map((r) => {
        const who = r.target?.first_name || "—";
        const done = r.sent;
        return `
        <div class="entry-card ${done ? "is-done" : ""}">
          <div class="entry-card-body">
            <p class="entry-note">${escapeHtml(r.note)}</p>
            <div class="entry-meta">
              <span>📅 ${fmt(r.remind_date)}</span>
              <span>👤 برای ${escapeHtml(who)}</span>
              ${done ? `<span class="badge-sent">ارسال شد ✓</span>` : ""}
            </div>
          </div>
          <button class="entry-del" data-id="${r.id}" aria-label="حذف">🗑️</button>
        </div>`;
      })
      .join("");
  }

  async function load() {
    try {
      const data = await window.API.getReminders();
      render(data.reminders || []);
    } catch (err) {
      console.error("reminders load failed:", err);
    }
  }

  function init() {
    const form = document.getElementById("reminder-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.disabled = true;
      const fd = new FormData(form);
      try {
        await window.API.addReminder(fd.get("note"), fd.get("remind_date"), fd.get("target"));
        form.reset();
        await load();
      } catch (err) {
        console.error("add reminder failed:", err);
        alert("ثبت یادآوری ناموفق بود.");
      } finally {
        btn.disabled = false;
      }
    });

    listEl().addEventListener("click", async (e) => {
      const del = e.target.closest(".entry-del");
      if (!del) return;
      if (!confirm("این یادآوری حذف بشه؟")) return;
      try {
        await window.API.deleteReminder(del.dataset.id);
        await load();
      } catch (err) {
        console.error("delete reminder failed:", err);
      }
    });

    load();
  }

  return { init, load };
})();

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
