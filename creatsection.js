import { db } from "./firebase-init.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const COLLECTION = "created_sections";
const DOC_ID = "main";

function toColor(value, fallback) {
  const v = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

function toCount(value) {
  const n = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(4, Math.max(1, n));
}

function toWidth(value) {
  const n = Number.parseFloat(String(value || ""));
  if (Number.isNaN(n)) return 42;
  return Math.min(80, Math.max(20, n));
}

function toColumnWidth(value, fallback = 100) {
  const n = Number.parseFloat(String(value || ""));
  if (Number.isNaN(n)) return fallback;
  return Math.min(100, Math.max(10, n));
}

function normalizeColumn(column = {}) {
  const mediaMode = ["image", "video", "text"].includes(column.mediaMode)
    ? column.mediaMode
    : (column.mediaType === "video" ? "video" : "image");
  return {
    id: String(column.id || `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
    mediaType: mediaMode === "video" ? "video" : "image",
    mediaMode,
    mediaName: String(column.mediaName || "").trim(),
    mediaText: String(column.mediaText || "").trim(),
    title: String(column.title || "").trim(),
    subtitle: String(column.subtitle || "").trim(),
    mediaTextColor: toColor(column.mediaTextColor, "#0f172a"),
    mediaBgColor: toColor(column.mediaBgColor, "#eef3f0"),
    titleColor: toColor(column.titleColor, "#111827"),
    subtitleColor: toColor(column.subtitleColor, "#334155"),
    columnBgColor: toColor(column.columnBgColor, "#ffffff"),
    mediaVertical: column.mediaVertical === "bottom" ? "bottom" : "top",
    buttonEnabled: Boolean(column.buttonEnabled),
    buttonLabel: String(column.buttonLabel || "").trim(),
    buttonTargetPage: String(column.buttonTargetPage || "").trim(),
    buttonAlign: ["left", "center", "right"].includes(column.buttonAlign) ? column.buttonAlign : "left",
    singleMediaSide: column.singleMediaSide === "right" ? "right" : "left",
    singleMediaWidth: toWidth(column.singleMediaWidth),
    columnWidth: toColumnWidth(column.columnWidth, 100)
  };
}

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map((section) => {
    const count = toCount(section.columnCount);
    const columns = Array.isArray(section.columns) ? section.columns.map(normalizeColumn) : [];

    while (columns.length < count) {
      columns.push(normalizeColumn({}));
    }

    return {
      id: String(section.id || `section_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
      title: String(section.title || "").trim(),
      columnCount: count,
      columns: columns.slice(0, count)
    };
  });
}

function renderMedia(column) {
  if (column.mediaMode === "text") {
    return `
      <div class="flex h-full w-full items-center justify-center p-4 text-center" style="background:${column.mediaBgColor};">
        <p class="text-base font-semibold md:text-xl" style="color:${column.mediaTextColor};">${column.mediaText || ""}</p>
      </div>
    `;
  }
  if (!column.mediaName) return "";
  if (column.mediaMode === "video") {
    return `<video autoplay muted loop playsinline class="h-full w-full object-contain" style="background:${column.mediaBgColor};"><source src="./${column.mediaName}"></video>`;
  }
  return `<img src="./${column.mediaName}" alt="" class="h-full w-full object-contain" style="background:${column.mediaBgColor};">`;
}

function hasMediaPanel(column) {
  if (column.mediaMode === "text") return Boolean(column.mediaText);
  return Boolean(column.mediaName);
}

function buildDesktopColumns(columns = []) {
  const raw = columns.map((c) => toColumnWidth(c.columnWidth, 100 / Math.max(1, columns.length)));
  const sum = raw.reduce((acc, val) => acc + val, 0) || 1;
  const normalized = raw.map((val) => Number((val / sum).toFixed(4)));
  return normalized.map((val) => `minmax(0, ${val}fr)`).join(" ");
}

function buttonAlignClass(align) {
  if (align === "right") return "justify-end";
  if (align === "center") return "justify-center";
  return "justify-start";
}

