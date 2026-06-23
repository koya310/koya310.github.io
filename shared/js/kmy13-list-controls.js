(() => {
  const ALL_VALUE = "__all";
  const MAX_ITEMS_PER_PAGE = 16;
  const PAGE_SIZE_PREVIEW_PARAM = "kmy13PageSize";

  const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();

  const unique = (values) => {
    const seen = new Set();
    return values.filter((value) => {
      const normalized = normalize(value);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  };

  const parseDataTags = (element) => unique((element.dataset.kmyTags || "").split(",").map(normalize));

  const setVisible = (element, isVisible) => {
    if (!element) return;
    element.hidden = !isVisible;
  };

  const createButton = (label, value, className) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.dataset.kmyFilterValue = value;
    button.setAttribute("aria-pressed", "false");
    return button;
  };

  const setActiveButton = (buttons, activeValue) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.kmyFilterValue === activeValue;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  const updateStatus = (status, total, first, last) => {
    if (!status) return;
    status.textContent = total === 0 ? "0件" : `${total}件中 ${first}-${last}件を表示`;
  };

  const getPageSize = (list) => {
    const params = new URLSearchParams(window.location.search);
    const previewPageSize = Number.parseInt(params.get(PAGE_SIZE_PREVIEW_PARAM) || "", 10);
    if (Number.isFinite(previewPageSize) && previewPageSize >= 1 && previewPageSize <= MAX_ITEMS_PER_PAGE) {
      return previewPageSize;
    }

    const dataPageSize = Number.parseInt(list.dataset.kmyPageSize || "", 10);
    if (Number.isFinite(dataPageSize) && dataPageSize >= 1) return dataPageSize;
    return MAX_ITEMS_PER_PAGE;
  };

  const renderPagination = ({ nav, page, totalPages, onPageChange }) => {
    if (!nav) return;
    nav.innerHTML = "";
    if (totalPages <= 1) {
      nav.hidden = true;
      return;
    }

    nav.hidden = false;
    const makePageButton = (label, nextPage, disabled = false, active = false) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kmy-pagination__button";
      button.textContent = label;
      button.disabled = disabled;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => onPageChange(nextPage));
      return button;
    };

    nav.appendChild(makePageButton("前へ", Math.max(1, page - 1), page === 1));
    for (let index = 1; index <= totalPages; index += 1) {
      nav.appendChild(makePageButton(String(index), index, false, index === page));
    }
    nav.appendChild(makePageButton("次へ", Math.min(totalPages, page + 1), page === totalPages));
  };

  const addTagList = (target, tags, className) => {
    if (!target || target.querySelector(`.${className}`)) return;
    const tagList = document.createElement("ul");
    tagList.className = `kmy-tag-list ${className}`;
    tags.forEach((tag) => {
      const item = document.createElement("li");
      item.className = "kmy-tag";
      item.textContent = tag;
      tagList.appendChild(item);
    });
    target.appendChild(tagList);
  };

  const initTaggedList = (type) => {
    const list = document.querySelector(`[data-kmy-list="${type}"]`);
    const controls = document.querySelector(`[data-kmy-controls="${type}"]`);
    if (!list || !controls) return;

    const config =
      type === "works"
        ? {
            itemSelector: ".project-card",
            tagSelector: ".project-meta span",
            tagListTargetSelector: ".project-link",
            tagListClass: "project-tags",
          }
        : {
            itemSelector: ".news-page-card",
            tagSelector: ".news-page-tag",
            tagListTargetSelector: "",
            tagListClass: "",
          };

    const pageSize = getPageSize(list);
    const items = Array.from(list.querySelectorAll(config.itemSelector)).map((element) => {
      const tags = unique([
        ...parseDataTags(element),
        ...Array.from(element.querySelectorAll(config.tagSelector)).map((tag) => tag.textContent),
      ]);
      if (config.tagListTargetSelector) {
        addTagList(element.querySelector(config.tagListTargetSelector), tags, config.tagListClass);
      }
      return { element, tags };
    });

    const allTags = unique(items.flatMap((item) => item.tags));
    const filterGroup = controls.querySelector('[data-kmy-filter-group="tag"]');
    const status = controls.querySelector("[data-kmy-status]");
    const reset = controls.querySelector("[data-kmy-reset]");
    const empty = document.querySelector(`[data-kmy-empty="${type}"]`);
    const pagination = document.querySelector(`[data-kmy-pagination="${type}"]`);
    let activeTag = ALL_VALUE;
    let page = 1;

    if (!items.length || !filterGroup) return;

    const buttons = [createButton("すべて", ALL_VALUE, "kmy-filter-button")];
    allTags.forEach((tag) => buttons.push(createButton(tag, tag, "kmy-filter-button")));
    buttons.forEach((button) => filterGroup.appendChild(button));

    const render = () => {
      const matchingItems = items.filter((item) => activeTag === ALL_VALUE || item.tags.includes(activeTag));
      const totalPages = Math.max(1, Math.ceil(matchingItems.length / pageSize));
      page = Math.min(page, totalPages);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const visibleItems = new Set(matchingItems.slice(start, end));

      items.forEach((item) => setVisible(item.element, visibleItems.has(item)));
      setVisible(empty, matchingItems.length === 0);

      const first = matchingItems.length === 0 ? 0 : start + 1;
      const last = Math.min(end, matchingItems.length);
      updateStatus(status, matchingItems.length, first, last);
      setActiveButton(buttons, activeTag);
      renderPagination({
        nav: pagination,
        page,
        totalPages,
        onPageChange: (nextPage) => {
          page = nextPage;
          render();
        },
      });
    };

    filterGroup.addEventListener("click", (event) => {
      const button = event.target.closest("[data-kmy-filter-value]");
      if (!button) return;
      activeTag = button.dataset.kmyFilterValue || ALL_VALUE;
      page = 1;
      render();
    });

    reset?.addEventListener("click", () => {
      activeTag = ALL_VALUE;
      page = 1;
      render();
    });

    controls.hidden = false;
    render();
  };

  const parseArtistMeta = (card) => {
    const metaSpans = Array.from(card.querySelectorAll(".artist-meta span")).map((span) => normalize(span.textContent));
    const fieldParts = (metaSpans[0] || "").split("/").map(normalize).filter(Boolean);
    const field = fieldParts[0] || "未分類";
    const secondaryFields = unique(fieldParts.slice(1));
    const rawTitle = metaSpans[1] || "";
    const title = rawTitle.includes("人間国宝") ? "人間国宝" : rawTitle || "掲載作家";
    return { field, secondaryFields, title };
  };

  const addOption = (select, value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value === ALL_VALUE ? "すべて" : value;
    select.appendChild(option);
  };

  const initArtistsList = () => {
    const type = "artists";
    const list = document.querySelector(`[data-kmy-list="${type}"]`);
    const controls = document.querySelector(`[data-kmy-controls="${type}"]`);
    if (!list || !controls) return;

    const items = Array.from(list.querySelectorAll(".artist-card")).map((element) => {
      const meta = parseArtistMeta(element);
      const tagTarget = element.querySelector(".artist-info");
      addTagList(tagTarget, [meta.field, ...meta.secondaryFields, meta.title], "artist-tag-list");
      return { element, ...meta };
    });

    const selects = {
      field: controls.querySelector('[data-kmy-filter-select="field"]'),
      secondary: controls.querySelector('[data-kmy-filter-select="secondary"]'),
      title: controls.querySelector('[data-kmy-filter-select="title"]'),
    };
    const status = controls.querySelector("[data-kmy-status]");
    const reset = controls.querySelector("[data-kmy-reset]");
    const empty = document.querySelector(`[data-kmy-empty="${type}"]`);
    const state = {
      field: ALL_VALUE,
      secondary: ALL_VALUE,
      title: ALL_VALUE,
    };

    if (!items.length || !selects.field || !selects.secondary || !selects.title) return;

    Object.values(selects).forEach((select) => addOption(select, ALL_VALUE));
    unique(items.map((item) => item.field)).forEach((field) => addOption(selects.field, field));
    unique(items.flatMap((item) => item.secondaryFields)).forEach((secondary) => addOption(selects.secondary, secondary));
    unique(items.map((item) => item.title)).forEach((title) => addOption(selects.title, title));

    const render = () => {
      const matchingItems = items.filter((item) => {
        const fieldMatch = state.field === ALL_VALUE || item.field === state.field;
        const secondaryMatch = state.secondary === ALL_VALUE || item.secondaryFields.includes(state.secondary);
        const titleMatch = state.title === ALL_VALUE || item.title === state.title;
        return fieldMatch && secondaryMatch && titleMatch;
      });
      const visibleItems = new Set(matchingItems);
      items.forEach((item) => setVisible(item.element, visibleItems.has(item)));
      setVisible(empty, matchingItems.length === 0);
      updateStatus(status, matchingItems.length, matchingItems.length === 0 ? 0 : 1, matchingItems.length);
    };

    Object.entries(selects).forEach(([key, select]) => {
      select.addEventListener("change", () => {
        state[key] = select.value || ALL_VALUE;
        render();
      });
    });

    reset?.addEventListener("click", () => {
      Object.entries(selects).forEach(([key, select]) => {
        state[key] = ALL_VALUE;
        select.value = ALL_VALUE;
      });
      render();
    });

    controls.hidden = false;
    render();
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTaggedList("news");
    initTaggedList("works");
    initArtistsList();
  });
})();
