import { db } from "./firebase-init.js";
import {
  collection,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const NAVBAR_DOC_ID = "main";

function normalizeCategoryName(item) {
  if (!item) return "";
  if (typeof item === "string") return item.trim();
  return (item.name || item.label || item.title || "").trim();
}

export default class MegaMenu {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.state = { categories: [], pages: [] };
    this.activeCategory = "";
    this.isOpen = false;
    this.persistOpen = false;
    this.unsubs = [];
    this.closeTimer = null;
    if (!this.root) return;
    this.init();
  }

  init() {
    this.injectStyles();
    this.bindEvents();
    this.subscribeData();
  }

  injectStyles() {
    if (document.getElementById("sierra-mega-menu-style")) return;
    const style = document.createElement("style");
    style.id = "sierra-mega-menu-style";
    style.textContent = `
      .sierra-mega-menu { display: none; }
      .sierra-mega-panel {
        border-top: 1px solid rgba(255, 255, 255, 0.6);
        background: linear-gradient(160deg, rgba(236, 244, 238, 0.88) 0%, rgba(223, 235, 226, 0.86) 46%, rgba(215, 229, 219, 0.86) 100%);
        backdrop-filter: blur(18px) saturate(130%);
        -webkit-backdrop-filter: blur(18px) saturate(130%);
      }
      .sierra-mega-close {
        border: 1px solid rgba(255, 255, 255, 0.65);
        background: rgba(250, 253, 251, 0.72);
        box-shadow:
          8px 8px 16px rgba(123, 143, 128, 0.26),
          -6px -6px 14px rgba(255, 255, 255, 0.8);
      }
      .sierra-mega-card {
        border: 1px solid rgba(255, 255, 255, 0.62);
        background: rgba(250, 253, 251, 0.62);
        box-shadow:
          12px 12px 22px rgba(125, 145, 131, 0.2),
          -8px -8px 16px rgba(255, 255, 255, 0.78),
          inset 0 1px 0 rgba(255, 255, 255, 0.86);
      }
      .sierra-mega-page-link {
        color: #1f2a22;
      }
      .sierra-mega-section-link {
        color: #526157;
      }
      .sierra-mega-section-link:hover {
        color: #1f2a22;
      }
      @media (min-width: 1024px) {
        .sierra-mega-menu.sierra-open { display: block; }
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    window.addEventListener("scroll", () => {
      if (!this.isOpen) return;
      this.render();
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (!this.isOpen) return;
      this.render();
    });

    window.addEventListener("sierra:secondary-category-hover", (event) => {
      this.cancelClose();
      this.activeCategory = event.detail?.category || "";
      this.persistOpen = event.detail?.trigger === "click";
      this.isOpen = true;
      this.render();
    });

    window.addEventListener("sierra:secondary-nav-leave", () => {
      if (this.persistOpen) return;
      this.scheduleClose();
    });

    this.root.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      this.hide();
    });
  }

  subscribeData() {
    const navbarRef = doc(db, "navbar", NAVBAR_DOC_ID);
    this.unsubs.push(onSnapshot(navbarRef, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      this.state.categories = Array.isArray(data.secondaryNavLinks)
        ? data.secondaryNavLinks.map(normalizeCategoryName).filter(Boolean)
        : [];
      if (!this.activeCategory && this.state.categories.length) {
        this.activeCategory = this.state.categories[0];
      }
      if (this.isOpen) this.render();
    }));

    const pagesRef = collection(db, "pages");
    this.unsubs.push(onSnapshot(pagesRef, (snapshot) => {
      this.state.pages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (this.isOpen) this.render();
    }));
  }

  render() {
    if (!this.isOpen) {
      this.root.innerHTML = "";
      return;
    }

    const category = this.activeCategory;
    if (!category) {
      this.root.innerHTML = "";
      return;
    }

    const pages = this.state.pages.filter((page) => (page.category || "") === category);
    const cards = pages.map((page) => {
      const sections = Array.isArray(page.sections) ? page.sections : [];
      const lines = sections
        .map((section) => `<a href="./index.html?page=${page.id}#${section.id || ""}" class="sierra-mega-section-link block truncate text-sm">${section.title || section.id || ""}</a>`)
        .join("");

      return `
        <article class="sierra-mega-card rounded-xl p-4">
          <a href="./index.html?page=${page.id}" class="sierra-mega-page-link mb-2 block truncate text-sm font-semibold">${page.title || page.id}</a>
          <div class="space-y-1">${lines || '<p class="text-sm text-stone-500">Aucune section</p>'}</div>
        </article>
      `;
    }).join("");
    const topOffset = this.getHeaderBottom();

    this.root.innerHTML = `
      <section
        class="sierra-mega-menu sierra-mega-panel sierra-open left-0 right-0 z-[70] overflow-auto px-5 py-5"
        style="position:fixed;top:${topOffset}px;height:calc(100vh - ${topOffset}px);"
      >
        <div class="mx-auto flex max-w-7xl items-center justify-end pb-3">
          <button type="button" data-action="close-mega" class="sierra-mega-close inline-flex h-10 w-10 items-center justify-center rounded-full text-base text-[#2f4737] transition hover:bg-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="mx-auto grid max-w-7xl grid-cols-4 gap-3">
          ${cards || '<p class="col-span-full text-sm text-stone-500">Aucune page pour cette catégorie.</p>'}
        </div>
      </section>
    `;

    const closeBtn = this.root.querySelector('[data-action="close-mega"]');
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.hide();
      });
    }

    const panel = this.root.querySelector(".sierra-mega-menu");
    if (panel) {
      panel.addEventListener("mouseenter", () => this.cancelClose());
      panel.addEventListener("mouseleave", () => {
        if (this.persistOpen) return;
        this.hide();
      });
    }
  }

  getHeaderBottom() {
    const secondaryNav = document.querySelector(".sierra-navbar-second");
    if (secondaryNav) {
      const secondaryRect = secondaryNav.getBoundingClientRect();
      return Math.max(0, Math.round(secondaryRect.bottom));
    }

    const headerRoot = document.getElementById("sierra-header-root");
    if (!headerRoot) return 0;
    const headerRect = headerRoot.getBoundingClientRect();
    return Math.max(0, Math.round(headerRect.bottom));
  }

  scheduleClose() {
    this.cancelClose();
    this.closeTimer = setTimeout(() => this.hide(), 120);
  }

  cancelClose() {
    if (!this.closeTimer) return;
    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  hide() {
    this.cancelClose();
    this.isOpen = false;
    this.persistOpen = false;
    this.root.innerHTML = "";
  }
}
