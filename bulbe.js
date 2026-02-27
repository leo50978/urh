const DASHBOARD_LINKS = [
  { href: "./dashboardhero.html", label: "Hero" },
  { href: "./creatpage.html", label: "Pages" },
  { href: "./creatsection.html", label: "Sections" },
  { href: "./ssection3.html", label: "Blocs" },
  { href: "./news.html", label: "Actualites" },
  { href: "./galerie.html", label: "Galerie 1" },
  { href: "./galerie2.html", label: "Galerie 2" },
  { href: "./navbaredit.html", label: "Navigation" },
  { href: "./footer.html", label: "Footer" }
];

function currentFileName() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1] || "";
}

export default class BulbeNavigation {
  constructor() {
    this.rootId = "sierra-dashboard-bulbe-root";
    this.styleId = "sierra-dashboard-bulbe-style";
    this.isOpen = false;
    this.currentFile = currentFileName();
    this.onDocumentClick = this.handleDocumentClick.bind(this);
    this.onKeyDown = this.handleKeyDown.bind(this);

    if (document.getElementById(this.rootId)) return;
    this.init();
  }

  init() {
    this.injectStyles();
    this.render();
    this.bindEvents();
  }

  injectStyles() {
    if (document.getElementById(this.styleId)) return;

    const style = document.createElement("style");
    style.id = this.styleId;
    style.textContent = `
      .sierra-dashboard-bulbe {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 90;
      }

      .sierra-dashboard-bulbe__button {
        width: 4.1rem;
        height: 4.1rem;
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        color: #f6fbf5;
        font: 700 0.86rem/1 "Source Sans 3", sans-serif;
        letter-spacing: 0.02em;
        background:
          radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.34), transparent 34%),
          linear-gradient(135deg, #1f6d4c 0%, #183f2b 52%, #102a1c 100%);
        box-shadow:
          0 20px 30px -18px rgba(10, 25, 16, 0.7),
          0 10px 18px -16px rgba(10, 25, 16, 0.45),
          inset 0 1px 1px rgba(255, 255, 255, 0.22);
        transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
      }

      .sierra-dashboard-bulbe__button:hover,
      .sierra-dashboard-bulbe__button:focus-visible {
        transform: translateY(-2px) scale(1.02);
        filter: saturate(1.08);
        outline: none;
      }

      .sierra-dashboard-bulbe__button span {
        display: block;
      }

      .sierra-dashboard-bulbe__button small {
        display: block;
        margin-top: 0.1rem;
        font-size: 0.64rem;
        font-weight: 600;
        opacity: 0.92;
      }

      .sierra-dashboard-bulbe__panel {
        position: absolute;
        right: 0;
        bottom: calc(100% + 0.9rem);
        width: min(22rem, calc(100vw - 2rem));
        border: 1px solid rgba(78, 95, 82, 0.22);
        border-radius: 1.15rem;
        padding: 0.9rem;
        background:
          linear-gradient(180deg, rgba(249, 252, 248, 0.98) 0%, rgba(242, 248, 243, 0.98) 100%);
        box-shadow:
          0 28px 60px -28px rgba(15, 23, 18, 0.62),
          0 18px 28px -24px rgba(15, 23, 18, 0.38);
        opacity: 0;
        transform: translateY(0.5rem) scale(0.98);
        pointer-events: none;
        transition: opacity 140ms ease, transform 140ms ease;
      }

      .sierra-dashboard-bulbe[data-open="true"] .sierra-dashboard-bulbe__panel {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .sierra-dashboard-bulbe__title {
        margin: 0;
        font: 700 0.98rem/1.3 "Source Sans 3", sans-serif;
        color: #142019;
      }

      .sierra-dashboard-bulbe__hint {
        margin: 0.25rem 0 0;
        font: 500 0.8rem/1.45 "Source Sans 3", sans-serif;
        color: #566458;
      }

      .sierra-dashboard-bulbe__list {
        margin: 0.85rem 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.45rem;
        max-height: min(60vh, 28rem);
        overflow: auto;
      }

      .sierra-dashboard-bulbe__link,
      .sierra-dashboard-bulbe__current {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        width: 100%;
        border-radius: 0.95rem;
        padding: 0.75rem 0.85rem;
        font: 600 0.9rem/1.35 "Source Sans 3", sans-serif;
        text-decoration: none;
      }

      .sierra-dashboard-bulbe__link {
        color: #183223;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(78, 95, 82, 0.12);
      }

      .sierra-dashboard-bulbe__link:hover,
      .sierra-dashboard-bulbe__link:focus-visible {
        outline: none;
        border-color: rgba(31, 109, 76, 0.28);
        background: rgba(255, 255, 255, 0.96);
      }

      .sierra-dashboard-bulbe__current {
        color: #f4fbf5;
        background: linear-gradient(135deg, #1c5f42 0%, #153825 100%);
        border: 1px solid rgba(21, 56, 37, 0.3);
      }

      .sierra-dashboard-bulbe__meta {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        opacity: 0.86;
      }

      @media (max-width: 640px) {
        .sierra-dashboard-bulbe {
          right: 0.85rem;
          bottom: 0.85rem;
        }

        .sierra-dashboard-bulbe__button {
          width: 3.7rem;
          height: 3.7rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  render() {
    const root = document.createElement("div");
    root.id = this.rootId;
    root.className = "sierra-dashboard-bulbe";
    root.dataset.open = "false";
    root.innerHTML = `
      <button
        type="button"
        class="sierra-dashboard-bulbe__button"
        aria-expanded="false"
        aria-controls="sierra-dashboard-bulbe-panel"
      >
        <span>Dash</span>
        <small>menu</small>
      </button>
      <div
        id="sierra-dashboard-bulbe-panel"
        class="sierra-dashboard-bulbe__panel"
        aria-hidden="true"
      >
        <p class="sierra-dashboard-bulbe__title">Naviguer entre les dashboards</p>
        <p class="sierra-dashboard-bulbe__hint">Cliquez sur un ecran pour y aller directement.</p>
        <ul class="sierra-dashboard-bulbe__list">
          ${this.renderLinks()}
        </ul>
      </div>
    `;

    document.body.appendChild(root);
    this.root = root;
    this.button = root.querySelector(".sierra-dashboard-bulbe__button");
    this.panel = root.querySelector(".sierra-dashboard-bulbe__panel");
  }

  renderLinks() {
    return DASHBOARD_LINKS.map((item) => {
      const fileName = item.href.replace("./", "");
      const isCurrent = fileName === this.currentFile;

      if (isCurrent) {
        return `
          <li>
            <div class="sierra-dashboard-bulbe__current">
              <span>${item.label}</span>
              <span class="sierra-dashboard-bulbe__meta">Ici</span>
            </div>
          </li>
        `;
      }

      return `
        <li>
          <a class="sierra-dashboard-bulbe__link" href="${item.href}">
            <span>${item.label}</span>
            <span class="sierra-dashboard-bulbe__meta">Ouvrir</span>
          </a>
        </li>
      `;
    }).join("");
  }

  bindEvents() {
    this.button.addEventListener("click", () => {
      this.setOpen(!this.isOpen);
    });

    document.addEventListener("click", this.onDocumentClick);
    document.addEventListener("keydown", this.onKeyDown);
  }

  handleDocumentClick(event) {
    if (!this.isOpen || !this.root) return;
    if (this.root.contains(event.target)) return;
    this.setOpen(false);
  }

  handleKeyDown(event) {
    if (event.key === "Escape" && this.isOpen) {
      this.setOpen(false);
      this.button?.focus();
    }
  }

  setOpen(nextState) {
    this.isOpen = Boolean(nextState);
    if (!this.root || !this.button || !this.panel) return;
    this.root.dataset.open = this.isOpen ? "true" : "false";
    this.button.setAttribute("aria-expanded", this.isOpen ? "true" : "false");
    this.panel.setAttribute("aria-hidden", this.isOpen ? "false" : "true");
  }
}
