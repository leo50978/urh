import { db } from "./firebase-init.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const NAVBAR_DOC_ID = "main";

export default class NavbarSecond {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.unsubscribe = null;
    this.onResizeBound = this.updateTopOffset.bind(this);
    this.onScrollBound = this.updateTopOffset.bind(this);

    if (!this.root) return;
    this.init();
  }

  init() {
    this.injectStyles();
    this.fetchData();
    window.addEventListener("resize", this.onResizeBound);
    window.addEventListener("scroll", this.onScrollBound, { passive: true });
  }

  injectStyles() {
    if (document.getElementById("sierra-navbar-second-style")) return;

    const style = document.createElement("style");
    style.id = "sierra-navbar-second-style";
    style.textContent = `
      .sierra-navbar-second {
        display: none;
        width: 100%;
        overflow-x: auto;
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        z-index: 45;
        background: linear-gradient(92deg, rgba(246, 251, 248, 0.78) 0%, rgba(237, 246, 240, 0.72) 50%, rgba(246, 251, 248, 0.78) 100%);
        border-top: 1px solid rgba(255, 255, 255, 0.55);
        border-bottom: 1px solid rgba(79, 102, 85, 0.24);
        backdrop-filter: blur(14px) saturate(126%);
        -webkit-backdrop-filter: blur(14px) saturate(126%);
        box-shadow: 0 10px 24px rgba(95, 117, 103, 0.16);
        transition: top 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
      }
      .sierra-navbar-second.sierra-navbar-second-top {
        background: rgba(252, 255, 253, 0.92);
        border-top-color: rgba(255, 255, 255, 0.82);
        border-bottom-color: rgba(167, 181, 171, 0.42);
        box-shadow: 0 10px 24px rgba(90, 113, 98, 0.18);
      }
      .sierra-navbar-second-track {
        display: inline-flex;
        min-width: 100%;
        align-items: center;
        justify-content: center;
        gap: 1.75rem;
        padding: 0.85rem 1.25rem;
      }
      .sierra-navbar-second-link {
        white-space: nowrap;
        font-size: clamp(1rem, 0.95rem + 0.22vw, 1.08rem);
        line-height: 1.35;
        font-weight: 600;
        letter-spacing: 0.01em;
        color: #18261d;
        border: none;
        padding: 0.75rem 0.35rem;
        min-height: 44px;
        background: transparent;
        text-decoration: none;
        transition: color 160ms ease, transform 160ms ease, opacity 160ms ease;
      }
      .sierra-navbar-second-link:hover {
        color: #0d1711;
        transform: translateY(-1px);
      }
      .sierra-navbar-second-link:focus-visible {
        outline: 2px solid #1b6b41;
        outline-offset: 2px;
        border-radius: 0.25rem;
      }
      @media (min-width: 768px) {
        .sierra-navbar-second {
          display: block;
        }
      }
    `;
    document.head.appendChild(style);
  }

  fetchData() {
    const navbarDocRef = doc(db, "navbar", NAVBAR_DOC_ID);
    this.unsubscribe = onSnapshot(navbarDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        this.root.innerHTML = "";
        return;
      }
      this.render(snapshot.data());
    });
  }

  render(data) {
    const secondaryLinks = Array.isArray(data?.secondaryNavLinks)
      ? data.secondaryNavLinks.map((item) => {
          if (typeof item === "string") return item.trim();
          return (item?.name || item?.label || item?.title || "").trim();
        }).filter(Boolean)
      : [];

    if (!secondaryLinks.length) {
      this.root.innerHTML = "";
      return;
    }

    const linksHtml = secondaryLinks
      .map((name) => `<button type="button" data-category="${name}" class="sierra-navbar-second-link">${name}</button>`)
      .join("");

    this.root.innerHTML = `
      <nav class="sierra-navbar-second">
        <div class="sierra-navbar-second-track">
          ${linksHtml}
        </div>
      </nav>
    `;
    this.updateTopOffset();

    const nav = this.root.querySelector(".sierra-navbar-second");
    if (nav) {
      nav.addEventListener("mouseleave", () => {
        window.dispatchEvent(new CustomEvent("sierra:secondary-nav-leave"));
      });
    }

    this.root.querySelectorAll("[data-category]").forEach((button) => {
      const dispatchCategory = (trigger) => {
        const category = button.dataset.category || "";
        window.dispatchEvent(new CustomEvent("sierra:secondary-category-hover", { detail: { category, trigger } }));
      };

      button.addEventListener("mouseenter", () => {
        dispatchCategory("hover");
      });

      button.addEventListener("click", () => {
        dispatchCategory("click");
      });
    });
  }

  updateTopOffset() {
    const nav = this.root.querySelector(".sierra-navbar-second");
    if (!nav) return;
    const mainNavbarRoot = document.getElementById("sierra-navbar-root");
    const mainNavbarHeight = mainNavbarRoot ? Math.max(0, Math.round(mainNavbarRoot.getBoundingClientRect().height)) : 0;
    const atTop = (window.scrollY || 0) <= 4;
    const topOffset = atTop ? mainNavbarHeight : 0;
    nav.style.top = `${topOffset}px`;
    nav.classList.toggle("sierra-navbar-second-top", !atTop);
  }
}
