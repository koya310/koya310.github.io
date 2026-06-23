(() => {
  const phase1PublicMode = true;
  const localizeHref = (href) => href;

  const dictionary = {
    ja: {
      headerLabel: "サイトヘッダー",
      homeHref: "/top/",
      homeLabel: "亀屋日本伝統株式会社 トップへ",
      company: "亀屋日本伝統株式会社",
      roman: "KAMEYA&nbsp;&nbsp;JAPAN&nbsp;&nbsp;TRADITION",
      languageLabel: "EN",
      languageAria: "英語版へ切り替え",
      menuOpen: "メニューを開く",
      menuClose: "メニューを閉じる",
      menuKicker: "Menu",
      menuTitle: ["日本の文化を、", "次の時代へ。"],
      menuNavLabel: "グローバルナビゲーション",
      footerLabel: "サイトフッター",
      footerProfileLabel: "会社情報",
      footerNavLabel: "フッターナビゲーション",
      footerLegalLabel: "法務リンク",
      address: "所在地・電話番号は、ご請求があった場合に遅滞なく開示します。",
      copyright: "© 亀屋日本伝統株式会社",
      navItems: [
        ["01", "トップ", "/top/"],
        ["02", "我々について", "/about/"],
        ["03", "創業の想い", "/essay/story/"],
        ["04", "事業内容", "/services/"],
        ["05", "工芸の可能性", "/kogei/"],
        ["06", "作家・作品", "/artists/"],
        ["07", "お知らせ", "/news/"],
        ["08", "お問い合わせ", "/contact/"],
      ],
      footerPrimaryItems: [
        ["トップ", "/top/"],
        ["我々について", "/about/"],
        ["創業の想い", "/essay/story/"],
        ["事業内容", "/services/"],
        ["工芸の可能性", "/kogei/"],
        ["作家・作品", "/artists/"],
        ["お知らせ", "/news/"],
      ],
      footerLegalItems: [
        ["お問い合わせ", "/contact/"],
        ["プライバシーポリシー", "/privacy/"],
        ["特定商取引法に基づく表記", "/deal/"],
      ],
    },
    en: {
      headerLabel: "Site header",
      homeHref: "/top/",
      homeLabel: "Kameya Japan Tradition home",
      company: "Kameya Japan Tradition",
      roman: "KAMEYA&nbsp;&nbsp;JAPAN&nbsp;&nbsp;TRADITION",
      languageLabel: "JP",
      languageAria: "Switch to Japanese",
      menuOpen: "Open menu",
      menuClose: "Close menu",
      menuKicker: "Menu",
      menuTitle: ["Japanese Culture,", "Toward the Next Age."],
      menuNavLabel: "Global navigation",
      footerLabel: "Site footer",
      footerProfileLabel: "Company information",
      footerNavLabel: "Footer navigation",
      footerLegalLabel: "Legal links",
      address: "Address and phone number are disclosed without delay upon request.",
      copyright: "© Kameya Japan Tradition Co., Ltd.",
      navItems: [
        ["01", "Top", "/top/"],
        ["02", "Philosophy", "/about/"],
        ["03", "Founder's Essay", "/essay/"],
        ["04", "Services", "/services/"],
        ["05", "Possibility of Craft", "/kogei/"],
        ["06", "Artists", "/artists/"],
        ["07", "News", "/news/"],
        ["08", "Contact", "/contact/"],
      ],
      footerPrimaryItems: [
        ["Top", "/top/"],
        ["Philosophy", "/about/"],
        ["Founder's Essay", "/essay/"],
        ["Services", "/services/"],
        ["Possibility of Craft", "/kogei/"],
        ["Artists", "/artists/"],
        ["News", "/news/"],
      ],
      footerLegalItems: [
        ["Contact", "/contact/"],
        ["Privacy Policy", "/privacy/"],
        ["Legal Notice", "/deal/"],
      ],
    },
  };
  const copy = dictionary.ja;

  const body = document.body;
  body.dataset.kameyaLang = "ja";

  const injectHeader = () => {
    if (document.querySelector(".kameya-common-header")) return;

    document.querySelectorAll("header.site-header, header.global-header").forEach((header) => header.remove());

    const header = document.createElement("header");
    header.className = "site-header kameya-common-header";
    header.setAttribute("aria-label", copy.headerLabel);
    header.innerHTML = `
      <a class="brand-lockup kameya-common-header__brand" href="${copy.homeHref}" aria-label="${copy.homeLabel}">
        <span class="brand-mark kameya-common-header__mark" aria-hidden="true">
          <img src="/about/assets/figma/logo-mark.png" alt="" />
        </span>
        <span class="brand-text kameya-common-header__text">
          <span class="brand-name">${copy.company}</span>
          <span class="brand-roman">${copy.roman}</span>
        </span>
      </a>
      <div class="kameya-common-header__actions">
        ${phase1PublicMode ? "" : ""}
        <button class="menu-button kameya-common-header__menu" type="button" aria-label="${copy.menuOpen}">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>
    `;

    document.body.prepend(header);
    body.classList.add("kameya-common-header-ready");
  };

  const injectFooter = () => {
    if (document.querySelector(".kameya-site-footer")) return;

    document.querySelectorAll("footer.site-footer").forEach((footer) => footer.remove());

    const footer = document.createElement("footer");
    footer.className = "kameya-site-footer";
    footer.setAttribute("aria-label", copy.footerLabel);
    footer.innerHTML = `
      <div class="kameya-site-footer__inner">
        <div class="kameya-site-footer__primary">
          <section class="kameya-site-footer__profile" aria-label="${copy.footerProfileLabel}">
            <p class="kameya-site-footer__company">${copy.company}</p>
            <address class="kameya-site-footer__address">
              <span>${copy.address}</span>
              <a href="mailto:desk@kameya-japan-tradition.com">desk@kameya-japan-tradition.com</a>
            </address>
            <div class="kameya-site-footer__socials" aria-label="SNSリンク">
              <a href="https://www.facebook.com/p/%E4%BA%80%E5%B1%8B%E5%A4%A2%E6%9C%88-100026775131911/" aria-label="Facebook">
                <img src="/about/assets/figma/facebook.svg" alt="" />
              </a>
              <a href="https://www.instagram.com/kameya.official.japan/" aria-label="Instagram">
                <img src="/about/assets/figma/instagram.svg" alt="" />
              </a>
            </div>
          </section>
          <nav class="kameya-site-footer__nav" aria-label="${copy.footerNavLabel}">
            ${copy.footerPrimaryItems.map(([label, href]) => `<a href="${localizeHref(href)}">${label}</a>`).join("")}
          </nav>
        </div>
        <div class="kameya-site-footer__rule" aria-hidden="true"></div>
        <div class="kameya-site-footer__bottom">
          <nav class="kameya-site-footer__legal" aria-label="${copy.footerLegalLabel}">
            ${copy.footerLegalItems.map(([label, href]) => `<a href="${localizeHref(href)}">${label}</a>`).join("")}
          </nav>
          <p class="kameya-site-footer__copyright">${copy.copyright}</p>
        </div>
      </div>
    `;

    document.body.append(footer);

    if ("IntersectionObserver" in window) {
      const footerObserver = new IntersectionObserver(
        (entries) => {
          body.classList.toggle("kameya-footer-in-view", entries.some((entry) => entry.isIntersecting));
        },
        { threshold: 0.08 }
      );

      footerObserver.observe(footer);
    }
  };

  injectHeader();
  injectFooter();

  const buttons = [...document.querySelectorAll(".menu-button, .global-menu")];

  if (!buttons.length) return;

  const normalizeButton = (button) => {
    if (button.dataset.kameyaMenuReady === "1") return;
    button.dataset.kameyaMenuReady = "1";
    button.setAttribute("aria-controls", "kameya-menu-overlay");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", copy.menuOpen);
    button.innerHTML =
      '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
  };

  const overlay = document.createElement("div");
  overlay.className = "kameya-menu-overlay";
  overlay.id = "kameya-menu-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="kameya-menu-overlay__inner">
      <div class="kameya-menu-overlay__headline">
        <p class="kameya-menu-overlay__kicker">${copy.menuKicker}</p>
        <p class="kameya-menu-overlay__title">${copy.menuTitle.map((line) => `<span>${line}</span>`).join("")}</p>
      </div>
      <nav class="kameya-menu-overlay__nav" aria-label="${copy.menuNavLabel}">
        ${copy.navItems
          .map(
            ([index, label, href], itemIndex) =>
              `<a href="${localizeHref(href)}" data-index="${index}" style="--kameya-menu-index:${itemIndex}">${label}</a>`
          )
          .join("")}
      </nav>
    </div>
  `;
  document.body.append(overlay);

  const commonHeader = document.querySelector(".kameya-common-header");
  let headerFrame = 0;
  let lastHeaderScrollY = Math.max(0, window.scrollY || 0);
  let headerHidden = false;
  const headerSurfaceClasses = [
    "kameya-header-on-white",
    "kameya-header-on-paper",
    "kameya-header-on-light",
    "kameya-header-on-dark",
  ];

  const parseColor = (value) => {
    const parts = value?.match(/[\d.]+/g)?.map(Number);
    if (!parts || parts.length < 3) return null;
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 ? parts[3] : 1,
    };
  };

  const luminance = ({ r, g, b }) => {
    const channels = [r, g, b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const findSurfaceColor = (probeY) => {
    const points = [0.22, 0.5, 0.78].map((rate) =>
      Math.min(window.innerWidth - 1, Math.max(1, Math.round(window.innerWidth * rate)))
    );
    const isSolidSurface = (color) => color && color.a > 0.72;

    for (const probeX of points) {
      let element = document.elementFromPoint(probeX, probeY);
      const section = element?.closest?.(".home-section, [data-header-surface]");
      const sectionColor = parseColor(section ? window.getComputedStyle(section).backgroundColor : "");
      if (isSolidSurface(sectionColor)) return sectionColor;

      while (element && element !== document.documentElement) {
        if (element.tagName === "IFRAME") {
          element = element.parentElement;
          continue;
        }
        if (element.matches("input, textarea, select, button, a, label, svg, img")) {
          element = element.parentElement;
          continue;
        }
        const color = parseColor(window.getComputedStyle(element).backgroundColor);
        if (isSolidSurface(color)) return color;
        element = element.parentElement;
      }
    }

    const bodyColor = parseColor(window.getComputedStyle(body).backgroundColor);
    if (isSolidSurface(bodyColor)) return bodyColor;

    const rootColor = parseColor(window.getComputedStyle(document.documentElement).backgroundColor);
    if (isSolidSurface(rootColor)) return rootColor;

    return { r: 248, g: 244, b: 234, a: 1 };
  };

  const classifySurface = (color) => {
    const brightness = luminance(color);
    const blueDominant = color.b > color.r + 20 && color.b >= color.g + 8;
    const nearWhite = color.r > 246 && color.g > 246 && color.b > 246;
    const warmPaper = color.r - color.b > 8 && color.g - color.b > 2 && brightness > 0.74;

    if (brightness < 0.42 || (blueDominant && brightness < 0.56)) return "dark";
    if (nearWhite) return "white";
    if (warmPaper) return "paper";
    return "light";
  };

  const updateHeaderSurface = (atTop) => {
    if (atTop) {
      body.style.removeProperty("--kameya-header-surface-dynamic");
      headerSurfaceClasses.forEach((className) => body.classList.remove(className));
      body.classList.remove("kameya-header-over-deep");
      return;
    }

    const headerBottom = commonHeader?.getBoundingClientRect().bottom || 72;
    const probeY = Math.min(window.innerHeight - 1, Math.max(1, Math.round(headerBottom + 4)));
    const surfaceColor = findSurfaceColor(probeY);
    const surface = classifySurface(surfaceColor);
    const surfaceValue = `rgb(${Math.round(surfaceColor.r)}, ${Math.round(surfaceColor.g)}, ${Math.round(surfaceColor.b)})`;

    body.style.setProperty("--kameya-header-surface-dynamic", surfaceValue);
    headerSurfaceClasses.forEach((className) => body.classList.remove(className));
    body.classList.add(`kameya-header-on-${surface}`);
    body.classList.toggle("kameya-header-over-deep", surface === "dark");
  };

  const updateHeaderVisibility = () => {
    headerFrame = 0;
    const currentScrollY = Math.max(0, window.scrollY || 0);
    const delta = currentScrollY - lastHeaderScrollY;
    const atTop = currentScrollY < 24;

    if (body.classList.contains("kameya-menu-open") || atTop) {
      headerHidden = false;
    } else if (delta > 8 && currentScrollY > 96) {
      headerHidden = true;
    } else if (delta < -8) {
      headerHidden = false;
    }

    body.classList.toggle("kameya-header-at-top", atTop);
    body.classList.toggle("kameya-header-elevated", !atTop);
    body.classList.toggle("kameya-header-hidden", headerHidden);
    updateHeaderSurface(atTop);
    lastHeaderScrollY = currentScrollY;
  };

  const requestHeaderVisibilityUpdate = () => {
    if (headerFrame) return;
    headerFrame = window.requestAnimationFrame(updateHeaderVisibility);
  };

  window.addEventListener("scroll", requestHeaderVisibilityUpdate, { passive: true });
  window.addEventListener("resize", requestHeaderVisibilityUpdate);
  window.addEventListener("orientationchange", requestHeaderVisibilityUpdate);
  updateHeaderVisibility();

  const setOpen = (open) => {
    body.classList.toggle("kameya-menu-open", open);
    if (open) body.classList.remove("kameya-header-hidden");
    overlay.setAttribute("aria-hidden", String(!open));
    buttons.forEach((button) => {
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? copy.menuClose : copy.menuOpen);
    });
    requestHeaderVisibilityUpdate();
  };

  buttons.forEach((button) => {
    normalizeButton(button);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(!body.classList.contains("kameya-menu-open"));
    }, true);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) setOpen(false);
  });

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (link.target && link.target !== "_self") return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const nextUrl = new URL(href, window.location.href);
    if (nextUrl.origin !== window.location.origin) return;
    if (nextUrl.pathname === window.location.pathname && nextUrl.hash) return;

    event.preventDefault();
    setOpen(false);
    body.classList.add("kameya-page-leaving");
    window.setTimeout(() => {
      window.location.href = nextUrl.href;
    }, 260);
  });

  window.addEventListener("pageshow", () => {
    body.classList.remove("kameya-page-leaving");
    setOpen(false);
    requestHeaderVisibilityUpdate();
  });
})();
