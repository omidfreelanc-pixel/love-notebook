window.DateSuggest = (() => {
  function init() {
    const form = document.getElementById("date-form");
    const resultBox = document.getElementById("date-result");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("button");
      submitBtn.disabled = true;
      submitBtn.textContent = "در حال فکر کردن... 🤔";

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const data = await window.API.suggestDate(payload);
        resultBox.textContent = data.suggestion;
        resultBox.classList.remove("hidden");
      } catch (err) {
        console.error("suggest-date failed:", err);
        resultBox.textContent = "متأسفانه نشد پیشنهاد بدم، دوباره امتحان کن.";
        resultBox.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "پیشنهاد بده ✨";
      }
    });
  }

  return { init };
})();
