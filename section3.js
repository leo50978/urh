import { db } from "./firebase-init.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const SECTION3_COLLECTION = "section3_sections";
const SECTION3_DOC_ID = "main";
const SEPARATOR_TYPES = new Set([
  "none",
  "line",
  "line-bold",
  "double-line",
  "dashed",
  "dotted",
  "gradient-fade",
  "center-diamond",
  "three-dots",
  "soft-gap"
]);

function normalizeColor(value, fallback) {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const mediaType = item?.mediaType === "text" ? "text" : "image";
    const imageSide = item?.imageSide === "right" ? "right" : "left";
    const separatorType = SEPARATOR_TYPES.has(item?.separatorType) ? item.separatorType : "line";
    return {
      id: String(item?.id || ""),
      mediaType,
      imageName: String(item?.imageName || "").trim(),
      mediaText: String(item?.mediaText || "").trim(),
      mediaBgColor: normalizeColor(item?.mediaBgColor, "#2f4d3a"),
      mediaTextColor: normalizeColor(item?.mediaTextColor, "#ffffff"),
      contentBgColor: normalizeColor(item?.contentBgColor, "#f8fafc"),
      title: String(item?.title || "").trim(),
      subtitle: String(item?.subtitle || "").trim(),
      titleColor: normalizeColor(item?.titleColor, "#111827"),
      subtitleColor: normalizeColor(item?.subtitleColor, "#374151"),
      imageSide,
      separatorType,
      separatorColor: normalizeColor(item?.separatorColor, "#1f5135")
    };
  }).filter((item) => {
    if (!item.title && !item.subtitle) return false;
    if (item.mediaType === "image") return Boolean(item.imageName);
    return true;
  });
}

function renderMedia(item) {
  if (item.mediaType === "text") {
    return `
      <div class="flex h-full w-full items-center justify-center p-6" style="background:${item.mediaBgColor}; color:${item.mediaTextColor};">
        <p class="text-center text-lg font-semibold md:text-2xl">${item.mediaText || ""}</p>
      </div>
    `;
  }
  return `<img src="./${item.imageName}" alt="" class="h-full w-full object-cover">`;
}

function renderSeparator(item) {
  const color = item.separatorColor;
  switch (item.separatorType) {
    case "none":
      return "";
    case "line-bold":
      return `<div class="my-3 h-[3px] w-full rounded-full" style="background:${color};opacity:0.45;"></div>`;
    case "double-line":
      return `
        <div class="my-3 space-y-1">
          <div class="h-px w-full" style="background:${color};opacity:0.42;"></div>
          <div class="h-px w-full" style="background:${color};opacity:0.42;"></div>
        </div>
      `;
    case "dashed":
      return `<div class="my-3 h-px w-full" style="background:repeating-linear-gradient(90deg, ${color} 0 16px, transparent 16px 26px);opacity:0.5;"></div>`;
    case "dotted":
      return `<div class="my-3 h-[6px] w-full" style="background:radial-gradient(circle, ${color} 2px, transparent 2px);background-size:16px 6px;background-repeat:repeat-x;opacity:0.5;"></div>`;
    case "gradient-fade":
      return `<div class="my-3 h-px w-full" style="background:linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%);opacity:0.6;"></div>`;
    case "center-diamond":
      return `
        <div class="my-3 flex items-center gap-3">
          <div class="h-px flex-1" style="background:${color};opacity:0.4;"></div>
          <div class="h-2.5 w-2.5 rotate-45" style="background:${color};opacity:0.65;"></div>
          <div class="h-px flex-1" style="background:${color};opacity:0.4;"></div>
        </div>
      `;
    case "three-dots":
      return `
        <div class="my-3 flex items-center justify-center gap-2">
          <span class="h-1.5 w-1.5 rounded-full" style="background:${color};opacity:0.65;"></span>
          <span class="h-1.5 w-1.5 rounded-full" style="background:${color};opacity:0.65;"></span>
          <span class="h-1.5 w-1.5 rounded-full" style="background:${color};opacity:0.65;"></span>
        </div>
      `;
    case "soft-gap":
      return `<div class="my-2 h-4 w-full rounded-full" style="background:${color};opacity:0.08;"></div>`;
    case "line":
    default:
      return `<div class="my-3 h-px w-full" style="background:${color};opacity:0.45;"></div>`;
  }
}

export default class Section3 {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.unsubscribe = null;
    if (!this.root) return;
    this.subscribeData();
  }

  subscribeData() {
    const ref = doc(db, SECTION3_COLLECTION, SECTION3_DOC_ID);
    this.unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const items = normalizeItems(data.items);
      this.render(items);
    });
  }

  render(items) {
    if (!items.length) {
      this.root.innerHTML = "";
      return;
    }

    this.root.innerHTML = `
      <div class="mx-4 my-4 space-y-4 md:mx-10">
        ${items.map((item, index) => {
      const mediaFirstDesktop = item.imageSide === "left";
      const mediaOrder = mediaFirstDesktop ? "md:order-1" : "md:order-2";
      const contentOrder = mediaFirstDesktop ? "md:order-2" : "md:order-1";
      const separator = index < items.length - 1 ? renderSeparator(item) : "";

      return `
        <div>
          <section class="overflow-hidden rounded-md grid grid-cols-1 md:grid-cols-10 md:h-[50vh] md:min-h-[380px]">
            <div class="order-1 h-[220px] md:h-full md:col-span-3 ${mediaOrder}">
              ${renderMedia(item)}
            </div>
            <div class="order-2 h-auto md:h-full md:col-span-7 ${contentOrder} flex items-start md:items-center" style="background:${item.contentBgColor};">
              <div class="w-full px-6 py-8 md:px-12 md:py-10">
                <h2 class="text-3xl font-semibold md:text-5xl" style="color:${item.titleColor};">${item.title}</h2>
                <p class="mt-4 text-base leading-relaxed md:text-xl" style="color:${item.subtitleColor};">${item.subtitle}</p>
              </div>
            </div>
          </section>
          ${separator}
        </div>
      `;
    }).join("")}
      </div>
    `;
  }
}
