import { db } from "./firebase-init.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FOOTER_COLLECTION = "footer";
const FOOTER_DOC_ID = "mainFooter";

const DEFAULT_FOOTER = {
  logo: "logo.png",
  universityName: "UNIVERSITE DE CHICAGO",
  institutionLabel: "L'Universite de Chicago",
  addressLine1: "Salle Edward H. Levi, 5801 S. Ellis Ave,",
  addressLine2: "Chicago, IL 60637",
  columns: [
    {
      id: "col_inst",
      title: "Liens institutionnels",
      links: [
        { id: "l1", label: "Titre IX", url: "/titre-ix" },
        { id: "l2", label: "Declaration de non-discrimination", url: "/non-discrimination" },
        { id: "l3", label: "Accreditation/Resolution de l'IBHE", url: "/accreditation" },
        { id: "l4", label: "Informations d'urgence", url: "/urgence" },
        { id: "l5", label: "Offres d'emploi", url: "/emplois" },
        { id: "l6", label: "Faites un cadeau", url: "/don" },
        { id: "l7", label: "Accessibilite", url: "/accessibilite" },
        { id: "l8", label: "Confidentialite", url: "/confidentialite" }
      ]
    },
    {
      id: "col_campus",
      title: "Liens campus",
      links: [
        { id: "c1", label: "Visitez l'Universite de Chicago", url: "/visiter" },
        { id: "c2", label: "Annuaire du campus", url: "/annuaire" },
        { id: "c3", label: "Contactez-nous", url: "/contact" },
        { id: "c4", label: "Cartes et itineraires", url: "/cartes" },
        { id: "c5", label: "Mon.UChicago", url: "/mon-uchicago" },
        { id: "c6", label: "Office 365", url: "/office-365" },
        { id: "c7", label: "Annonce AZ", url: "/annonce-az" }
      ]
    }
  ],
  social: {
    facebook: { enabled: true, url: "https://facebook.com" },
    instagram: { enabled: true, url: "https://instagram.com" },
    linkedin: { enabled: true, url: "https://linkedin.com" },
    x: { enabled: true, url: "https://x.com" },
    youtube: { enabled: true, url: "https://youtube.com" }
  },
  copyright: "©2026 Universite de Chicago"
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeLink(link = {}) {
  return {
    id: String(link.id || uid("link")),
    label: String(link.label || "").trim(),
    url: String(link.url || "").trim()
  };
}

function normalizeColumn(column = {}) {
  const links = Array.isArray(column.links) ? column.links.map(normalizeLink).filter((l) => l.label && l.url) : [];
  return {
    id: String(column.id || uid("col")),
    title: String(column.title || "").trim(),
    links
  };
}

function normalizeSocialEntry(raw) {
  if (typeof raw === "string") {
    const url = raw.trim();
    return { enabled: Boolean(url), url };
  }
  const url = String(raw?.url || "").trim();
  return {
    enabled: raw?.enabled === undefined ? Boolean(url) : Boolean(raw.enabled),
    url
  };
}

function normalizeFooter(data = {}) {
  const merged = {
    ...DEFAULT_FOOTER,
    ...data
  };

  const columns = Array.isArray(merged.columns)
    ? merged.columns.map(normalizeColumn).filter((c) => c.title || c.links.length)
    : [];

  return {
    logo: String(merged.logo || DEFAULT_FOOTER.logo).trim(),
    universityName: String(merged.universityName || DEFAULT_FOOTER.universityName).trim(),
    institutionLabel: String(merged.institutionLabel || DEFAULT_FOOTER.institutionLabel).trim(),
    addressLine1: String(merged.addressLine1 || DEFAULT_FOOTER.addressLine1).trim(),
    addressLine2: String(merged.addressLine2 || DEFAULT_FOOTER.addressLine2).trim(),
    columns: columns.length ? columns : DEFAULT_FOOTER.columns.map(normalizeColumn),
    social: {
      facebook: normalizeSocialEntry(merged.social?.facebook ?? DEFAULT_FOOTER.social.facebook),
      instagram: normalizeSocialEntry(merged.social?.instagram ?? DEFAULT_FOOTER.social.instagram),
      linkedin: normalizeSocialEntry(merged.social?.linkedin ?? DEFAULT_FOOTER.social.linkedin),
      x: normalizeSocialEntry(merged.social?.x ?? DEFAULT_FOOTER.social.x),
      youtube: normalizeSocialEntry(merged.social?.youtube ?? DEFAULT_FOOTER.social.youtube)
    },
    copyright: String(merged.copyright || DEFAULT_FOOTER.copyright).trim()
  };
}

function iconHtml(key) {
  const map = {
    facebook: '<i class="fa-brands fa-facebook-f" aria-hidden="true"></i>',
    instagram: '<i class="fa-brands fa-instagram" aria-hidden="true"></i>',
    linkedin: '<i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>',
    x: '<i class="fa-brands fa-x-twitter" aria-hidden="true"></i>',
    youtube: '<i class="fa-brands fa-youtube" aria-hidden="true"></i>'
  };
  return map[key] || "";
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripLabel(text = "", label = "") {
  const raw = String(label || "").trim();
  if (!raw) return String(text || "");
  const rx = new RegExp(escapeRegExp(raw), "gi");
  return String(text || "").replace(rx, "");
}

export default class InstitutionalFooter {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.unsubscribe = null;

    if (!this.root) return;
    this.init();
  }

  init() {
    this.injectStyles();
    this.subscribeData();
  }

  injectStyles() {
    if (document.getElementById("sierra-footer-style")) return;

    const style = document.createElement("style");
    style.id = "sierra-footer-style";
    style.textContent = `
      .sierra-footer {
        width: 100%;
        background: #2f473a;
        color: rgba(255, 255, 255, 0.85);
        margin-top: 3.5rem;
      }
      .sierra-footer-main {
        max-width: 1380px;
        margin: 0 auto;
        padding: 48px 24px;
      }
      .sierra-footer-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 32px;
      }
      .sierra-footer-logo-row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 12px;
        margin-bottom: 12px;
      }
      .sierra-footer-logo {
        width: 52px;
        height: 52px;
        object-fit: contain;
      }
      .sierra-footer-name {
        margin: 0;
        font-family: "Source Serif 4", serif;
        font-size: clamp(1.05rem, 1rem + 0.5vw, 1.45rem);
        line-height: 1.25;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.95);
      }
      .sierra-footer-addr {
        margin: 0;
        text-align: left;
        font-family: "Source Sans 3", sans-serif;
        font-size: 0.98rem;
        line-height: 1.62;
        color: rgba(255, 255, 255, 0.86);
      }
      .sierra-footer-col-title {
        margin: 0 0 12px;
        font-family: "Source Serif 4", serif;
        font-size: 1rem;
        letter-spacing: 0.03em;
        color: rgba(255, 255, 255, 0.92);
      }
      .sierra-footer-links {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .sierra-footer-links li + li {
        margin-top: 12px;
      }
      .sierra-footer-link {
        font-family: "Source Sans 3", sans-serif;
        font-size: 0.97rem;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.75);
        text-decoration: underline;
        text-decoration-color: rgba(255, 255, 255, 0.22);
        text-underline-offset: 0.18em;
        transition: color 180ms ease, text-decoration-color 180ms ease;
      }
      .sierra-footer-link:hover,
      .sierra-footer-link:focus-visible {
        color: rgba(255, 255, 255, 1);
        text-decoration-color: rgba(255, 255, 255, 0.78);
      }
      .sierra-footer-social {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .sierra-footer-social-link {
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        font-size: 20px;
        transition: color 180ms ease;
      }
      .sierra-footer-social-link:hover,
      .sierra-footer-social-link:focus-visible {
        color: rgba(255, 255, 255, 1);
      }
      .sierra-footer-bottom {
        border-top: 1px solid rgba(255, 255, 255, 0.18);
        padding: 16px 24px;
        text-align: center;
      }
      .sierra-footer-bottom p {
        margin: 0;
        font-family: "Source Sans 3", sans-serif;
        font-size: 0.83rem;
        color: rgba(255, 255, 255, 0.6);
      }
      @media (min-width: 1024px) {
        .sierra-footer-main {
          padding: 56px clamp(80px, 8vw, 120px);
        }
        .sierra-footer-grid {
          grid-template-columns: 1.2fr repeat(var(--sierra-footer-col-count), minmax(190px, 1fr)) auto;
          gap: clamp(44px, 6vw, 92px);
          align-items: start;
        }
        .sierra-footer-social-wrap {
          justify-self: end;
          align-self: start;
          padding-top: 4px;
        }
        .sierra-footer-social {
          justify-content: flex-end;
        }
      }
    `;

    document.head.appendChild(style);
  }

  subscribeData() {
    const ref = doc(db, FOOTER_COLLECTION, FOOTER_DOC_ID);
    this.unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      this.render(normalizeFooter(data));
    });
  }

  resolveUrl(url) {
    const raw = String(url || "").trim();
    if (!raw) return "#";
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return raw;
    if (raw.startsWith("./") || raw.startsWith("/") || raw.startsWith("#")) return raw;
    if (raw.startsWith("index.html") || raw.startsWith("news.html") || raw.startsWith("galerie.html") || raw.startsWith("galerie2.html")) return `./${raw}`;
    return `./index.html?page=${encodeURIComponent(raw)}`;
  }

  render(data) {
    if (!data) {
      this.root.innerHTML = "";
      return;
    }

    const columns = Array.isArray(data.columns) ? data.columns : [];
    const columnsHtml = columns.map((col) => {
      const links = Array.isArray(col.links) ? col.links : [];
      const linksHtml = links.map((link) => `
        <li>
          <a class="sierra-footer-link" href="${this.resolveUrl(link.url)}">${link.label}</a>
        </li>
      `).join("");

      return `
        <section>
          <h3 class="sierra-footer-col-title">${col.title || "Liens"}</h3>
          <ul class="sierra-footer-links">${linksHtml}</ul>
        </section>
      `;
    }).join("");

    const socials = ["facebook", "instagram", "linkedin", "x", "youtube"]
      .map((key) => ({ key, ...normalizeSocialEntry(data.social?.[key]) }))
      .filter((item) => item.enabled && item.url);

    const socialHtml = socials.map((item) => `
      <a class="sierra-footer-social-link" href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="${item.key}">
        ${iconHtml(item.key)}
      </a>
    `).join("");

    const footerBottomText = stripLabel(
      stripLabel(data.copyright || "", data.universityName || ""),
      data.institutionLabel || ""
    ).replace(/\s{2,}/g, " ").trim() || "©";

    this.root.innerHTML = `
      <footer class="sierra-footer" role="contentinfo">
        <div class="sierra-footer-main">
          <div class="sierra-footer-grid" style="--sierra-footer-col-count:${Math.max(1, columns.length)};">
            <section>
              <div class="sierra-footer-logo-row">
                <img class="sierra-footer-logo" src="${data.logo || "./logo.png"}" alt="Logo institutionnel">
              </div>
              <p class="sierra-footer-addr">${data.institutionLabel}</p>
              <p class="sierra-footer-addr">${data.addressLine1}</p>
              <p class="sierra-footer-addr">${data.addressLine2}</p>
            </section>

            ${columnsHtml}

            <section class="sierra-footer-social-wrap">
              <h3 class="sierra-footer-col-title">Reseaux</h3>
              <div class="sierra-footer-social">${socialHtml}</div>
            </section>
          </div>
        </div>

        <div class="sierra-footer-bottom">
          <p>${footerBottomText}</p>
        </div>
      </footer>
    `;
  }
}
