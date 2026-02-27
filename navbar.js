import { db } from "./firebase-init.js";
import {
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function injectNavbarStyles() {
  if (document.getElementById("sierra-navbar-theme-style")) return;

  const style = document.createElement("style");
  style.id = "sierra-navbar-theme-style";
  style.textContent = `
    .sierra-navbar-theme {
      font-family: "Source Sans 3", sans-serif;
    }
    .sierra-navbar-surface {
      background: linear-gradient(180deg, rgba(244, 249, 246, 0.36) 0%, rgba(233, 242, 236, 0.2) 100%);
      border-bottom: 1px solid rgba(79, 102, 85, 0.14);
      backdrop-filter: blur(12px) saturate(130%);
      -webkit-backdrop-filter: blur(12px) saturate(130%);
    }
    .sierra-navbar-inner {
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 1.15rem;
      background: rgba(248, 252, 249, 0.5);
      box-shadow:
        10px 10px 22px rgba(125, 146, 132, 0.28),
        -8px -8px 18px rgba(255, 255, 255, 0.78),
        inset 0 1px 0 rgba(255, 255, 255, 0.85);
    }
    .sierra-navbar-logo-chip {
      border-radius: 999px;
      padding: 0.3rem 0.6rem;
      border: 1px solid rgba(255, 255, 255, 0.62);
      background: rgba(249, 252, 250, 0.52);
      box-shadow:
        6px 6px 14px rgba(126, 144, 129, 0.22),
        -5px -5px 12px rgba(255, 255, 255, 0.75);
    }
    .sierra-navbar-text {
      color: color-mix(in srgb, var(--navbar-primary-color) 70%, #1f2937 30%);
    }
    .sierra-navbar-link {
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      border: 1px solid transparent;
    }
    .sierra-navbar-link:hover {
      color: color-mix(in srgb, var(--navbar-primary-color) 78%, #111827 22%);
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.32);
      box-shadow:
        inset 3px 3px 8px rgba(137, 156, 141, 0.22),
        inset -3px -3px 8px rgba(255, 255, 255, 0.7);
    }
    .sierra-navbar-icon-btn {
      height: 2.15rem;
      width: 2.15rem;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.62);
      background: rgba(250, 253, 251, 0.62);
      box-shadow:
        6px 6px 12px rgba(123, 145, 129, 0.24),
        -4px -4px 10px rgba(255, 255, 255, 0.82);
    }
    .sierra-navbar-action:hover {
      color: color-mix(in srgb, var(--navbar-primary-color) 80%, #111827 20%);
    }
    .sierra-navbar-search {
      border: 1px solid rgba(255, 255, 255, 0.62);
      background: rgba(249, 252, 250, 0.5);
      box-shadow:
        inset 3px 3px 10px rgba(135, 151, 140, 0.24),
        inset -4px -4px 10px rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px) saturate(125%);
      -webkit-backdrop-filter: blur(8px) saturate(125%);
    }
    .sierra-mobile-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .sierra-desktop-search {
      display: none;
    }
    @media (min-width: 768px) {
      .sierra-mobile-actions {
        display: none;
      }
      .sierra-desktop-search {
        display: flex;
        align-items: center;
      }
    }
  `;
  document.head.appendChild(style);
}

const STATIC_NAVBAR_COLORS = {
  primary: "#4f6655",
  secondary: "#ddd2b0"
};
const NAVBAR_DOC_ID = "main";

export default class Navbar {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.unsubscribe = null;
    this.mobileMenuId = "sierra-navbar-mobile-menu-root";

    if (!this.root) return;
    this.init();
  }

  init() {
    injectNavbarStyles();
    this.fetchData();
  }

  fetchData() {
    const navbarDocRef = doc(db, "navbar", NAVBAR_DOC_ID);

    this.unsubscribe = onSnapshot(navbarDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        this.root.innerHTML = "";
        return;
      }

      const data = snapshot.data();
      this.render(data);
    });
  }

  render(data) {
    const {
      logoImageName,
      navLinks,
      searchIconClass,
      menuIconClass
    } = data || {};

    if (
      !logoImageName ||
      !Array.isArray(navLinks) ||
      !searchIconClass ||
      !menuIconClass
    ) {
      this.root.innerHTML = "";
      return;
    }

    const linksHtml = navLinks
      .filter((link) => link && link.label && link.url)
      .map(
        (link) => `
          <a
            href="${link.url}"
            class="sierra-navbar-link sierra-navbar-text text-lg font-medium tracking-[0.01em] transition-colors duration-200"
          >
            ${link.label}
          </a>
        `
      )
      .join("");

    if (!linksHtml) {
      this.root.innerHTML = "";
      return;
    }

    this.root.innerHTML = `
      <nav
        class="sierra-navbar-theme sierra-navbar-surface w-full"
        style="--navbar-primary-color: ${STATIC_NAVBAR_COLORS.primary}; --navbar-secondary-color: ${STATIC_NAVBAR_COLORS.secondary};"
      >
        <div class="navbar-inner sierra-navbar-inner relative mx-auto mt-2 flex w-[calc(100%-1rem)] max-w-7xl items-center justify-between px-4 py-3 md:mt-3 md:px-6 md:py-4">
          <div class="logo-slot flex items-center">
            <a href="./index.html" class="sierra-navbar-logo-chip inline-flex items-center">
              <img src="./${logoImageName}" alt="" class="h-10 w-auto object-contain md:h-12">
            </a>
          </div>

          <div class="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:flex">
            <div class="sierra-desktop-search">
              <label class="pointer-events-auto sierra-navbar-text sierra-navbar-search flex items-center gap-2 rounded-full px-3 py-2">
                <input
                  type="text"
                  class="w-44 bg-transparent text-sm outline-none placeholder:opacity-75"
                  placeholder="Rechercher..."
                >
                <i class="${searchIconClass} text-sm"></i>
              </label>
            </div>
          </div>

          <div class="hidden items-center gap-8 md:ml-auto md:flex md:justify-end">
            ${linksHtml}
          </div>

          <div class="actions-slot flex items-center gap-4 md:hidden md:gap-5">
            <div class="sierra-mobile-actions">
              <button type="button" class="sierra-navbar-action sierra-navbar-icon-btn sierra-navbar-text inline-flex text-lg transition-colors duration-200" aria-label="">
                <i class="${searchIconClass}"></i>
              </button>
              <button type="button" data-action="toggle-mobile-menu" class="sierra-navbar-action sierra-navbar-icon-btn sierra-navbar-text inline-flex text-lg transition-colors duration-200" aria-label="">
                <i class="${menuIconClass}"></i>
              </button>
            </div>
          </div>
        </div>

        <div id="${this.mobileMenuId}" class="hidden md:hidden"></div>
      </nav>
    `;

    const toggleBtn = this.root.querySelector('[data-action="toggle-mobile-menu"]');
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("sierra:mobilemenu-toggle"));
      });
    }
  }
}
