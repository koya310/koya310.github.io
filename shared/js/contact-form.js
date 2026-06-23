(() => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = document.querySelector("[data-contact-status]");
  const startedAt = form.querySelector("[data-contact-started-at]");
  const submit = form.querySelector("button[type='submit']");
  const fallbackEmail = "desk@kameya-japan-tradition.com";
  const mailTo = (form.dataset.mailTo || fallbackEmail).trim();
  const endpoint = (form.dataset.gasEndpoint || form.getAttribute("action") || "").trim();
  const missingEndpoint = !endpoint || endpoint === "GAS_WEB_APP_URL_TODO";
  const minMessageLength = 10;
  const copy = {
    subject: "亀屋日本伝統株式会社 Webサイトからのお問い合わせ",
    greeting: "亀屋日本伝統株式会社 御中",
    intro: "以下の内容で問い合わせます。",
    name: "名前",
    company: "会社名・所属",
    email: "メールアドレス",
    phone: "電話番号",
    message: "お問い合わせ内容",
    invalid: "必須項目をご確認ください。",
    shortMessage: "お問い合わせ内容は10文字以上で入力してください。",
    mailOpening: "メール作成画面を開きます。内容をご確認のうえ送信してください。",
    success: "お問い合わせありがとうございました。内容を受け付けました。",
    error: "送信できませんでした。時間を置いて再度お試しいただくか、メールでお問い合わせください。",
  };

  if (startedAt) {
    startedAt.value = String(Date.now());
  }

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const setSubmitting = (isSubmitting) => {
    if (submit) submit.disabled = isSubmitting;
    form.setAttribute("aria-busy", String(isSubmitting));
  };

  const getValue = (formData, key) => String(formData.get(key) || "").trim();

  const createPayload = (formData) => {
    const payload = new URLSearchParams();
    formData.forEach((value, key) => {
      payload.append(key, String(value));
    });
    return payload;
  };

  const buildMailto = (formData) => {
    const subject = copy.subject;
    const body = [
      copy.greeting,
      "",
      copy.intro,
      "",
      `${copy.name}: ${getValue(formData, "name")}`,
      `${copy.company}: ${getValue(formData, "company")}`,
      `${copy.email}: ${getValue(formData, "email")}`,
      `${copy.phone}: ${getValue(formData, "phone")}`,
      "",
      `${copy.message}:`,
      getValue(formData, "message"),
    ].join("\n");

    return `mailto:${mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      setStatus(copy.invalid);
      return;
    }

    const formData = new FormData(form);

    if (getValue(formData, "website")) {
      form.reset();
      if (startedAt) startedAt.value = String(Date.now());
      setStatus(copy.success);
      return;
    }

    if (getValue(formData, "message").length < minMessageLength) {
      setStatus(copy.shortMessage);
      return;
    }

    setSubmitting(true);

    if (missingEndpoint) {
      window.location.href = buildMailto(formData);
      setStatus(copy.mailOpening);
      setSubmitting(false);
      return;
    }

    try {
      await fetch(endpoint, {
        method: "POST",
        body: createPayload(formData),
        mode: "no-cors",
      });
      form.reset();
      if (startedAt) startedAt.value = String(Date.now());
      setStatus(copy.success);
    } catch (error) {
      setStatus(copy.error);
    } finally {
      setSubmitting(false);
    }
  });
})();
