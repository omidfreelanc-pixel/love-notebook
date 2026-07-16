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

function formatJalaliToday() {
  const now = new Date();
  const [jy, jm, jd] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}`;
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

window.Diary = (() => {
  let saveTimer = null;
  const textarea = () => document.getElementById("diary-textarea");
  const indicator = () => document.getElementById("save-indicator");

  function flashSaved() {
    const el = indicator();
    el.textContent = "ذخیره شد ✓";
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1500);
  }

  async function save() {
    try {
      await window.API.saveDiary(todayISODate(), textarea().value);
      flashSaved();
    } catch (err) {
      console.error("diary save failed:", err);
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 3000); // 3s after typing stops
  }

  async function init() {
    document.getElementById("daily-poem").textContent = getDailyPoem();
    document.getElementById("jalali-date").textContent = formatJalaliToday();

    try {
      const data = await window.API.getDiary(todayISODate());
      textarea().value = data.content || "";
    } catch (err) {
      console.error("diary load failed:", err);
    }

    textarea().addEventListener("input", scheduleSave);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") save();
    });
    window.addEventListener("beforeunload", () => {
      // Best-effort synchronous-ish save on exit.
      navigator.sendBeacon &&
        navigator.sendBeacon; // sendBeacon can't set Authorization header,
      // so we just fire the normal save; most exits go through
      // visibilitychange first anyway inside Telegram's WebView.
      save();
    });
  }

  return { init };
})();
