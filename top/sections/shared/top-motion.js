/*
 * top-motion.js — 単一ドキュメント統合版TOPの演出（reveal / flow-char / 刀 / paper-artboard）
 *
 * iframe連結版の各セクション <script> から iframe専用コード
 *（postMessage・親viewport追跡・window.self!==window.top 分岐・notifyParentReady）を除去し、
 * 単一HTML用にスコープ化した移植版。各セクションは #id でスコープして自セクションのみを対象にする
 *（02/03/06 が共有する [data-reveal] セレクタの衝突回避）。
 *
 * SSoT: 各セクションの演出ロジック・閾値・対象セレクタは元ファイルに一致させること。
 *   02 sections/02_我々の想い/index.html     [data-reveal] is-visible 0.16/-10% + 刀JS
 *   03 sections/03_我々が行っていること/index.html [data-reveal] is-visible 0.16/-10%
 *   04 sections/04_主な取り組み/index.html     [data-nested-reveal] is-seen 0.22/-12%
 *   05 sections/05_実績/index.html           .reveal is-visible 0.18/-10%
 *   06 sections/06_文化を共につくる/paper-transition.html [data-reveal] is-visible 0.12/-6% + artboard
 */
(() => {
  "use strict";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;

  /* 文字分割（全セクション共通・元スクリプトと同一ロジック） */
  const splitFlow = (element) => {
    if (element.dataset.flowReady === "1") return;
    const text = element.textContent.trim();
    element.dataset.flowReady = "1";
    element.setAttribute("aria-label", text);
    element.textContent = "";
    Array.from(text).forEach((char, index) => {
      const span = document.createElement("span");
      span.className = char === " " ? "flow-char flow-char--space" : "flow-char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--flow-index", index);
      span.textContent = char === " " ? " " : char;
      element.append(span);
    });
  };

  /*
   * reveal用 IntersectionObserver。
   * prefers-reduced / 非対応環境 では即座に cls を付与（演出なしで最終状態）。
   */
  const observeReveal = (targets, cls, opts) => {
    if (!targets.length) return;
    if (prefersReduced || !hasIO) {
      targets.forEach((t) => t.classList.add(cls));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(cls);
        observer.unobserve(entry.target);
      });
    }, opts);
    targets.forEach((t) => observer.observe(t));
  };

  const animate = !prefersReduced && hasIO;

  /* ============ 02 我々の想い（philosophy）: reveal + 刀レスポンシブ ============ */
  (() => {
    const root = document.querySelector("#philosophy .philosophy");
    if (!root) return;
    root.querySelectorAll(".title-main, .title-en").forEach(splitFlow);

    /* 刀のレスポンシブ配置（max-width:980px のみ動作・元 syncResponsiveKatana 移植） */
    const mobileCopy = root.querySelector(".mobile-copy");
    const katana = root.querySelector(".katana");
    const narrowQuery = window.matchMedia("(max-width: 980px)");
    const phoneQuery = window.matchMedia("(max-width: 720px)");
    const compactPhoneQuery = window.matchMedia("(max-width: 480px)");
    let layoutTick = false;

    const syncKatana = () => {
      if (!root || !mobileCopy || !katana) return;
      if (!narrowQuery.matches) {
        [
          "--responsive-blade-length",
          "--responsive-blade-thickness",
          "--responsive-blade-top",
          "--responsive-blade-right",
          "--responsive-section-min-height",
          "--responsive-katana-display",
        ].forEach((name) => root.style.removeProperty(name));
        return;
      }
      const rootRect = root.getBoundingClientRect();
      const copyRect = mobileCopy.getBoundingClientRect();
      if (!rootRect.width || !copyRect.height) return;
      const copyStyle = window.getComputedStyle(mobileCopy);
      const fontSize = parseFloat(copyStyle.fontSize) || 14;
      const lineHeight = parseFloat(copyStyle.lineHeight) || fontSize * 2;
      const isPhone = phoneQuery.matches;
      const copyRight = copyRect.right - rootRect.left;
      const bladeGap = isPhone ? 16 : 18;
      const bladeSafeInset = isPhone ? 24 : 32;
      const bladeLeft = copyRight + bladeGap;
      const bladeRatio =
        katana.naturalWidth > 0 && katana.naturalHeight > 0
          ? katana.naturalWidth / katana.naturalHeight
          : 2720 / 372;
      const maxBladeThickness = rootRect.width - bladeLeft - bladeSafeInset;
      const minBladeThickness = isPhone ? 64 : 72;
      const watermark = root.querySelector(".watermark");
      const watermarkRect =
        watermark && window.getComputedStyle(watermark).display !== "none"
          ? watermark.getBoundingClientRect()
          : null;
      const sectionPadding = 48;

      if (compactPhoneQuery.matches) {
        const visualBottom = Math.max(
          copyRect.bottom - rootRect.top,
          watermarkRect ? watermarkRect.bottom - rootRect.top : 0
        );
        ["--responsive-blade-length", "--responsive-blade-thickness", "--responsive-blade-top", "--responsive-blade-right"].forEach(
          (name) => root.style.removeProperty(name)
        );
        root.style.setProperty("--responsive-katana-display", "none");
        root.style.setProperty("--responsive-section-min-height", `${Math.ceil(visualBottom + sectionPadding)}px`);
        return;
      }

      if (maxBladeThickness < minBladeThickness) {
        const visualBottom = Math.max(
          copyRect.bottom - rootRect.top,
          watermarkRect ? watermarkRect.bottom - rootRect.top : 0
        );
        root.style.setProperty("--responsive-katana-display", "none");
        root.style.setProperty("--responsive-section-min-height", `${Math.ceil(visualBottom + sectionPadding)}px`);
        return;
      }

      const desiredBladeLength = Math.max(lineHeight * 4, copyRect.height);
      const desiredBladeThickness = desiredBladeLength / bladeRatio;
      const bladeThickness = Math.min(desiredBladeThickness, maxBladeThickness);
      const bladeLength = Math.max(lineHeight * 4, bladeThickness * bladeRatio);
      const bladeRight = rootRect.width - bladeLeft - bladeThickness;
      const bladeTop = Math.max(0, copyRect.top - rootRect.top + (copyRect.height - bladeLength) / 2);
      const visualBottom = Math.max(
        copyRect.bottom - rootRect.top,
        bladeTop + bladeLength,
        watermarkRect ? watermarkRect.bottom - rootRect.top : 0
      );
      const sectionMinHeight = Math.ceil(visualBottom + sectionPadding);

      root.style.setProperty("--responsive-blade-length", `${bladeLength.toFixed(3)}px`);
      root.style.setProperty("--responsive-blade-thickness", `${bladeThickness.toFixed(3)}px`);
      root.style.setProperty("--responsive-blade-top", `${bladeTop.toFixed(3)}px`);
      root.style.setProperty("--responsive-blade-right", `${bladeRight.toFixed(3)}px`);
      root.style.setProperty("--responsive-section-min-height", `${sectionMinHeight}px`);
      root.style.setProperty("--responsive-katana-display", "block");
    };

    let katanaTick = false;
    const scheduleKatana = () => {
      if (katanaTick) return;
      katanaTick = true;
      window.requestAnimationFrame(() => {
        katanaTick = false;
        syncKatana();
      });
    };

    syncKatana();
    window.addEventListener("resize", scheduleKatana);
    if (katana && !katana.complete) katana.addEventListener("load", scheduleKatana, { once: true });
    if ("ResizeObserver" in window && mobileCopy) new ResizeObserver(scheduleKatana).observe(mobileCopy);

    const targets = [...root.querySelectorAll("[data-reveal]")];
    if (animate) document.body.classList.add("motion-ready");
    observeReveal(targets, "is-visible", { threshold: 0.16, rootMargin: "0px 0px -10% 0px" });
  })();

  /* ============ 03 我々が行っていること（works）: reveal ============ */
  (() => {
    const root = document.querySelector("#works .works");
    if (!root) return;
    root.querySelectorAll(".works-content h1, .works-mobile header h1").forEach(splitFlow);
    const targets = [...root.querySelectorAll("[data-reveal]")];
    if (animate) document.body.classList.add("motion-ready");
    observeReveal(targets, "is-visible", { threshold: 0.16, rootMargin: "0px 0px -10% 0px" });
  })();

  /* ============ 04 主な取り組み（initiatives）: nested-reveal ============ */
  (() => {
    const shell = document.querySelector("#initiatives .frame-shell");
    if (!shell) return;
    shell.querySelectorAll(".head .title, .initiative-title").forEach(splitFlow);
    const targets = [...shell.querySelectorAll("[data-nested-reveal]")];
    if (animate) {
      shell.classList.add("nested-motion-ready");
      shell.dataset.motion = "content";
    }
    observeReveal(targets, "is-seen", { threshold: 0.22, rootMargin: "0px 0px -12% 0px" });
  })();

  /* ============ 05 実績（achievements）: reveal ============ */
  (() => {
    const root = document.querySelector("#achievements");
    if (!root) return;
    root.querySelectorAll(".section-title").forEach(splitFlow);
    const targets = [...root.querySelectorAll(".reveal")];
    observeReveal(targets, "is-visible", { threshold: 0.18, rootMargin: "0px 0px -10% 0px" });
  })();

  /* ============ 06 文化を共につくる（co-create）: reveal + paper artboard ============ */
  (() => {
    const stage = document.querySelector("#co-create .co-stage");
    const page = document.querySelector("#co-create .co-page");
    if (!stage || !page) return;

    const fitArtboard = () => {
      const height = page.offsetHeight;
      if (!height) return;
      stage.style.height = `${height}px`;
      stage.style.minHeight = `${height}px`;
    };
    fitArtboard();
    window.addEventListener("resize", fitArtboard, { passive: true });

    stage.querySelectorAll(".title-lines p").forEach(splitFlow);
    const targets = [...stage.querySelectorAll("[data-reveal]")];
    if (animate) document.body.classList.add("motion-ready");
    observeReveal(targets, "is-visible", { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  })();
})();