function renderButton(column) {
  if (!column.buttonEnabled || !column.buttonLabel || !column.buttonTargetPage) return "";
  return `
    <div class="mt-4 flex ${buttonAlignClass(column.buttonAlign)}">
      <a href="./index.html?page=${column.buttonTargetPage}" class="inline-flex rounded-md bg-[#1f5135] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#173d2a]">
        ${column.buttonLabel}
      </a>
    </div>
  `;
}

function renderSingleColumn(section) {
  const c = section.columns[0];
  const mediaExists = hasMediaPanel(c);
  const mediaWidth = mediaExists ? c.singleMediaWidth : 0;
  const textWidth = 100 - mediaWidth;
  const mediaOrder = c.singleMediaSide === "right" ? "md:order-2" : "md:order-1";
  const textOrder = c.singleMediaSide === "right" ? "md:order-1" : "md:order-2";

  return `
    <section class="overflow-hidden rounded-xl border border-[#4f6655]/20" style="background:${c.columnBgColor};">
      ${section.title ? `<h3 class="px-4 pt-4 text-xl font-semibold text-stone-900 md:px-6">${section.title}</h3>` : ""}
      <div class="grid min-h-[60vh] grid-cols-1 md:grid-cols-10">
        ${mediaExists ? `
          <div class="order-1 h-[42vh] md:h-auto ${mediaOrder}" style="grid-column:span ${Math.round(mediaWidth / 10)} / span ${Math.round(mediaWidth / 10)};">
            ${renderMedia(c)}
          </div>
        ` : ""}
        <div class="order-2 flex items-center ${textOrder}" style="grid-column:span ${Math.round(textWidth / 10)} / span ${Math.round(textWidth / 10)};">
          <div class="w-full px-4 py-6 md:px-8 md:py-8">
            <h4 class="text-2xl font-semibold md:text-4xl" style="color:${c.titleColor};">${c.title}</h4>
            <p class="mt-3 text-sm leading-relaxed md:text-lg" style="color:${c.subtitleColor};">${c.subtitle}</p>
            ${renderButton(c)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderMultiColumn(section) {
  const desktopCols = buildDesktopColumns(section.columns);
  return `
    <section>
      ${section.title ? `<h3 class="mb-3 text-xl font-semibold text-stone-900">${section.title}</h3>` : ""}
      <div class="grid grid-cols-1 gap-3 md:[grid-template-columns:var(--desktop-cols)]" style="--desktop-cols:${desktopCols};">
        ${section.columns.map((c) => {
          const mediaFirst = c.mediaVertical !== "bottom";
          const mediaExists = hasMediaPanel(c);
          const mediaPanel = mediaExists
            ? `<div class="${mediaFirst ? "order-1" : "order-2"} h-[52%] overflow-hidden">${renderMedia(c)}</div>`
            : "";
          const textBlock = `
            <div class="${mediaFirst ? "order-2" : "order-1"} h-[48%] p-4 md:p-5">
              <h4 class="text-lg font-semibold md:text-2xl" style="color:${c.titleColor};">${c.title}</h4>
              <p class="mt-2 text-sm leading-relaxed md:text-base" style="color:${c.subtitleColor};">${c.subtitle}</p>
              ${renderButton(c)}
            </div>
          `;

          return `
            <article class="flex h-[60vh] min-h-[420px] flex-col overflow-hidden rounded-xl border border-[#4f6655]/20" style="background:${c.columnBgColor};">
              ${mediaPanel}
              ${textBlock}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderSectionsHTML(sections) {
  return sections.map((section) => {
    if (section.columnCount === 1) return renderSingleColumn(section);
    return renderMultiColumn(section);
  }).join("");
}

export default class CreatSectionRenderer {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.unsubscribe = null;
    if (!this.root) return;
    this.subscribe();
  }

  subscribe() {
    const ref = doc(db, COLLECTION, DOC_ID);
    this.unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const sections = normalizeSections(data.sections);
      this.render(sections);
    });
  }

  render(sections) {
    if (!sections.length) {
      this.root.innerHTML = "";
      return;
    }

    this.root.innerHTML = `
      <section class="w-full space-y-5 px-2 py-4 md:px-4 md:py-6 lg:px-6">
        ${renderSectionsHTML(sections)}
      </section>
    `;
  }
}
