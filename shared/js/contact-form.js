(() => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = document.querySelector("[data-contact-status]");
  const startedAt = form.querySelector("[data-contact-started-at]");
  const submit = form.querySelector("button[type='submit']");
  const submitDefaultText = submit ? submit.textContent : "";
  const endpoint = (form.dataset.gasEndpoint || form.getAttribute("action") || "").trim();
  const missingEndpoint = !endpoint || endpoint === "GAS_WEB_APP_URL_TODO";
  const minMessageLength = 10;
  const responseSource = "kameya-contact";
  const timeoutMs = 30000;
  const pending = {
    id: "",
    iframe: null,
    timer: 0,
  };
  const copy = {
    invalid: "必須項目をご確認ください。",
    shortMessage: "お問い合わせ内容は10文字以上で入力してください。",
    unavailable: "現在フォーム送信の準備中です。恐れ入りますが、下部のメールリンクよりお問い合わせください。",
    submitting: "送信中です。しばらくお待ちください。",
    success: "お問い合わせありがとうございました。内容を受け付けました。確認のうえ、担当者よりご連絡いたします。ご入力いただいたメールアドレス宛に、控えのメールをお送りしています。",
    error: "送信できませんでした。時間を置いて再度お試しいただくか、メールでお問い合わせください。",
    timeout: "送信結果を確認できませんでした。時間を置いて再度お試しいただくか、メールでお問い合わせください。",
  };

  if (startedAt) {
    startedAt.value = String(Date.now());
  }

  const setStatus = (message, state = "") => {
    if (!status) return;
    status.textContent = message;
    if (state) {
      status.dataset.state = state;
    } else {
      delete status.dataset.state;
    }
  };

  const setSubmitting = (isSubmitting) => {
    if (submit) submit.disabled = isSubmitting;
    if (submit) submit.textContent = isSubmitting ? "送信中" : submitDefaultText;
    form.setAttribute("aria-busy", String(isSubmitting));
  };

  const getValue = (formData, key) => String(formData.get(key) || "").trim();

  const createRequestId = () => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `contact-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };

  const setHiddenField = (name, value) => {
    let field = form.querySelector(`input[name="${name}"]`);
    if (!field) {
      field = document.createElement("input");
      field.type = "hidden";
      field.name = name;
      form.appendChild(field);
    }
    field.value = value;
  };

  const restoreAttribute = (name, value) => {
    if (value === null) {
      form.removeAttribute(name);
      return;
    }
    form.setAttribute(name, value);
  };

  const cleanupTransport = () => {
    if (pending.timer) {
      window.clearTimeout(pending.timer);
    }
    if (pending.iframe && pending.iframe.parentNode) {
      pending.iframe.parentNode.removeChild(pending.iframe);
    }
    pending.id = "";
    pending.iframe = null;
    pending.timer = 0;
  };

  const submitToGas = () => {
    cleanupTransport();

    const requestId = createRequestId();
    const frameName = `contact-response-${requestId}`;
    const iframe = document.createElement("iframe");
    const previous = {
      action: form.getAttribute("action"),
      method: form.getAttribute("method"),
      target: form.getAttribute("target"),
    };

    iframe.name = frameName;
    iframe.title = "お問い合わせ送信結果";
    iframe.hidden = true;
    iframe.style.display = "none";

    pending.id = requestId;
    pending.iframe = iframe;
    pending.timer = window.setTimeout(() => {
      cleanupTransport();
      setSubmitting(false);
      setStatus(copy.timeout, "error");
    }, timeoutMs);

    setHiddenField("contactRequestId", requestId);
    document.body.appendChild(iframe);

    form.setAttribute("action", endpoint);
    form.setAttribute("method", "post");
    form.setAttribute("target", frameName);

    try {
      HTMLFormElement.prototype.submit.call(form);
    } catch (error) {
      cleanupTransport();
      setSubmitting(false);
      setStatus(copy.error, "error");
    } finally {
      restoreAttribute("action", previous.action);
      restoreAttribute("method", previous.method);
      restoreAttribute("target", previous.target);
    }
  };

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!pending.id || !pending.iframe) return;
    if (event.source !== pending.iframe.contentWindow) return;
    if (!data || data.source !== responseSource || data.requestId !== pending.id) return;

    cleanupTransport();
    setSubmitting(false);

    if (data.success) {
      form.reset();
      if (startedAt) startedAt.value = String(Date.now());
      setStatus(data.message || copy.success, "success");
      return;
    }

    setStatus(data.message || copy.error, "error");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      setStatus(copy.invalid, "error");
      return;
    }

    const formData = new FormData(form);

    if (getValue(formData, "website")) {
      form.reset();
      if (startedAt) startedAt.value = String(Date.now());
      setStatus(copy.success, "success");
      return;
    }

    if (getValue(formData, "message").length < minMessageLength) {
      setStatus(copy.shortMessage, "error");
      return;
    }

    setSubmitting(true);
    setStatus(copy.submitting, "pending");

    if (missingEndpoint) {
      setSubmitting(false);
      setStatus(copy.unavailable, "error");
      return;
    }

    submitToGas();
  });
})();
