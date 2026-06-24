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
  const requestTimeoutMs = 20000;
  const previewDelayMs = 1200;
  const previewState = new URLSearchParams(window.location.search).get("kmyContactDialogPreview");
  const pending = {
    id: "",
    controller: null,
    timeoutTimer: 0,
    accepted: false,
  };
  const copy = {
    invalid: "必須項目をご確認ください。",
    shortMessage: "お問い合わせ内容は10文字以上で入力してください。",
    unavailable: "現在フォーム送信の準備中です。恐れ入りますが、下部のメールリンクよりお問い合わせください。",
    networkError: "送信完了を確認できませんでした。入力内容は保持しています。時間を置いて再送信するか、下部のメールリンクよりお問い合わせください。",
    timeoutError: "送信確認に時間がかかっています。入力内容は保持しています。時間を置いて再送信するか、下部のメールリンクよりお問い合わせください。",
    pendingKicker: "送信中",
    pendingTitle: "送信しています",
    pendingMessage: "受付確認を行っています。通常は数秒で完了します。",
    successKicker: "送信完了",
    successTitle: "送信完了しました",
    successMessage: "お問い合わせ内容を受け付けました。確認後、担当者よりご連絡いたします。",
    errorKicker: "送信未完了",
    errorTitle: "送信を完了できませんでした",
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

  const setDialogCopy = (state, message = "") => {
    const isSuccess = state === "success";
    const isError = state === "error";
    if (dialogKicker) {
      dialogKicker.textContent = isSuccess ? copy.successKicker : isError ? copy.errorKicker : copy.pendingKicker;
    }
    if (dialogTitle) {
      dialogTitle.textContent = isSuccess ? copy.successTitle : isError ? copy.errorTitle : copy.pendingTitle;
    }
    if (dialogMessage) {
      dialogMessage.textContent = isSuccess ? copy.successMessage : message || copy.pendingMessage;
    }
    if (dialogClose) dialogClose.hidden = state === "pending";
  };

  const showDialog = (state, message = "") => {
    if (!dialog) return false;

    if (!isDialogOpen()) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : submit;
    }

    setDialogCopy(state, message);
    dialog.dataset.state = state;
    dialog.hidden = false;
    document.body.classList.add("contact-dialog-open");

    if (state !== "pending" && dialogClose) {
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

  const cleanupTransport = () => {
    if (pending.timeoutTimer) {
      window.clearTimeout(pending.timeoutTimer);
    }
    if (pending.controller) {
      pending.controller.abort();
    }
    pending.id = "";
    pending.controller = null;
    pending.timeoutTimer = 0;
    pending.accepted = false;
  };

  const formDataToBody = (formData) => {
    const body = new URLSearchParams();
    formData.forEach((value, key) => {
      if (typeof value === "string") body.append(key, value);
    });
    return body;
  };

  const readGasResponse = async (response) => {
    const text = await response.text();
    let payload = {};

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        throw new Error(copy.networkError);
      }
    }

    if (!response.ok) {
      throw new Error(payload.message || copy.networkError);
    }

    if (payload.success !== true) {
      throw new Error(payload.message || copy.networkError);
    }

    return payload;
  };

  const markAccepted = () => {
    if (!pending.id || pending.accepted) return;

    pending.accepted = true;
    if (pending.timeoutTimer) {
      window.clearTimeout(pending.timeoutTimer);
      pending.timeoutTimer = 0;
    }
    setSubmitting(false);
    form.reset();
    refreshStartedAt();
    setStatus("");
    if (!showDialog("success")) {
      setStatus(`${copy.successTitle}。${copy.successMessage}`, "success");
    }

    pending.id = "";
    pending.controller = null;
  };

  const markFailed = (message) => {
    if (pending.timeoutTimer) {
      window.clearTimeout(pending.timeoutTimer);
      pending.timeoutTimer = 0;
    }
    pending.id = "";
    pending.controller = null;
    pending.accepted = false;
    setSubmitting(false);
    setStatus(message, "error");
    showDialog("error", message);
  };

  const submitToGas = async (formData) => {
    cleanupTransport();

    if (typeof window.fetch !== "function") {
      markFailed(copy.networkError);
      return;
    }

    const requestId = createRequestId();
    setHiddenField("contactRequestId", requestId);
    formData.set("contactRequestId", requestId);

    pending.id = requestId;
    pending.accepted = false;
    pending.controller = typeof window.AbortController === "function" ? new AbortController() : null;
    pending.timeoutTimer = window.setTimeout(() => {
      if (pending.controller) pending.controller.abort();
    }, requestTimeoutMs);

    try {
      const response = await window.fetch(endpoint, {
        method: "POST",
        body: formDataToBody(formData),
        signal: pending.controller ? pending.controller.signal : undefined,
      });
      await readGasResponse(response);
      markAccepted();
    } catch (error) {
      const isAbort = error && error.name === "AbortError";
      markFailed(isAbort ? copy.timeoutError : error && error.message ? error.message : copy.networkError);
    }
  };

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

  const showPreviewDialog = () => {
    if (previewState === "success") {
      setStatus("");
      showDialog("success");
      return;
    }

    if (previewState === "pending") {
      setSubmitting(true);
      setStatus("");
      showDialog("pending");
      window.setTimeout(() => {
        setSubmitting(false);
        showDialog("success");
      }, previewDelayMs);
    }
  };

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

    submitToGas(formData);
  });

  showPreviewDialog();
})();
