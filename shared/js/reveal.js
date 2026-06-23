(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isEnglish = document.documentElement.lang === "en";
  const main = document.querySelector("main");

  if (!main) {
    return;
  }

  const revealSelector = [
    "main > section",
    "main .page-heading",
    "main .page-head",
    "main .intro",
    "main .about-section",
    "main .project-card",
    "main .artist-card",
    "main .service-card",
    "main .maker-card",
    "main .thought-body",
    "main .profile",
    "main .body-copy",
    "main .detail-body",
    "main .detail-visual",
    "main .contact-form",
    "main .contact-card",
    "main .legal-section",
    "main .deal-table tr",
    "main .news-entry",
    "main .news-page-card",
    "main .empty-state",
    "main .essay-section",
    "main .essay-closing",
    "main .section-heading",
    "main .section-layout",
  ].join(",");

  const titleSelector = [
    ".page-title",
    ".section-title",
    ".statement-title",
    ".intro-title",
    ".project-title",
    ".artist-name",
    ".detail-title",
    ".essay-title",
    ".news-heading h1",
  ].join(",");

  const revealItems = Array.from(new Set(Array.from(document.querySelectorAll(revealSelector))));
  const titleItems = Array.from(document.querySelectorAll(titleSelector)).filter((element) => {
    return element.childElementCount === 0 && element.textContent.trim().length > 0;
  });

  const splitTitle = (element) => {
    if (element.dataset.kameyaTitleFlow === "true") {
      return;
    }

    const text = element.textContent;
    const fragment = document.createDocumentFragment();
    let index = 0;

    const parts = isEnglish ? text.split(/(\s+)/) : Array.from(text);

    parts.forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part) || part === "　") {
        fragment.appendChild(document.createTextNode(part));
        return;
      }

      const span = document.createElement("span");
      span.className = "kameya-flow-char";
      span.style.setProperty("--kameya-flow-index", index);
      span.textContent = part;
      fragment.appendChild(span);
      index += 1;
    });

    element.textContent = "";
    element.appendChild(fragment);
    element.dataset.kameyaTitleFlow = "true";
  };

  titleItems.forEach((element) => {
    splitTitle(element);
    element.dataset.kameyaReveal = "title";
  });

  revealItems.forEach((element, index) => {
    element.dataset.kameyaReveal = element.dataset.kameyaReveal || "content";
    element.style.setProperty("--kameya-reveal-delay", `${Math.min(index, 2) * 70}ms`);
  });

  document.body.classList.add("kameya-reveal-ready");

  const allItems = Array.from(new Set([...revealItems, ...titleItems]));

  if (prefersReduced || !("IntersectionObserver" in window)) {
    allItems.forEach((element) => element.classList.add("is-kameya-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => {
          const topDiff = a.boundingClientRect.top - b.boundingClientRect.top;
          if (Math.abs(topDiff) > 8) return topDiff;
          return a.boundingClientRect.left - b.boundingClientRect.left;
        })
        .forEach((entry, index) => {
          entry.target.style.setProperty("--kameya-reveal-delay", `${Math.min(index * 90, 360)}ms`);
          entry.target.classList.add("is-kameya-visible");
          observer.unobserve(entry.target);
        });
    },
    {
      root: null,
      rootMargin: "0px 0px 12% 0px",
      threshold: 0.01,
    }
  );

  allItems.forEach((element) => {
    observer.observe(element);
  });
})();
