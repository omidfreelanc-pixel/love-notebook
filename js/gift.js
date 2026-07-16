window.Gift = (() => {
  function renderGifts(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return "<p>پیشنهادی پیدا نشد، دوباره امتحان کن.</p>";
    }
    return items
      .map(
        (g) => `
        <div class="gift-card">
          <h4>${g.title ?? "پیشنهاد"}</h4>
          <p>${g.description ?? ""}</p>
          ${g.estimated_price ? `<p class="price">💰 ${g.estimated_price}</p>` : ""}
        </div>`,
      )
      .join("");
  }

  function init() {
    const form = document.getElementById("gift-form");
    const resultBox = document.getElementById("gift-result");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("button");
      submitBtn.disabled = true;
      submitBtn.textContent = "در حال فکر کردن... 🎀";

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const data = await window.API.suggestGift(payload);
        resultBox.innerHTML = renderGifts(data.suggestions);
        resultBox.classList.remove("hidden");
      } catch (err) {
        console.error("suggest-gift failed:", err);
        resultBox.textContent = err.userMessage || "متأسفانه نشد پیشنهاد بدم، دوباره امتحان کن.";
        resultBox.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "پیشنهاد بده 🎁";
      }
    });
  }

  return { init };
})();
