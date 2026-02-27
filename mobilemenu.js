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

export default class MobileMenu {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.state = {
      categories: [],
      pages: [],
      query: "",
      isOpen: false,
      openCategories: new Set(),
      openPages: new Set()
    };
    this.unsubs = [];
    if (!this.root) return;
    this.init();
  }

  init() {
    this.injectStyles();
    this.subscribeData();
    this.bindGlobalEvents();
  }

  injectStyles() {
    if (document.getElementById("sierra-mobile-menu-style")) return;
    const style = document.createElement("style");
    style.id = "sierra-mobile-menu-style";
    style.textContent = `
      .sierra-mobile-menu-panel {
        background: linear-gradient(160deg, rgba(236, 244, 238, 0.92) 0%, rgba(225, 236, 227, 0.9) 46%, rgba(214, 229, 218, 0.9) 100%);
        backdrop-filter: blur(16px) saturate(126%);
        -webkit-backdrop-filter: blur(16px) saturate(126%);
      }
      .sierra-mobile-menu-close {
        border: 1px solid rgba(255, 255, 255, 0.7);
        background: rgba(250, 253, 251, 0.75);
        box-shadow:
          8px 8px 16px rgba(120, 143, 126, 0.25),
          -6px -6px 14px rgba(255, 255, 255, 0.82);
      }
      .sierra-mobile-menu-search {
        border: 1px solid rgba(255, 255, 255, 0.64);
        background: rgba(250, 253, 251, 0.62);
        box-shadow:
          inset 3px 3px 10px rgba(130, 148, 135, 0.22),
          inset -4px -4px 10px rgba(255, 255, 255, 0.85);
      }
      .sierra-mobile-menu-category {
        border: 1px solid rgba(255, 255, 255, 0.64);
        background: rgba(249, 252, 250, 0.58);
        box-shadow:
          10px 10px 20px rgba(123, 143, 128, 0.2),
          -7px -7px 16px rgba(255, 255, 255, 0.78);
      }
      .sierra-mobile-menu-page {
        border: 1px solid rgba(255, 255, 255, 0.66);
        background: rgba(250, 253, 251, 0.75);
        box-shadow:
          6px 6px 12px rgba(125, 145, 130, 0.16),
          -5px -5px 12px rgba(255, 255, 255, 0.82);
      }
    `;
    document.head.appendChild(style);
  }

  subscribeData() {
    this.unsubs.push(onSnapshot(doc(db, "navbar", NAVBAR_DOC_ID), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      this.state.categories = Array.isArray(data.secondaryNavLinks)
        ? data.secondaryNavLinks.map(normalizeCategoryName).filter(Boolean)
        : [];
      this.render();
    }));

    this.unsubs.push(onSnapshot(collection(db, "pages"), (snapshot) => {
      this.state.pages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      this.render();
    }));
  }

  bindGlobalEvents() {
    window.addEventListener("sierra:mobilemenu-toggle", () => {
      this.state.isOpen = !this.state.isOpen;
      this.render();
    });
  }

  filteredPages(category) {
    const q = this.state.query.toLowerCase();
    return this.state.pages.filter((page) => {
      if ((page.category || "") !== category) return false;
      if (!q) return true;
      const title = (page.title || "").toLowerCase();
      const sections = Array.isArray(page.sections) ? page.sections : [];
      const hasSection = sections.some((s) => `${s.title || ""} ${s.id || ""}`.toLowerCase().includes(q));
      return title.includes(q) || hasSection || category.toLowerCase().includes(q);
    });
  }

  render() {
    const categoriesHtml = this.state.categories.map((category) => {
      const catKey = `cat:${category}`;
      const pages = this.filteredPages(category);
      const catOpen = this.state.openCategories.has(catKey);

      const pagesHtml = pages.map((page) => {
        const pageKey = `page:${page.id}`;
        const isOpen = this.state.openPages.has(pageKey);
        const sections = Array.isArray(page.sections) ? page.sections : [];
        return `
          <div class="sierra-mobile-menu-page rounded-lg">
            <button type="button" data-action="toggle-page" data-page="${page.id}" class="flex w-full items-center justify-between px-3 py-2 text-left text-sm">
              <span class="truncate">${page.title || page.id}</span>
              <i class="fa-solid ${isOpen ? "fa-chevron-up" : "fa-chevron-down"} text-xs"></i>
            </button>
            <div class="${isOpen ? "block" : "hidden"} space-y-1 border-t border-stone-100 px-3 py-2">
              ${sections.map((section) => `<a href="./index.html?page=${page.id}#${section.id || ""}" class="block text-xs text-stone-600 hover:text-stone-900">${section.title || section.id || ""}</a>`).join("") || '<p class="text-xs text-stone-500">Aucune section</p>'}
            </div>
          </div>
        `;
      }).join("");

      return `
        <div class="sierra-mobile-menu-category rounded-xl">
          <button type="button" data-action="toggle-category" data-category="${category}" class="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium">
            <span>${category}</span>
            <i class="fa-solid ${catOpen ? "fa-chevron-up" : "fa-chevron-down"} text-xs"></i>
          </button>
          <div class="${catOpen ? "block" : "hidden"} space-y-2 border-t border-stone-200 px-3 py-3">
            ${pagesHtml || '<p class="text-xs text-stone-500">Aucune page.</p>'}
          </div>
        </div>
      `;
    }).join("");

    this.root.innerHTML = `
      <aside data-mobile-menu-panel class="sierra-mobile-menu-panel ${this.state.isOpen ? "fixed" : "hidden"} inset-0 z-[80] md:hidden overflow-auto px-4 py-4">
        <div class="mx-auto flex max-w-xl items-center justify-end pb-3">
          <button type="button" data-action="close-mobile" class="sierra-mobile-menu-close inline-flex h-8 w-8 items-center justify-center rounded text-sm text-stone-700">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="sierra-mobile-menu-search mx-auto mb-3 flex max-w-xl items-center gap-2 rounded-md px-3 py-2">
          <i class="fa-solid fa-magnifying-glass text-xs text-stone-600"></i>
          <input data-action="search" type="text" class="w-full text-sm outline-none" placeholder="Rechercher une page ou section">
        </div>
        <div class="mx-auto max-w-xl space-y-2">
          ${categoriesHtml || '<p class="text-sm text-stone-500">Aucune catégorie.</p>'}
        </div>
      </aside>
    `;

    const searchInput = this.root.querySelector('[data-action="search"]');
    if (searchInput) {
      searchInput.value = this.state.query;
      searchInput.addEventListener("input", (event) => {
        this.state.query = event.target.value || "";
        this.render();
      });
    }

    this.root.querySelectorAll('[data-action="toggle-category"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = `cat:${btn.dataset.category || ""}`;
        if (this.state.openCategories.has(key)) this.state.openCategories.delete(key);
        else this.state.openCategories.add(key);
        this.render();
      });
    });

    this.root.querySelectorAll('[data-action="toggle-page"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = `page:${btn.dataset.page || ""}`;
        if (this.state.openPages.has(key)) this.state.openPages.delete(key);
        else this.state.openPages.add(key);
        this.render();
      });
    });

    const closeBtn = this.root.querySelector('[data-action="close-mobile"]');
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.state.isOpen = false;
        this.render();
      });
    }
  }
}
