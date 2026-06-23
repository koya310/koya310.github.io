(() => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = document.querySelector("[data-contact-status]");
  const mailTo = "contact@kameya-japan-tradition.com";
  const gasEndpoint = form.dataset.gasEndpoint || "";
  const isEnglish = document.documentElement.lang === "en" || window.location.pathname.startsWith("/en/");
  const copy = isEnglish
    ? {
        subject: "Inquiry from the Kameya Japan Tradition website",
        greeting: "To Kameya Japan Tradition,",
        intro: "I would like to make an inquiry with the following details.",
        name: "Name",
        company: "Company / Organization",
        email: "Email",
        phone: "Phone",
        message: "Message",
        invalid: "Please check the required fields.",
        mailOpening: "Opening your email client. Please review the content before sending.",
        success: "Your inquiry has been submitted.",
        error: "The message could not be sent. Please try again later or contact us by email.",
      }
    : {
        subject: "亀屋日本伝統株式会社 Webサイトからのお問い合わせ",
        greeting: "亀屋日本伝統株式会社 御中",
        intro: "以下の内容で問い合わせます。",
        name: "名前",
        company: "会社名・所属",
        email: "メールアドレス",
        phone: "電話番号",
        message: "お問い合わせ内容",
        invalid: "必須項目をご確認ください。",
        mailOpening: "メール作成画面を開きます。内容をご確認のうえ送信してください。",
        success: "お問い合わせが完了しました。入力したメールアドレスに問い合わせ内容のコピーを送信しました。",
        error: "送信できませんでした。時間を置いて再度お試しいただくか、メールでお問い合わせください。",
      };

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const buildMailto = (formData) => {
    const subject = copy.subject;
    const body = [
      copy.greeting,
      "",
      copy.intro,
      "",
      `${copy.name}: ${formData.get("name") || ""}`,
      `${copy.company}: ${formData.get("company") || ""}`,
      `${copy.email}: ${formData.get("email") || ""}`,
      `${copy.phone}: ${formData.get("phone") || ""}`,
      "",
      `${copy.message}:`,
      formData.get("message") || "",
    ].join("\n");

    return `mailto:${mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      setStatus(copy.invalid);
      return;
    }

    const submit = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    submit.disabled = true;

    if (!gasEndpoint) {
      window.location.href = buildMailto(formData);
      setStatus(copy.mailOpening);
      submit.disabled = false;
      return;
    }

    try {
      await fetch(gasEndpoint, {
        method: "POST",
        body: formData,
        mode: "no-cors",
      });
      form.reset();
      setStatus(copy.success);
      submit.disabled = false;
    } catch (error) {
      setStatus(copy.error);
      submit.disabled = false;
    }
  });
})();
