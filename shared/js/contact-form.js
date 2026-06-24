(() => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = document.querySelector("[data-contact-status]");
  const dialog = document.querySelector("[data-contact-dialog]");
  const dialogKicker = document.querySelector("[data-contact-dialog-kicker]");
  const dialogTitle = document.querySelector("[data-contact-dialog-title]");
  const dialogMessage = document.querySelector("[data-contact-dialog-message]");
  const dialogClose = document.querySelector("[data-contact-dialog-close]");
  const startedAt = form.querySelector("[data-contact-started-at]");
  const submit = form.querySelector("button[type='submit']");
  const submitDefaultText = submit ? submit.textContent : "";
  const endpoint = (form.dataset.gasEndpoint || form.getAttribute("action") || "").trim();
  const missingEndpoint = !endpoint || endpoint === "GAS_WEB_APP_URL_TODO";
  const minMessageLength = 10;
  const responseSource = "kameya-contact";
  const acceptDelayMs = 3000;
  const transportCleanupMs = 60000;
  const pending = {
    id: "",
    iframe: null,
    acceptTimer: 0,
    cleanupTimer: 0,
    accepted: false,
  };
  const copy = {
    invalid: "必須項目をご確認ください。",
    shortMessage: "お問い合わせ内容は10文字以上で入力してください。",
    unavailable: "現在フォーム送信の準備中です。恐れ入りますが、下部のメールリンクよりお問い合わせください。",
    startError: "送信を開始できませんでした。下部のメールリンクよりお問い合わせください。",
    pendingKicker: "送信中",
    pendingTitle: "送信しています",
    pendingMessage: "この画面のままお待ちください。",
    successKicker: "送信完了",
    successTitle: "送信完了しました",
    successMessage: "お問い合わせ内容を受け付けました。確認のうえ、担当者よりご連絡いたします。",
  };
  let previousFocus = null;

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

  const refreshStartedAt = () => {
    if (startedAt) startedAt.value = String(Date.now());
  };

  const isDialogOpen = () => dialog && !dialog.hidden;

  const setDialogCopy = (state) => {
    const isSuccess = state === "success";
    if (dialogKicker) dialogKicker.textContent = isSuccess ? copy.successKicker : copy.pendingKicker;
    if (dialogTitle) dialogTitle.textContent = isSuccess ? copy.successTitle : copy.pendingTitle;
    if (dialogMessage) dialogMessage.textContent = isSuccess ? copy.successMessage : copy.pendingMessage;
    if (dialogClose) dialogClose.hidden = !isSuccess;
  };

  const showDialog = (state) => {
    if (!dialog) return false;

    if (!isDialogOpen()) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : submit;
    }

    setDialogCopy(state);
    dialog.dataset.state = state;
    dialog.hidden = false;
    document.body.classList.add("contact-dialog-open");

    if (state === "success" && dialogClose) {
      window.setTimeout(() => dialogClose.focus(), 0);
    }
    return true;
  };

  const closeDialog = (force = false) => {
    if (!dialog || dialog.hidden) return;
    if (!force && dialog.dataset.state === "pending") return;

    dialog.hidden = true;
    delete dialog.dataset.state;
    document.body.classList.remove("contact-dialog-open");

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    previousFocus = null;
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
    if (pending.acceptTimer) {
      window.clearTimeout(pending.acceptTimer);
    }
    if (pending.cleanupTimer) {
      window.clearTimeout(pending.cleanupTimer);
    }
    if (pending.iframe && pending.iframe.parentNode) {
      pending.iframe.parentNode.removeChild(pending.iframe);
    }
    pending.id = "";
    pending.iframe = null;
    pending.acceptTimer = 0;
    pending.cleanupTimer = 0;
    pending.accepted = false;
  };

  const markAccepted = () => {
    if (!pending.id || pending.accepted) return;

    pending.accepted = true;
    if (pending.acceptTimer) {
      window.clearTimeout(pending.acceptTimer);
      pending.acceptTimer = 0;
    }
    setSubmitting(false);
    form.reset();
    refreshStartedAt();
    setStatus("");
    if (!showDialog("success")) {
      setStatus(`${copy.successTitle}。${copy.successMessage}`, "success");
    }

    if (!pending.cleanupTimer) {
      pending.cleanupTimer = window.setTimeout(cleanupTransport, transportCleanupMs);
    }
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
    pending.accepted = false;
    pending.acceptTimer = window.setTimeout(markAccepted, acceptDelayMs);

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
      setStatus(copy.startError, "error");
      closeDialog(true);
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

    markAccepted();
    cleanupTransport();
  });

  if (dialogClose) {
    dialogClose.addEventListener("click", closeDialog);
  }

  if (dialog) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDialog();
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
      refreshStartedAt();
      setStatus("");
      if (!showDialog("success")) {
        setStatus(`${copy.successTitle}。${copy.successMessage}`, "success");
      }
      return;
    }

    if (getValue(formData, "message").length < minMessageLength) {
      setStatus(copy.shortMessage, "error");
      return;
    }

    setSubmitting(true);
    setStatus("");
    showDialog("pending");

    if (missingEndpoint) {
      setSubmitting(false);
      closeDialog(true);
      setStatus(copy.unavailable, "error");
      return;
    }

    submitToGas();
  });
})();
