import { db } from "./firebase-init.js";
import {
  addDoc,
  collection,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getPageId(root, options = {}) {
  if (options.pageId) return options.pageId;
  if (root?.dataset?.pageId) return root.dataset.pageId;
  const qs = new URLSearchParams(window.location.search);
  return qs.get("page");
}

function renderMedia(section) {
  const mediaName = section.mediaName || "";
  if (!mediaName) return "";
  if (section.mediaType === "video") {
    return `
      <video controls class="w-full rounded-lg object-cover">
        <source src="./${mediaName}">
      </video>
    `;
  }
  return `<img src="./${mediaName}" alt="" class="w-full rounded-lg object-cover">`;
}

function renderButtonLink(label, targetPage) {
  if (!label || !targetPage) return "";
  return `
    <a href="./index.html?page=${targetPage}" class="inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800">
      ${label}
    </a>
  `;
}

function renderTableBlock(table = {}) {
  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  if (!columns.length) return "";

  const head = columns.map((c) => `<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-600">${c}</th>`).join("");
  const body = rows.map((row) => {
    const cells = Array.isArray(row.cells) ? row.cells : [];
    const tds = columns.map((_, index) => {
      const value = cells[index] || "";
      if (row.targetPage) return `<td class="px-3 py-2 text-sm"><a href="./index.html?page=${row.targetPage}" class="text-stone-700 hover:text-stone-900">${value}</a></td>`;
      return `<td class="px-3 py-2 text-sm text-stone-700">${value}</td>`;
    }).join("");
    return `<tr class="border-t border-stone-200">${tds}</tr>`;
  }).join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table class="min-w-full">
        <thead class="bg-stone-50"><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function renderFormField(field) {
  const required = field.required ? "required" : "";
  const label = `<label class="mb-1 block text-sm font-medium text-stone-700">${field.label || ""}</label>`;
  if (field.type === "select") {
    const options = Array.isArray(field.options) ? field.options : [];
    return `
      <div>
        ${label}
        <select name="${field.id || ""}" class="w-full rounded border border-stone-300 px-3 py-2 text-sm" ${required}>
          ${options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
        </select>
      </div>
    `;
  }
  if (field.type === "checkbox") {
    return `
      <label class="inline-flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="${field.id || ""}" class="h-4 w-4 rounded border-stone-300">
        <span>${field.label || ""}</span>
      </label>
    `;
  }
  if (field.type === "textarea") {
    return `
      <div>
        ${label}
        <textarea name="${field.id || ""}" placeholder="${field.placeholder || ""}" class="h-28 w-full rounded border border-stone-300 px-3 py-2 text-sm" ${required}></textarea>
      </div>
    `;
  }
  return `
    <div>
      ${label}
      <input
        type="${field.type || "text"}"
        name="${field.id || ""}"
        placeholder="${field.placeholder || ""}"
        class="w-full rounded border border-stone-300 px-3 py-2 text-sm"
        ${required}
      >
    </div>
  `;
}

function renderFormBlock(section, pageId) {
  const form = section.form || {};
  const fields = Array.isArray(form.fields) ? form.fields : [];
  return `
    <form data-page-form data-page-id="${pageId}" data-section-id="${section.id || ""}" class="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      ${fields.map((f) => renderFormField(f)).join("")}
      <button type="submit" class="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800">
        ${form.submitLabel || "Envoyer"}
      </button>
    </form>
  `;
}

function renderCardBlock(card = {}) {
  const bg = card.bgColor || "#ffffff";
  let content = "";
  if (card.contentType === "table") {
    content = renderTableBlock(card.table || {});
  } else if (card.contentType === "form") {
    content = renderFormBlock({ id: card.id || "", form: card.form || {} }, card.pageId || "");
  } else {
    content = renderMedia({ mediaType: card.mediaType || "image", mediaName: card.mediaName || "" });
  }
  return `
    <article class="rounded-xl border border-stone-200 p-5" style="background:${bg};">
      <h3 class="text-xl font-bold text-stone-900">${card.title || ""}</h3>
      <p class="mt-1 text-sm text-stone-700">${card.subtitle || ""}</p>
      <div class="mt-4">${content}</div>
      <div class="mt-4">${renderButtonLink(card.buttonLabel, card.targetPage)}</div>
    </article>
  `;
}

function renderCarouselBlock(carousel = {}) {
  const slides = Array.isArray(carousel.slides) ? carousel.slides : [];
  if (!slides.length) return "";
  return `
    <div class="overflow-x-auto">
      <div class="flex min-w-full gap-4 pb-2">
        ${slides.map((slide) => `
          <a href="./index.html?page=${slide.targetPage || ""}" class="relative min-w-[280px] overflow-hidden rounded-xl border border-stone-200 bg-black">
            <img src="./${slide.imageName || ""}" alt="" class="h-48 w-full object-cover opacity-80">
            <div class="absolute inset-0 flex items-end p-4">
              <p class="text-sm font-medium text-white">${slide.text || ""}</p>
            </div>
          </a>
        `).join("")}
      </div>
    </div>
  `;
}

function renderSection(section) {
  const wrapperStart = `<section id="${section.id || ""}" class="mx-auto max-w-6xl px-4 py-10">`;
  const wrapperEnd = `</section>`;

  if (section.type === "form") {
    return `
      ${wrapperStart}
        <h2 class="mb-3 text-2xl font-semibold text-stone-900">${section.title || ""}</h2>
        ${renderFormBlock(section, section.pageId || "")}
      ${wrapperEnd}
    `;
  }

  if (section.type === "button") {
    return `
      ${wrapperStart}
        <h2 class="mb-3 text-2xl font-semibold text-stone-900">${section.title || ""}</h2>
        ${renderButtonLink(section.button?.label, section.button?.targetPage)}
      ${wrapperEnd}
    `;
  }

  if (section.type === "table") {
    return `
      ${wrapperStart}
        <h2 class="mb-3 text-2xl font-semibold text-stone-900">${section.title || ""}</h2>
        ${renderTableBlock(section.table || {})}
      ${wrapperEnd}
    `;
  }

  if (section.type === "card") {
    const card = {
      ...(section.card || {}),
      id: section.id || "",
      pageId: section.pageId || ""
    };
    return `
      ${wrapperStart}
        ${renderCardBlock(card)}
      ${wrapperEnd}
    `;
  }

  if (section.type === "carousel") {
    return `
      ${wrapperStart}
        <h2 class="mb-3 text-2xl font-semibold text-stone-900">${section.title || ""}</h2>
        ${renderCarouselBlock(section.carousel || {})}
      ${wrapperEnd}
    `;
  }

  const mediaHtml = renderMedia(section);
  const textHtml = `
    <div class="space-y-2">
      <h2 class="text-2xl font-semibold text-stone-900">${section.title || ""}</h2>
      <p class="leading-relaxed text-stone-700">${section.text || ""}</p>
    </div>
  `;

  const layout = section.layout || "media_top_text_bottom";
  if (layout === "text_left_media_right") {
    return `
      <section id="${section.id || ""}" class="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 md:grid-cols-2">
        ${textHtml}
        ${mediaHtml}
      </section>
    `;
  }

  if (layout === "media_left_text_right") {
    return `
      <section id="${section.id || ""}" class="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 md:grid-cols-2">
        ${mediaHtml}
        ${textHtml}
      </section>
    `;
  }

  return `
    <section id="${section.id || ""}" class="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10">
      ${mediaHtml}
      ${textHtml}
    </section>
  `;
}

export default class Pages {
  constructor(rootId, options = {}) {
    this.root = document.getElementById(rootId);
    this.pageId = getPageId(this.root, options);
    this.unsubscribe = null;

    if (!this.root || !this.pageId) return;
    this.init();
  }

  init() {
    const pageRef = doc(db, "pages", this.pageId);
    this.unsubscribe = onSnapshot(pageRef, (snapshot) => {
      if (!snapshot.exists()) {
        this.root.innerHTML = "";
        return;
      }
      this.render(snapshot.data());
    });
  }

  render(page) {
    const sections = Array.isArray(page.sections) ? [...page.sections] : [];
    sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sections.forEach((section) => {
      section.pageId = this.pageId;
    });

    const heroImage = page.heroImageName ? `<img src="./${page.heroImageName}" alt="" class="h-[42vh] w-full object-cover md:h-[52vh]">` : "";
    const heroText = page.heroText ? `<div class="absolute inset-0 flex items-end bg-black/35 p-6 md:p-10"><h1 class="max-w-3xl text-3xl font-semibold text-white md:text-5xl">${page.heroText}</h1></div>` : "";

    this.root.innerHTML = `
      <article class="w-full">
        <section class="relative">
          ${heroImage}
          ${heroText}
        </section>
        ${sections.map((section) => renderSection(section)).join("")}
      </article>
    `;
    this.bindForms();
  }

  bindForms() {
    this.root.querySelectorAll("[data-page-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = {};
        const fd = new FormData(form);
        fd.forEach((value, key) => {
          if (payload[key] !== undefined) {
            if (!Array.isArray(payload[key])) payload[key] = [payload[key]];
            payload[key].push(value);
          } else {
            payload[key] = value;
          }
        });
        form.querySelectorAll('input[type="checkbox"]').forEach((el) => {
          payload[el.name] = el.checked;
        });

        await addDoc(collection(db, "form_submissions"), {
          pageId: form.dataset.pageId || this.pageId,
          sectionId: form.dataset.sectionId || "",
          values: payload,
          submittedAt: Date.now()
        });
        form.reset();
      });
    });
  }
}
