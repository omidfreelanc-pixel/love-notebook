// Small self-contained Gregorian -> Jalali (Shamsi) date converter
// (no external library / network dependency needed).
function toJalali(gy, gm, gd) {
  const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

const JALALI_MONTHS = [
  "فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور",
  "مهر","آبان","آذر","دی","بهمن","اسفند",
];

function formatJalali(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const [jy, jm, jd] = toJalali(y, m, d);
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}`;
}
// Shared with reminders/promises modules.
window.formatJalali = formatJalali;

function formatJalaliToday() {
  return formatJalali(todayISODate());
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso, delta) {
  const dt = new Date(iso + "T00:00:00");
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().slice(0, 10);
}

window.Diary = (() => {
  let saveTimer = null;
  let currentDate = todayISODate();
  // The date the textarea's current text actually belongs to. Kept
  // separate from currentDate so that when we switch days we save the
  // OUTGOING day's text to the OUTGOING date, never the new one.
  let loadedDate = todayISODate();
  const textarea = () => document.getElementById("diary-textarea");
  const indicator = () => document.getElementById("save-indicator");
  const flip = () => document.getElementById("diary-flip");

  function flashSaved() {
    const el = indicator();
    el.textContent = "ذخیره شد ✓";
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1500);
  }

  // Saves the text currently in the textarea to the date it belongs to.
  async function save() {
    const dateForThisText = loadedDate;
    try {
      await window.API.saveDiary(dateForThisText, textarea().value);
      flashSaved();
    } catch (err) {
      console.error("diary save failed:", err);
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 3000); // 3s after typing stops
  }

  function updateDateUI() {
    document.getElementById("jalali-date").textContent = formatJalali(currentDate);
    document.getElementById("diary-date-input").value = currentDate;
    // Disable "next" once we're on today (no future entries).
    document.getElementById("diary-next").disabled = currentDate >= todayISODate();
  }

  async function loadDate(dir) {
    // Flush any pending edits on the OUTGOING page first (save() reads
    // loadedDate, which still points at the old day here).
    clearTimeout(saveTimer);
    await save();

    updateDateUI();

    // Page-flip animation (RTL-aware): next -> flip from right, prev -> from left.
    const el = flip();
    el.classList.remove("flip-next", "flip-prev");
    void el.offsetWidth; // restart animation
    if (dir === "next") el.classList.add("flip-next");
    else if (dir === "prev") el.classList.add("flip-prev");

    try {
      const data = await window.API.getDiary(currentDate);
      textarea().value = data.content || "";
    } catch (err) {
      console.error("diary load failed:", err);
      textarea().value = "";
    }
    // Only now does the text on screen belong to the new date.
    loadedDate = currentDate;
  }

  function goPrev() {
    currentDate = addDaysISO(currentDate, -1);
    loadDate("prev");
  }

  function goNext() {
    if (currentDate >= todayISODate()) return;
    currentDate = addDaysISO(currentDate, 1);
    loadDate("next");
  }

  async function init() {
    document.getElementById("daily-poem").textContent = getDailyPoem();
    updateDateUI();

    try {
      const data = await window.API.getDiary(currentDate);
      textarea().value = data.content || "";
    } catch (err) {
      console.error("diary load failed:", err);
    }

    textarea().addEventListener("input", scheduleSave);
    document.getElementById("diary-prev").addEventListener("click", goPrev);
    document.getElementById("diary-next").addEventListener("click", goNext);

    const dateInput = document.getElementById("diary-date-input");
    document.getElementById("diary-cal-btn").addEventListener("click", () => {
      if (typeof dateInput.showPicker === "function") dateInput.showPicker();
      else dateInput.click();
    });
    dateInput.max = todayISODate();
    dateInput.addEventListener("change", () => {
      if (!dateInput.value) return;
      const dir = dateInput.value > currentDate ? "next" : "prev";
      currentDate = dateInput.value;
      loadDate(dir);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") save();
    });
    window.addEventListener("beforeunload", () => {
      save();
    });
  }

  return { init };
})();
