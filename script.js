/* ============================================================
   NIGHTQUILL — interaction layer
   ============================================================ */

(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const pad = (number) => String(number).padStart(2, "0");
  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[character];
    });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const artworks = Array.isArray(window.NQ_ARTWORKS) ? window.NQ_ARTWORKS.slice() : [];
  const featured = Array.isArray(window.NQ_FEATURED) ? window.NQ_FEATURED.slice() : [];
  const bySlug = new Map(artworks.map((item) => [item.slug, item]));
  const gsap = window.gsap || null;
  const ScrollTrigger = window.ScrollTrigger || null;

  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const thumb = (slug) => `assets/thumbs/${slug}.webp`;
  const full = (slug) => `assets/art/${slug}.webp`;

  let visibleArtworks = artworks.slice();
  let lightboxList = artworks.slice();
  let lightboxIndex = 0;
  let lightboxTrigger = null;
  let lightboxOpen = false;
  let menuOpen = false;
  const baseTitle = document.title;

  if (!artworks.length) {
    const preloader = $("#preloader");
    if (preloader) preloader.classList.add("is-done");
    body.classList.remove("is-loading");
    return;
  }

  /* ==========================================================
     3D featured coverflow
     ========================================================== */

  const coverflow = {
    index: 0,
    cards: [],
    timer: null,
    paused: false,
    dragged: false,
    startX: null,
    deltaX: 0
  };

  function buildCoverflow() {
    const stage = $("#coverflowStage");
    const total = $("#cfTotal");
    if (!stage) return;

    const items = featured.map((slug) => bySlug.get(slug)).filter(Boolean);
    if (!items.length) return;

    items.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "cover-card";
      card.dataset.index = String(index);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `View ${item.title}, ${item.label}`);
      card.innerHTML = `
        <div class="cover-card__inner">
          <div class="cover-card__frame">
            <img src="${thumb(item.slug)}" alt="NIGHTQUILL — ${esc(item.title)}, ${esc(item.label)}" width="${item.w}" height="${item.h}" draggable="false" ${index < 3 ? 'fetchpriority="high"' : 'loading="lazy"'}>
          </div>
          <div class="cover-card__mirror" aria-hidden="true" style="background-image:url('${thumb(item.slug)}')"></div>
        </div>`;
      stage.appendChild(card);
      coverflow.cards.push(card);

      card.addEventListener("click", () => {
        if (coverflow.dragged) return;
        if (index === coverflow.index) {
          openLightbox(item.slug);
        } else {
          setCover(index, true);
        }
      });

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (index === coverflow.index) openLightbox(item.slug);
          else setCover(index, true);
        }
      });
    });

    if (total) total.textContent = pad(items.length);
    updateCoverflow(false);
    startCoverflowAuto();

    const bar = $(".coverflow__bar");
    $(".hero__showcase")?.addEventListener("pointerenter", () => {
      coverflow.paused = true;
    });
    $(".hero__showcase")?.addEventListener("pointerleave", () => {
      coverflow.paused = false;
    });

    stage.addEventListener("focusin", () => {
      coverflow.paused = true;
    });
    stage.addEventListener("focusout", (event) => {
      if (!stage.contains(event.relatedTarget)) coverflow.paused = false;
    });

    if (bar) {
      bar.addEventListener("pointerenter", () => {
        coverflow.paused = true;
      });
      bar.addEventListener("pointerleave", () => {
        coverflow.paused = false;
      });
    }

    $("#cfPrev")?.addEventListener("click", () => setCover(coverflow.index - 1, true));
    $("#cfNext")?.addEventListener("click", () => setCover(coverflow.index + 1, true));

    initCoverflowDrag(stage);
    initCoverflowParallax();
  }

  function setCover(index, animate = true) {
    const count = coverflow.cards.length;
    if (!count) return;
    coverflow.index = ((index % count) + count) % count;
    updateCoverflow(animate);
    restartCoverflowAuto();
  }

  function updateCoverflow(animate = true) {
    const count = coverflow.cards.length;
    if (!count) return;
    const half = Math.floor(count / 2);
    const activeItem = featured.map((slug) => bySlug.get(slug)).filter(Boolean)[coverflow.index];

    coverflow.cards.forEach((card, index) => {
      let offset = index - coverflow.index;
      if (offset > half) offset -= count;
      if (offset < -half) offset += count;

      const distance = Math.abs(offset);
      const visible = distance <= 2;
      card.style.setProperty("--d", String(offset));
      card.style.setProperty("--ad", String(distance));
      card.style.zIndex = String(20 - distance);
      card.style.opacity = visible ? String(1 - distance * 0.06) : "0";
      card.style.pointerEvents = visible ? "auto" : "none";
      card.style.filter = `brightness(${Math.max(0.5, 1 - distance * 0.18)})`;
      card.style.transform = `translate(-50%, -50%) translateX(${offset * 54}%) translateZ(${distance * -110}px) rotateY(${offset * -26}deg) scale(${Math.max(0.72, 1 - distance * 0.055)})`;
      card.classList.toggle("is-active", offset === 0);
      card.setAttribute("aria-hidden", visible ? "false" : "true");
      card.tabIndex = visible ? 0 : -1;
    });

    const indexNode = $("#cfIndex");
    const titleNode = $("#cfTitle");
    const categoryNode = $("#cfCategory");
    if (indexNode) indexNode.textContent = pad(coverflow.index + 1);
    if (titleNode) titleNode.textContent = activeItem ? activeItem.title : "";
    if (categoryNode) categoryNode.textContent = activeItem ? activeItem.label : "";

    if (animate && gsap && !reduceMotion) {
      const captionNodes = [indexNode, titleNode, categoryNode].filter(Boolean);
      gsap.fromTo(
        captionNodes,
        { opacity: 0, y: 7 },
        { opacity: 1, y: 0, duration: 0.42, ease: "power2.out", stagger: 0.035, overwrite: true }
      );
    }
  }

  function startCoverflowAuto() {
    stopCoverflowAuto();
    if (reduceMotion) return;
    coverflow.timer = window.setInterval(() => {
      if (coverflow.paused || document.hidden) return;
      coverflow.index = (coverflow.index + 1) % coverflow.cards.length;
      updateCoverflow(true);
    }, 5600);
  }

  function stopCoverflowAuto() {
    if (coverflow.timer) {
      window.clearInterval(coverflow.timer);
      coverflow.timer = null;
    }
  }

  function restartCoverflowAuto() {
    startCoverflowAuto();
  }

  function initCoverflowDrag(stage) {
    stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      coverflow.startX = event.clientX;
      coverflow.deltaX = 0;
      coverflow.dragged = false;
      try {
        stage.setPointerCapture(event.pointerId);
      } catch (error) {
        /* pointer capture is a progressive enhancement */
      }
    });

    stage.addEventListener("pointermove", (event) => {
      if (coverflow.startX === null) return;
      coverflow.deltaX = event.clientX - coverflow.startX;
      if (Math.abs(coverflow.deltaX) > 10) coverflow.dragged = true;
    });

    const endDrag = () => {
      if (coverflow.startX === null) return;
      const distance = coverflow.deltaX;
      coverflow.startX = null;
      coverflow.deltaX = 0;
      if (Math.abs(distance) > 44) {
        setCover(coverflow.index + (distance < 0 ? 1 : -1), true);
        coverflow.dragged = true;
        window.setTimeout(() => {
          coverflow.dragged = false;
        }, 60);
      }
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", () => {
      if (coverflow.startX !== null) endDrag();
    });
  }

  function initCoverflowParallax() {
    const showcase = $(".hero__showcase");
    const stage = $("#coverflowStage");
    if (!showcase || !stage || !finePointer || reduceMotion) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;

    showcase.addEventListener("pointermove", (event) => {
      const rect = showcase.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width - 0.5;
      targetY = (event.clientY - rect.top) / rect.height - 0.5;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        stage.style.transform = `rotateX(${(-targetY * 2.6).toFixed(2)}deg) rotateY(${(targetX * 3.4).toFixed(2)}deg)`;
      });
    });

    showcase.addEventListener("pointerleave", () => {
      stage.style.transform = "";
    });
  }

  /* ==========================================================
     Artwork grid
     ========================================================== */

  function buildGallery() {
    const grid = $("#workGrid");
    if (!grid) return;

    const fragment = document.createDocumentFragment();

    artworks.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "work-card";
      card.dataset.category = item.category;
      card.dataset.slug = item.slug;
      card.style.setProperty("--accent", item.accent);
      card.innerHTML = `
        <button class="work-card__open" type="button" data-open="${esc(item.slug)}" aria-label="View ${esc(item.title)}, ${esc(item.label)}">
          <span class="work-card__frame">
            <span class="work-card__media">
              <img src="${thumb(item.slug)}" alt="NIGHTQUILL — ${esc(item.title)}, ${esc(item.label)}" width="${item.w}" height="${item.h}" loading="lazy" decoding="async">
              <span class="work-card__sheen" aria-hidden="true"></span>
              <span class="work-card__view" aria-hidden="true">View piece
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.2 4H12v6.8"/></svg>
              </span>
            </span>
          </span>
          <span class="work-card__meta">
            <span class="work-card__meta-left">
              <span class="work-card__index">${pad(index + 1)}</span>
              <span class="work-card__title">${esc(item.title)}</span>
              <span class="work-card__tag"><i></i>${esc(item.label)}</span>
            </span>
          </span>
        </button>`;
      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
    updateFilterCounts();
    applyFilter("all", false, false);
    initCardTilt();
  }

  function updateFilterCounts() {
    const counts = { all: artworks.length };
    artworks.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    $$(".filter").forEach((button) => {
      const count = $(".filter__count", button);
      if (count && counts[button.dataset.filter] !== undefined) {
        count.textContent = String(counts[button.dataset.filter]);
      }
    });
  }

  function applyFilter(filter, animate = true, refresh = true) {
    const grid = $("#workGrid");
    if (!grid) return;

    $$(".filter").forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const cards = $$(".work-card", grid);
    cards.forEach((card) => {
      const show = filter === "all" || card.dataset.category === filter;
      card.hidden = !show;
    });

    visibleArtworks = artworks.filter((item) => filter === "all" || item.category === filter);
    const shown = cards.filter((card) => !card.hidden);
    const shownNode = $("#workShown");
    if (shownNode) {
      shownNode.textContent = `${visibleArtworks.length} ${visibleArtworks.length === 1 ? "work" : "works"}`;
    }

    if (gsap) gsap.killTweensOf(shown);

    if (animate && !reduceMotion && gsap && shown.length) {
      gsap.fromTo(
        shown,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.035, overwrite: true }
      );
    } else if (gsap) {
      gsap.set(shown, { opacity: 1, y: 0 });
    }

    if (refresh && ScrollTrigger) {
      window.setTimeout(() => ScrollTrigger.refresh(), 80);
    }
  }

  function initFilters() {
    $$(".filter").forEach((button) => {
      button.addEventListener("click", () => applyFilter(button.dataset.filter || "all"));
    });

    $$("[data-goto-filter]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        applyFilter(link.dataset.gotoFilter || "all");
        const work = $("#work");
        if (work) work.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    });
  }

  function initCardTilt() {
    const grid = $("#workGrid");
    if (!grid || !finePointer || reduceMotion) return;

    grid.addEventListener("pointermove", (event) => {
      const card = event.target.closest(".work-card");
      if (!card) return;
      const open = $(".work-card__open", card);
      if (!open) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      const rotateX = (0.5 - y) * 4.2;
      const rotateY = (x - 0.5) * 5.2;
      open.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
    });

    grid.addEventListener("pointerout", (event) => {
      const card = event.target.closest(".work-card");
      if (!card || card.contains(event.relatedTarget)) return;
      const open = $(".work-card__open", card);
      if (open) open.style.transform = "";
    });
  }

  /* ==========================================================
     Lightbox
     ========================================================== */

  const lightbox = $("#lightbox");
  const lightboxMedia = $("#lbMedia");
  const lightboxImage = $("#lbImage");
  const lightboxLoading = $("#lbLoading");
  const lightboxCategory = $("#lbCategory");
  const lightboxCount = $("#lbCount");
  const lightboxTitle = $("#lbTitle");
  const lightboxDesc = $("#lbDesc");
  const lightboxLabel = $("#lbLabel");
  const lightboxClose = $(".lightbox__close", lightbox || document);

  function openLightbox(slug) {
    if (!lightbox) return;
    const item = bySlug.get(slug);
    if (!item) return;

    const withinVisible = visibleArtworks.some((artwork) => artwork.slug === slug);
    lightboxList = withinVisible ? visibleArtworks.slice() : artworks.slice();
    lightboxIndex = lightboxList.findIndex((artwork) => artwork.slug === slug);
    if (lightboxIndex < 0) lightboxIndex = 0;

    lightboxTrigger = document.activeElement;
    renderLightbox();

    if (menuOpen) closeMenu();
    lightboxOpen = true;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    body.classList.add("is-locked");
    document.title = `${item.title} — NIGHTQUILL`;

    window.setTimeout(() => {
      lightboxClose?.focus({ preventScroll: true });
    }, 90);
  }

  function renderLightbox() {
    const item = lightboxList[lightboxIndex];
    if (!item || !lightboxImage) return;

    lightboxMedia?.classList.remove("is-ready");
    if (lightboxLoading) lightboxLoading.textContent = "Loading artwork";
    lightboxImage.setAttribute("src", full(item.slug));
    lightboxImage.setAttribute("alt", `NIGHTQUILL — ${item.title}, ${item.label}`);
    lightboxImage.style.opacity = "0";

    const requested = lightboxImage.getAttribute("src");
    lightboxImage.onload = () => {
      if (lightboxImage.getAttribute("src") === requested) {
        lightboxMedia?.classList.add("is-ready");
        lightboxImage.style.opacity = "";
      }
    };
    lightboxImage.onerror = () => {
      if (lightboxLoading) lightboxLoading.textContent = "Artwork unavailable";
    };

    if (lightboxCategory) lightboxCategory.textContent = item.label;
    if (lightboxTitle) lightboxTitle.textContent = item.title;
    if (lightboxDesc) lightboxDesc.textContent = item.desc;
    if (lightboxLabel) lightboxLabel.textContent = item.label;
    if (lightboxCount) lightboxCount.textContent = `${pad(lightboxIndex + 1)} / ${pad(lightboxList.length)}`;
    if (lightbox) lightbox.style.setProperty("--accent", item.accent);

    if (lightboxImage.complete && lightboxImage.naturalWidth > 0) {
      lightboxMedia?.classList.add("is-ready");
      lightboxImage.style.opacity = "";
    }
  }

  function closeLightbox() {
    if (!lightbox || !lightboxOpen) return;
    lightboxOpen = false;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    if (!menuOpen) body.classList.remove("is-locked");
    document.title = baseTitle;
    if (lightboxTrigger && typeof lightboxTrigger.focus === "function") {
      lightboxTrigger.focus({ preventScroll: true });
    }
  }

  function stepLightbox(direction) {
    if (!lightboxOpen || !lightboxList.length) return;
    lightboxIndex = (lightboxIndex + direction + lightboxList.length) % lightboxList.length;
    renderLightbox();
  }

  function initLightbox() {
    if (!lightbox) return;

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-open]");
      if (trigger) {
        event.preventDefault();
        openLightbox(trigger.dataset.open);
      }
    });

    lightbox.addEventListener("click", (event) => {
      if (event.target.closest("[data-lb-close]")) closeLightbox();
    });

    $("#lbPrev")?.addEventListener("click", () => stepLightbox(-1));
    $("#lbNext")?.addEventListener("click", () => stepLightbox(1));

    document.addEventListener("keydown", (event) => {
      if (!lightboxOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepLightbox(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepLightbox(1);
        return;
      }

      if (event.key === "Tab") {
        const focusable = [$(".lightbox__close", lightbox), $("#lbPrev"), $("#lbNext")].filter(Boolean);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ==========================================================
     Navigation, scroll progress & active section
     ========================================================== */

  function initNav() {
    const nav = $("#nav");
    const progressBar = $("#progressBar");
    const toTop = $("#toTop");
    const navLinks = $$(".nav__link");
    const sections = navLinks
      .map((link) => document.getElementById(link.dataset.section))
      .filter(Boolean);

    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY || window.pageYOffset || 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

      if (nav) nav.classList.toggle("is-scrolled", y > 20);
      if (progressBar) progressBar.style.width = `${(ratio * 100).toFixed(2)}%`;
      if (toTop) toTop.classList.toggle("is-visible", y > window.innerHeight * 0.75);

      let active = "";
      const marker = window.innerHeight * 0.36;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > marker) active = section.id;
      });
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.section === active);
      });
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    toTop?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ==========================================================
     Mobile menu
     ========================================================== */

  function initMenu() {
    const menu = $("#menu");
    const toggle = $("#menuToggle");
    if (!menu || !toggle) return;

    toggle.addEventListener("click", () => {
      if (menuOpen) closeMenu();
      else openMenu();
    });

    $$(".menu__link, .menu__foot a", menu).forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("keydown", (event) => {
      if (!menuOpen || lightboxOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key === "Tab") {
        const focusable = $$(".menu__link, .menu__foot a", menu);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth > 1060 && menuOpen) closeMenu();
      },
      { passive: true }
    );
  }

  function openMenu() {
    const menu = $("#menu");
    const toggle = $("#menuToggle");
    if (!menu || !toggle || menuOpen) return;

    menuOpen = true;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    toggle.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    body.classList.add("is-locked");

    window.setTimeout(() => {
      if (menuOpen) $(".menu__link", menu)?.focus({ preventScroll: true });
    }, 120);
  }

  function closeMenu() {
    const menu = $("#menu");
    const toggle = $("#menuToggle");
    if (!menu || !toggle || !menuOpen) return;

    menuOpen = false;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");

    if (!lightboxOpen) body.classList.remove("is-locked");
  }

  /* ==========================================================
     Custom cursor & magnetic buttons
     ========================================================== */

  function initCursor() {
    const cursor = $("#cursor");
    if (!cursor || !finePointer) return;

    root.classList.add("has-cursor");

    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    const label = $(".cursor__label", cursor);
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let frame = 0;
    let shown = false;

    const loop = () => {
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;
      if (ring) {
        ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;
      }
      if (Math.abs(pointerX - ringX) > 0.15 || Math.abs(pointerY - ringY) > 0.15) {
        frame = window.requestAnimationFrame(loop);
      } else {
        frame = 0;
      }
    };

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(loop);
    };

    document.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (!shown) {
          shown = true;
          ringX = pointerX;
          ringY = pointerY;
          cursor.style.opacity = "1";
        }

        if (dot) {
          dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
        }
        queue();
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", () => {
      shown = false;
      cursor.style.opacity = "0";
    });

    document.addEventListener(
      "pointerover",
      (event) => {
        if (!(event.target instanceof Element)) return;
        const view = event.target.closest(
          "[data-cursor='view'], .work-card__open, .cover-card, .feature__book"
        );
        const drag = event.target.closest(".coverflow__stage");
        const hover = event.target.closest("a, button, .discipline");

        cursor.classList.toggle("is-view", Boolean(view));
        cursor.classList.toggle("is-drag", Boolean(drag) && !view);
        cursor.classList.toggle("is-hover", Boolean(hover) && !view && !drag);

        if (label) {
          label.textContent = view
            ? view.dataset.cursorLabel || "View"
            : drag
              ? "Drag"
              : "";
        }
      },
      { passive: true }
    );

    const stage = $("#coverflowStage");
    if (stage) {
      stage.addEventListener("pointerdown", () => {
        cursor.classList.add("is-drag");
        if (label) label.textContent = "Drag";
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach((name) => {
        stage.addEventListener(name, () => {
          cursor.classList.remove("is-drag");
          if (label && !cursor.classList.contains("is-view")) label.textContent = "";
        });
      });
    }
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion || !gsap) return;

    $$(".magnetic").forEach((element) => {
      const moveX = gsap.quickTo(element, "x", { duration: 0.55, ease: "power3" });
      const moveY = gsap.quickTo(element, "y", { duration: 0.55, ease: "power3" });

      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        moveX((event.clientX - (rect.left + rect.width / 2)) * 0.18);
        moveY((event.clientY - (rect.top + rect.height / 2)) * 0.26);
      });

      element.addEventListener("pointerleave", () => {
        moveX(0);
        moveY(0);
      });
    });
  }

  function initDisciplineGlow() {
    $$(".discipline").forEach((element) => {
      element.addEventListener(
        "pointermove",
        (event) => {
          const rect = element.getBoundingClientRect();
          element.style.setProperty("--mx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
          element.style.setProperty("--my", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
        },
        { passive: true }
      );
    });
  }

  /* ==========================================================
     WebGL aurora — procedural luxury backdrop
     ========================================================== */

  function initAurora() {
    const canvas = $("#aurora");
    if (!canvas) return;

    const hero = canvas.closest(".hero");
    let gl = null;

    try {
      gl =
        canvas.getContext("webgl", {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: "high-performance"
        }) || canvas.getContext("experimental-webgl");
    } catch (error) {
      gl = null;
    }

    if (!gl) {
      hero?.classList.add("no-webgl");
      return;
    }

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision highp float;

      uniform vec2 u_res;
      uniform float u_time;
      uniform vec2 u_mouse;
      varying vec2 v_uv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.56;
        for (int i = 0; i < 4; i++) {
          value += amp * noise(p);
          p = p * 2.03 + vec2(11.7, 5.1);
          amp *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
        float t = u_time * 0.045;

        vec2 q = vec2(
          fbm(p * 1.35 + vec2(0.0, t)),
          fbm(p * 1.35 + vec2(4.8, -t))
        );

        vec2 r = vec2(
          fbm(p * 1.7 + 3.0 * q + vec2(1.4, 9.2) + 0.35 * t),
          fbm(p * 1.7 + 3.0 * q + vec2(8.3, 2.8) - 0.28 * t)
        );

        float f = fbm(p * 1.45 + 2.2 * r);

        vec3 col = vec3(0.028, 0.019, 0.055);
        col = mix(col, vec3(0.17, 0.06, 0.30), smoothstep(0.18, 0.92, f) * 0.9);
        col = mix(col, vec3(0.78, 0.18, 0.42), smoothstep(0.42, 0.95, r.x) * 0.4);
        col = mix(col, vec3(0.10, 0.54, 0.48), smoothstep(0.54, 0.98, q.y) * 0.22);
        col = mix(
          col,
          vec3(0.96, 0.72, 0.38),
          smoothstep(0.66, 1.02, f + 0.18 * sin(p.x * 2.4 + t * 5.0)) * 0.15
        );

        vec2 m = (u_mouse - 0.5) * u_res / min(u_res.x, u_res.y);
        float glow = exp(-length(p - m) * 2.6);
        col += vec3(0.55, 0.32, 0.62) * glow * 0.2;

        col *= 1.0 - smoothstep(0.55, 1.48, length(p * vec2(0.8, 1.05))) * 0.62;
        col *= mix(0.62, 1.12, smoothstep(-0.7, 0.9, p.x));
        col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.012;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      hero?.classList.add("no-webgl");
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      hero?.classList.add("no-webgl");
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      hero?.classList.add("no-webgl");
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resUniform = gl.getUniformLocation(program, "u_res");
    const timeUniform = gl.getUniformLocation(program, "u_time");
    const mouseUniform = gl.getUniformLocation(program, "u_mouse");

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0.03, 0.02, 0.06, 1);

    let width = 0;
    let height = 0;
    let running = false;
    let frame = 0;
    let heroVisible = true;
    let mouseX = 0.72;
    let mouseY = 0.52;
    let targetMouseX = 0.72;
    let targetMouseY = 0.52;

    const paint = (time) => {
      if (!resUniform || !timeUniform || !mouseUniform) return;
      gl.useProgram(program);
      gl.uniform2f(resUniform, width, height);
      gl.uniform1f(timeUniform, time);
      gl.uniform2f(mouseUniform, mouseX, mouseY);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1 : 1.25);
      const nextWidth = Math.max(1, Math.round(rect.width * dpr));
      const nextHeight = Math.max(1, Math.round(rect.height * dpr));

      if (nextWidth === width && nextHeight === height) return;

      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);

      if (!running) paint(reduceMotion ? 12 : performance.now() / 1000);
    };

    const draw = (time) => {
      if (!running) return;
      mouseX += (targetMouseX - mouseX) * 0.045;
      mouseY += (targetMouseY - mouseY) * 0.045;
      paint(time / 1000);
      frame = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      frame = window.requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    document.addEventListener(
      "pointermove",
      (event) => {
        targetMouseX = event.clientX / Math.max(1, window.innerWidth);
        targetMouseY = 1 - event.clientY / Math.max(1, window.innerHeight);
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (heroVisible) start();
    });

    if (typeof IntersectionObserver !== "undefined" && hero) {
      new IntersectionObserver(
        (entries) => {
          heroVisible = entries[0]?.isIntersecting ?? true;
          if (heroVisible && !document.hidden) start();
          else stop();
        },
        { threshold: 0 }
      ).observe(hero);
    }

    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      stop();
      hero?.classList.add("no-webgl");
    });

    resize();

    if (reduceMotion) {
      paint(12);
    } else {
      start();
    }
  }

  /* ==========================================================
     Preloader
     ========================================================== */

  function initPreloader(onDone) {
    const preloader = $("#preloader");
    if (!preloader) {
      onDone();
      return;
    }

    const bar = $("#preloaderBar");
    const percent = $("#preloaderPct");
    const urls = Array.from(new Set(featured.map((slug) => thumb(slug)))).filter(Boolean);
    const total = Math.max(urls.length, 1);
    const started = performance.now();
    const minimum = reduceMotion ? 240 : 1250;
    let loaded = 0;
    let progress = 0;
    let target = 7;
    let finished = false;
    let frame = 0;

    const paint = () => {
      if (bar) bar.style.width = `${progress.toFixed(1)}%`;
      if (percent) percent.textContent = pad(Math.min(99, Math.round(progress)));
    };

    const tick = () => {
      if (finished) return;
      progress += (target - progress) * 0.1;
      if (progress > target - 0.05) progress = target;
      if (progress > 99) progress = 99;
      paint();
      frame = window.requestAnimationFrame(tick);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      if (frame) window.cancelAnimationFrame(frame);
      progress = 100;
      paint();
      if (percent) percent.textContent = "100";
      body.classList.add("is-ready");

      window.setTimeout(
        () => {
          preloader.classList.add("is-done");
          preloader.setAttribute("aria-hidden", "true");
          body.classList.remove("is-loading");
          onDone();
        },
        reduceMotion ? 90 : 460
      );
    };

    paint();
    frame = window.requestAnimationFrame(tick);

    const images = urls.map(
      (url) =>
        new Promise((resolve) => {
          const image = new Image();
          let settled = false;
          const settle = () => {
            if (settled) return;
            settled = true;
            loaded += 1;
            target = Math.max(target, 8 + (loaded / total) * 82);
            resolve();
          };
          image.onload = settle;
          image.onerror = settle;
          image.src = url;
        })
    );

    const fontsReady =
      document.fonts && document.fonts.ready
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve();

    Promise.all([Promise.all(images), fontsReady]).then(() => {
      const elapsed = performance.now() - started;
      window.setTimeout(finish, Math.max(0, minimum - elapsed));
    });

    window.setTimeout(finish, 8000);
  }

  /* ==========================================================
     Hero intro & scroll reveals
     ========================================================== */

  function initHeroIntro() {
    body.classList.add("is-ready");

    if (!gsap || reduceMotion) return;

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    timeline
      .from(".nav", { y: -22, opacity: 0, duration: 0.8 }, 0)
      .from(".hero__eyebrow", { y: 16, opacity: 0, duration: 0.65 }, 0.1)
      .from(
        ".hero__line-inner",
        { yPercent: 118, duration: 1.15, stagger: 0.085, ease: "power4.out" },
        0.18
      )
      .from(".hero__lede", { y: 16, opacity: 0, duration: 0.75 }, 0.62)
      .from(".hero__actions", { y: 14, opacity: 0, duration: 0.7 }, 0.74)
      .from(".hero__meta", { y: 10, opacity: 0, duration: 0.6 }, 0.84)
      .from(
        ".hero__showcase",
        { opacity: 0, y: 30, scale: 0.96, duration: 1.2, ease: "power3.out" },
        0.3
      )
      .from(".hero__chip", { opacity: 0, y: 12, duration: 0.6, stagger: 0.08 }, 0.95)
      .from(".hero__scroll", { opacity: 0, duration: 0.6 }, 1.05);
  }

  function initReveals() {
    if (!gsap || !ScrollTrigger || reduceMotion) {
      if (ScrollTrigger) ScrollTrigger.refresh();
      return;
    }

    const reveal = (targets, options = {}) => {
      const elements = targets instanceof Element ? [targets] : $$(targets);
      if (!elements.length) return;

      const config = {
        y: options.y == null ? 30 : options.y,
        opacity: 0,
        duration: options.duration == null ? 0.9 : options.duration,
        ease: "power3.out",
        stagger: options.stagger || 0,
        delay: options.delay || 0,
        scrollTrigger: {
          trigger: options.trigger || elements[0],
          start: options.start || "top 88%",
          once: true
        }
      };

      if (options.clearTransform) config.clearProps = "transform";

      gsap.from(elements, config);
    };

    $$(".section-head").forEach((head) => reveal(head));

    reveal(".feature__panel", { y: 36, duration: 1.05 });
    reveal(".disciplines__grid .discipline", {
      trigger: $(".disciplines__grid"),
      y: 26,
      stagger: 0.08,
      clearTransform: true
    });
    reveal(".studio__title", { y: 26 });
    reveal(".studio__side", { y: 26, delay: 0.08 });
    reveal(".studio__values .value", {
      trigger: $(".studio__values"),
      y: 22,
      stagger: 0.09
    });
    reveal(".cta__inner > :not(.cta__stamp)", {
      trigger: $(".cta"),
      y: 28,
      stagger: 0.07,
      duration: 0.85
    });
    reveal(".cta__stamp", { trigger: $(".cta"), y: 0, duration: 0.9 });
    reveal(".footer__top", { y: 20, start: "top 94%" });
    reveal(".footer__word", { y: 18, duration: 1.1, start: "top 96%" });

    gsap.to(".hero__copy", {
      yPercent: -6,
      opacity: 0.5,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    window.setTimeout(() => ScrollTrigger.refresh(), 320);
  }

  /* ==========================================================
     Boot
     ========================================================== */

  function boot() {
    buildCoverflow();
    buildGallery();
    initFilters();
    initLightbox();
    initNav();
    initMenu();
    initCursor();
    initMagnetic();
    initDisciplineGlow();
    initAurora();

    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    initPreloader(() => {
      initHeroIntro();
      initReveals();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
