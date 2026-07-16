// Thin wrapper around fetch() calls to our Edge Functions.
// Holds the session token (from /auth) in memory only — never in
// localStorage, since Telegram WebView storage isn't guaranteed to
// persist and the token is short-lived anyway.

window.API = (() => {
  let sessionToken = null;
  let coupleId = null;

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
      throw new Error(body.error || `REQUEST_FAILED_${res.status}`);
    }
    return res.json();
  }

  return {
    authenticate,
    isPaired: () => !!coupleId,

    getDiary: (date) =>
      authedFetch(`/diary${date ? `?date=${date}` : ""}`),
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
  };
})();
