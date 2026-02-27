import { db } from "./firebase-init.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const HERO_COLLECTION = "hero_sections";
const HERO_DOC_ID = "main";
const HERO_FONT_STYLESHEET = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=Fira+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Noto+Serif:wght@400;600;700&family=Nunito+Sans:wght@400;600;700&family=PT+Sans:wght@400;700&family=Playfair+Display:wght@500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto+Slab:wght@400;500;700&family=Source+Sans+3:wght@400;500;600;700&family=Source+Serif+4:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap";

function getPageQuery() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("page") || "").trim();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeColor(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#ffffff";
}

function normalizeNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeFont(value, fallback) {
  const font = String(value || "").trim();
  return font || fallback;
}

function normalizeHero(raw = {}) {
  const buttons = Array.isArray(raw.buttons)
    ? raw.buttons
      .map((button) => ({
        label: (button?.label || "").trim(),
        targetPage: (button?.targetPage || "").trim()
      }))
      .filter((button) => button.label && button.targetPage)
      .slice(0, 2)
    : [];

  const overlayOpacity = clamp(Number(raw.overlayOpacity ?? 0.38), 0.1, 0.8);
  const position = (raw.contentPosition || "center_center").trim();
  const legacyTextColor = normalizeColor(raw.textColor);
  const styleRaw = raw.style || {};
  const style = {
    titleColor: normalizeColor(styleRaw.titleColor || legacyTextColor),
    subtitleColor: normalizeColor(styleRaw.subtitleColor || legacyTextColor),
    buttonBgColor: normalizeColor(styleRaw.buttonBgColor || "#2f4d3a"),
    buttonTextColor: normalizeColor(styleRaw.buttonTextColor || legacyTextColor),
    titleSize: normalizeNumber(styleRaw.titleSize, 64),
    subtitleSize: normalizeNumber(styleRaw.subtitleSize, 22),
    buttonTextSize: normalizeNumber(styleRaw.buttonTextSize, 16),
    titleFontFamily: normalizeFont(styleRaw.titleFontFamily, "\"Source Serif 4\", serif"),
    subtitleFontFamily: normalizeFont(styleRaw.subtitleFontFamily, "\"Source Sans 3\", sans-serif"),
    buttonFontFamily: normalizeFont(styleRaw.buttonFontFamily, "\"Source Sans 3\", sans-serif"),
    titleLetterSpacing: normalizeNumber(styleRaw.titleLetterSpacing, 0.2),
    subtitleLetterSpacing: normalizeNumber(styleRaw.subtitleLetterSpacing, 0.1),
    buttonLetterSpacing: normalizeNumber(styleRaw.buttonLetterSpacing, 0.2),
    titleLineHeight: normalizeNumber(styleRaw.titleLineHeight, 1.12),
    subtitleLineHeight: normalizeNumber(styleRaw.subtitleLineHeight, 1.45),
    buttonLineHeight: normalizeNumber(styleRaw.buttonLineHeight, 1.2)
  };

  return {
    mediaType: raw.mediaType === "video" ? "video" : "image",
    mediaName: (raw.mediaName || "").trim(),
    title: (raw.title || "").trim(),
    subtitle: (raw.subtitle || "").trim(),
    contentPosition: position,
    overlayOpacity,
    style,
    buttons
  };
}

function colorWithAlpha(hexColor, alphaHex) {
  return `${normalizeColor(hexColor)}${alphaHex}`;
}

function injectHeroFonts() {
  if (document.getElementById("sierra-hero-fonts")) return;
  const link = document.createElement("link");
  link.id = "sierra-hero-fonts";
  link.rel = "stylesheet";
  link.href = HERO_FONT_STYLESHEET;
  document.head.appendChild(link);
}

function positionClasses(position) {
  const map = {
    top_left: {
      container: "items-start justify-start",
      text: "text-left",
      actions: "justify-start"
    },
    top_right: {
      container: "items-end justify-start",
      text: "text-right",
      actions: "justify-end"
    },
    center_center: {
      container: "items-center justify-center",
      text: "text-center",
      actions: "justify-center"
    },
    bottom_left: {
      container: "items-start justify-end",
      text: "text-left",
      actions: "justify-start"
    },
    bottom_right: {
      container: "items-end justify-end",
      text: "text-right",
      actions: "justify-end"
    }
  };

  return map[position] || map.center_center;
}

