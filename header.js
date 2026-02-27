export default class HeaderComponent {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.navbarRootId = "sierra-navbar-root";
    this.navbarSecondRootId = "sierra-navbar-second-root";
    this.megaMenuRootId = "sierra-mega-menu-root";
    this.mobileMenuRootId = "sierra-mobile-menu-root";
    this.onHeaderResizeBound = this.updateMobileHeaderOffset.bind(this);
    this.mobileHeaderObserver = null;

    if (!this.root) {
      console.error(`Header root introuvable: ${rootId}`);
      return;
    }

    this.init();
  }

  async init() {
    this.injectHeaderStyles();
    this.render();
    this.setupMobileFixedHeader();

    if (this.isGeneratedPageView()) {
      this.clearHomepageRoots();
      await this.loadNavbar();
      await this.loadNavbarSecond();
      await this.loadMobileMenu();
      await this.loadPages();
      await this.loadFooter();
      return;
    }

    await this.loadNavbar();
    await this.loadNavbarSecond();
    await this.loadMegaMenu();
    await this.loadMobileMenu();
    await this.loadPages();
    await this.loadNews();
    await this.loadSection3();
    await this.loadGallery();
    await this.loadGallery2();
    await this.loadCreatSection();
    await this.loadFooter();
  }

  isGeneratedPageView() {
    const qs = new URLSearchParams(window.location.search);
    return Boolean(qs.get("page"));
  }

  clearHomepageRoots() {
    const ids = [
      "sierra-news-root",
      "sierra-section3-root",
      "sierra-gallery-root",
      "sierra-gallery2-root",
      "sierra-creatsection-root",
      this.megaMenuRootId
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
  }

  injectHeaderStyles() {
    if (document.getElementById("sierra-header-shell-style")) return;

    const style = document.createElement("style");
    style.id = "sierra-header-shell-style";
    style.textContent = `
      :root {
        --sierra-glass-bg: rgba(244, 249, 246, 0.46);
        --sierra-glass-border: rgba(255, 255, 255, 0.58);
        --sierra-soft-dark: rgba(117, 141, 123, 0.25);
        --sierra-soft-light: rgba(255, 255, 255, 0.78);
      }
      .sierra-header-shell {
        position: sticky;
        top: 0;
        z-index: 50;
        overflow: visible;
        background: linear-gradient(180deg, rgba(227, 238, 231, 0.72) 0%, rgba(240, 247, 243, 0.38) 100%);
        border-bottom: 1px solid rgba(79, 102, 85, 0.22);
        box-shadow:
          0 18px 40px rgba(55, 98, 74, 0.22),
          inset 0 1px 0 var(--sierra-soft-light),
          inset 0 -1px 0 rgba(79, 102, 85, 0.12);
        backdrop-filter: blur(18px) saturate(132%);
        -webkit-backdrop-filter: blur(18px) saturate(132%);
      }
      .sierra-header-shell::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(120deg, rgba(255, 255, 255, 0.36) 0%, rgba(255, 255, 255, 0.06) 55%, rgba(255, 255, 255, 0.24) 100%);
        mix-blend-mode: screen;
      }
      .sierra-header-mobile-spacer {
        display: none;
      }
      @media (max-width: 1023px) {
        .sierra-header-shell {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 70;
        }
        .sierra-header-mobile-spacer {
          display: block;
          width: 100%;
          height: var(--sierra-mobile-header-height, 86px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupMobileFixedHeader() {
    this.updateMobileHeaderOffset();
    window.addEventListener("resize", this.onHeaderResizeBound, { passive: true });
    window.addEventListener("orientationchange", this.onHeaderResizeBound, { passive: true });

    const shell = this.root.querySelector(".sierra-header-shell");
    if (shell && "ResizeObserver" in window) {
      this.mobileHeaderObserver = new ResizeObserver(() => this.updateMobileHeaderOffset());
      this.mobileHeaderObserver.observe(shell);
    }
  }

  updateMobileHeaderOffset() {
    const shell = this.root.querySelector(".sierra-header-shell");
    if (!shell) return;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const height = isMobile ? Math.max(0, Math.ceil(shell.getBoundingClientRect().height)) : 0;
    document.documentElement.style.setProperty("--sierra-mobile-header-height", `${height}px`);
  }

  render() {
    this.root.innerHTML = `
      <header class="sierra-header-shell w-full">
        <div id="${this.navbarRootId}"></div>
      </header>
      <div class="sierra-header-mobile-spacer" aria-hidden="true"></div>
      <div id="${this.mobileMenuRootId}"></div>
      <div id="${this.navbarSecondRootId}"></div>
      <div id="${this.megaMenuRootId}"></div>
    `;
  }

  async loadNavbar() {
    try {
      const module = await import("./navbar.js");
      const navbarRoot = document.getElementById(this.navbarRootId);
      if (!navbarRoot) return;
      new module.default(this.navbarRootId);
    } catch (error) {
      console.error("Erreur navbar:", error);
    }
  }

  async loadNavbarSecond() {
    try {
      const module = await import("./navbarsecond.js");
      const navbarSecondRoot = document.getElementById(this.navbarSecondRootId);
      if (!navbarSecondRoot) return;
      new module.default(this.navbarSecondRootId);
    } catch (error) {
      console.error("Erreur navbarsecond:", error);
    }
  }

  async loadMegaMenu() {
    try {
      const module = await import("./mega-menu.js");
      const megaRoot = document.getElementById(this.megaMenuRootId);
      if (!megaRoot) return;
      new module.default(this.megaMenuRootId);
    } catch (error) {
      console.error("Erreur mega-menu:", error);
    }
  }

  async loadMobileMenu() {
    try {
      const module = await import("./mobilemenu.js");
      const mobileRoot = document.getElementById(this.mobileMenuRootId);
      if (!mobileRoot) return;
      new module.default(this.mobileMenuRootId);
    } catch (error) {
      console.error("Erreur mobilemenu:", error);
    }
  }

  async loadPages() {
    if (!document.getElementById("sierra-hero-root")) return;

    if (!this.isGeneratedPageView()) {
      try {
        const heroModule = await import("./her.js");
        new heroModule.default("sierra-hero-root");
      } catch (error) {
        console.error("Erreur her:", error);
      }
    }

    try {
      const pagesModule = await import("./pages.js");
      new pagesModule.default("sierra-hero-root");
    } catch (error) {
      console.error("Erreur pages:", error);
    }
  }

  async loadNews() {
    if (!document.getElementById("sierra-news-root")) return;

    try {
      const newsModule = await import("./news.js");
      new newsModule.default("sierra-news-root");
    } catch (error) {
      console.error("Erreur news:", error);
    }
  }

  async loadSection3() {
    if (!document.getElementById("sierra-section3-root")) return;

    try {
      const section3Module = await import("./section3.js");
      new section3Module.default("sierra-section3-root");
    } catch (error) {
      console.error("Erreur section3:", error);
    }
  }

  async loadGallery() {
    if (!document.getElementById("sierra-gallery-root")) return;

    try {
      const galleryModule = await import("./galery.js");
      new galleryModule.default("sierra-gallery-root");
    } catch (error) {
      console.error("Erreur gallery:", error);
    }
  }

  async loadGallery2() {
    if (!document.getElementById("sierra-gallery2-root")) return;

    try {
      const galleryModule = await import("./gallery2.js");
      new galleryModule.default("sierra-gallery2-root");
    } catch (error) {
      console.error("Erreur gallery2:", error);
    }
  }

  async loadCreatSection() {
    if (!document.getElementById("sierra-creatsection-root")) return;

    try {
      const module = await import("./creatsection.js");
      new module.default("sierra-creatsection-root");
    } catch (error) {
      console.error("Erreur creatsection:", error);
    }
  }

  async loadFooter() {
    if (!document.getElementById("sierra-footer-root")) return;

    try {
      const module = await import("./footer.js");
      new module.default("sierra-footer-root");
    } catch (error) {
      console.error("Erreur footer:", error);
    }
  }
}
