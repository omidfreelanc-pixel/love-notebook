// Thin wrapper around fetch() calls to our Edge Functions.
// Holds the session token (from /auth) in memory only — never in
// localStorage, since Telegram WebView storage isn't guaranteed to
// persist and the token is short-lived anyway.

window.API = (() => {
  let sessionToken = null;
  let coupleId = null;
  let userId = null;
  let userName = null;

  function base() {
    return window.CONFIG.FUNCTIONS_BASE_URL.replace(/\/$/, "");
  }

  async function authenticate(initData) {
    const res = await fetch(`${base()}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `AUTH_FAILED_${res.status}`);
    }
    const data = await res.json();
    sessionToken = data.session_token;
    coupleId = data.couple_id;
    userId = data.user?.id ?? null;
    userName = data.user?.first_name ?? null;
    return data;
  }

  async function authedFetch(path, options = {}) {
    if (!sessionToken) throw new Error("NOT_AUTHENTICATED");
    const headers = {
      Authorization: `Bearer ${sessionToken}`,
      ...(options.headers || {}),
    };
    const res = await fetch(`${base()}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.error || `REQUEST_FAILED_${res.status}`);
      err.userMessage = body.message || null;
      throw err;
    }
    return res.json();
  }

  return {
    authenticate,
    isPaired: () => !!coupleId,
    myId: () => userId,
    myName: () => userName,

    getDiary: (date) =>
      authedFetch(`/diary${date ? `?date=${date}` : ""}`),
    listDiaryDates: () => authedFetch(`/diary?list=1`),
    saveDiary: (date, content) =>
      authedFetch(`/diary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, content }),
      }),

    getAlbum: () => authedFetch(`/upload-photo`),
    uploadPhoto: async (file) => {
      const form = new FormData();
      form.append("photo", file);
      // Note: no Content-Type header — browser sets the multipart
      // boundary automatically.
      return authedFetch(`/upload-photo`, { method: "POST", body: form });
    },

    suggestDate: (payload) =>
      authedFetch(`/suggest-date`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    suggestGift: (payload) =>
      authedFetch(`/suggest-gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    // ---- reminders ----
    getReminders: () => authedFetch(`/reminders`),
    addReminder: (note, remind_date, target) =>
      authedFetch(`/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, remind_date, target }),
      }),
    deleteReminder: (id) =>
      authedFetch(`/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" }),

    // ---- promises ----
    getPromises: () => authedFetch(`/promises`),
    addPromise: (note, promise_date, direction) =>
      authedFetch(`/promises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, promise_date, direction }),
      }),
    togglePromise: (id, fulfilled) =>
      authedFetch(`/promises`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, fulfilled }),
      }),
    deletePromise: (id) =>
      authedFetch(`/promises?id=${encodeURIComponent(id)}`, { method: "DELETE" }),

    // ---- playlist ----
    getTracks: () => authedFetch(`/tracks`),
    deleteTrack: (id) =>
      authedFetch(`/tracks?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  };
})();