function renderMedia(hero) {
  if (!hero.mediaName) {
    return `
      <div
        class="absolute inset-0"
        style="background:linear-gradient(135deg,#20442f 0%,#3f6f56 38%,#8da98f 100%);"
      ></div>
    `;
  }

  if (hero.mediaType === "video") {
    return `
      <video autoplay muted loop playsinline class="absolute inset-0 h-full w-full object-cover">
        <source src="./${hero.mediaName}">
      </video>
    `;
  }

  return `<img src="./${hero.mediaName}" alt="" class="absolute inset-0 h-full w-full object-cover">`;
}

function renderButtons(hero, classes) {
  if (!hero.buttons.length) return "";

  const style = hero.style || {};
  return `
    <div class="mt-6 flex flex-wrap gap-3 ${classes.actions}">
      ${hero.buttons.map((button, index) => {
        return `
          <a
            href="./index.html?page=${button.targetPage}"
            class="inline-flex items-center rounded-md border border-transparent px-5 py-2.5 font-semibold transition hover:opacity-90"
            style="background:${index === 0 ? style.buttonBgColor : colorWithAlpha(style.buttonBgColor, "cc")};color:${style.buttonTextColor};font-size:${style.buttonTextSize}px;font-family:${style.buttonFontFamily};letter-spacing:${style.buttonLetterSpacing}px;line-height:${style.buttonLineHeight};"
          >
            ${button.label}
          </a>
        `;
      }).join("")}
    </div>
  `;
}

export default class HerComponent {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.unsubscribe = null;
    this.currentHero = null;
    this.handleResize = this.handleResize.bind(this);

    if (!this.root) return;
    this.init();
  }

  init() {
    if (getPageQuery()) return;
    injectHeroFonts();
    this.injectStyles();
    this.subscribeHero();
    window.addEventListener("resize", this.handleResize);
  }

  injectStyles() {
    if (document.getElementById("sierra-her-style")) return;
    const style = document.createElement("style");
    style.id = "sierra-her-style";
    style.textContent = `
      .sierra-home-hero-title {
        text-wrap: balance;
      }
      .sierra-home-hero-subtitle {
        text-wrap: pretty;
      }
    `;
    document.head.appendChild(style);
  }

  subscribeHero() {
    const heroRef = doc(db, HERO_COLLECTION, HERO_DOC_ID);
    this.unsubscribe = onSnapshot(heroRef, (snapshot) => {
      this.currentHero = snapshot.exists() ? normalizeHero(snapshot.data()) : null;
      this.render();
    });
  }

  handleResize() {
    if (!this.currentHero) return;
    this.render();
  }

  getHeaderHeight() {
    const headerRoot = document.getElementById("sierra-header-root");
    if (!headerRoot) return 0;
    const rect = headerRoot.getBoundingClientRect();
    return Math.max(0, Math.round(rect.height));
  }

  render() {
    const hero = this.currentHero;
    if (!hero || (!hero.title && !hero.subtitle && !hero.mediaName && !hero.buttons.length)) {
      this.root.innerHTML = "";
      return;
    }

    const headerHeight = this.getHeaderHeight();
    const classes = positionClasses(hero.contentPosition);
    const style = hero.style || {};
    const titleMin = style.titleSize * 0.62;
    const subtitleMin = style.subtitleSize * 0.82;

    this.root.innerHTML = `
      <section
        class="relative h-[100vh] min-h-[680px] w-full overflow-hidden"
        style="margin-top:-${headerHeight}px;padding-top:${headerHeight}px;"
      >
        ${renderMedia(hero)}
        <div class="absolute inset-0" style="background:rgba(12, 18, 15, ${hero.overlayOpacity});"></div>

        <div class="relative z-10 mx-auto flex h-full max-w-7xl px-6 py-8 md:px-10 md:py-12 ${classes.container}">
          <div class="max-w-3xl ${classes.text}">
            <h1 class="sierra-home-hero-title font-semibold" style="color:${style.titleColor};font-size:clamp(${titleMin}px,6vw,${style.titleSize}px);font-family:${style.titleFontFamily};letter-spacing:${style.titleLetterSpacing}px;line-height:${style.titleLineHeight};">
              ${hero.title || ""}
            </h1>
            <p class="sierra-home-hero-subtitle mt-4" style="color:${style.subtitleColor};font-size:clamp(${subtitleMin}px,2.2vw,${style.subtitleSize}px);font-family:${style.subtitleFontFamily};letter-spacing:${style.subtitleLetterSpacing}px;line-height:${style.subtitleLineHeight};">
              ${hero.subtitle || ""}
            </p>
            ${renderButtons(hero, classes)}
          </div>
        </div>
      </section>
    `;
  }
}
