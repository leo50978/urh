import { db } from "./firebase-init.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const GALLERY_COLLECTION = "gallery_sections";
const GALLERY_DOC_ID = "main";

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item?.id || ""),
      imageName: String(item?.imageName || item?.image || "").trim(),
      alt: String(item?.alt || item?.title || "").trim()
    }))
    .filter((item) => item.imageName);
}

export default class GallerySection {
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
    if (document.getElementById("sierra-gallery-style")) return;

    const style = document.createElement("style");
    style.id = "sierra-gallery-style";
    style.textContent = `
      .sierra-gallery-track {
        scrollbar-width: thin;
        scrollbar-color: rgba(79, 102, 85, 0.45) rgba(79, 102, 85, 0.12);
      }
      .sierra-gallery-track::-webkit-scrollbar {
        height: 8px;
      }
      .sierra-gallery-track::-webkit-scrollbar-thumb {
        background: rgba(79, 102, 85, 0.45);
        border-radius: 999px;
      }
      .sierra-gallery-track::-webkit-scrollbar-track {
        background: rgba(79, 102, 85, 0.12);
      }
      @media (min-width: 768px) {
        .sierra-gallery-track {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .sierra-gallery-track::-webkit-scrollbar {
          display: none;
        }
      }
      .sierra-gallery-card {
        flex: 0 0 clamp(220px, 66vw, 420px);
      }
      @media (min-width: 640px) {
        .sierra-gallery-card {
          flex-basis: clamp(240px, 48vw, 460px);
        }
      }
      @media (min-width: 900px) {
        .sierra-gallery-card {
          flex-basis: clamp(260px, 34vw, 500px);
        }
      }
      @media (min-width: 1200px) {
        .sierra-gallery-card {
          flex-basis: clamp(280px, 26vw, 520px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  subscribeData() {
    const ref = doc(db, GALLERY_COLLECTION, GALLERY_DOC_ID);
    this.unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const title = String(data.title || "").trim();
      const items = normalizeItems(data.items);
      this.render(title, items);
    });
  }

  render(title, items) {
    if (!items.length) {
      this.root.innerHTML = "";
      return;
    }

    const heading = title || "Galerie";
    const cards = items.map((item) => `
      <article class="sierra-gallery-card h-[50vh] overflow-hidden rounded-xl border border-[#4f6655]/25 bg-white shadow-sm">
        <img src="./${item.imageName}" alt="${item.alt}" class="h-full w-full object-cover">
      </article>
    `).join("");

    this.root.innerHTML = `
      <section class="mx-auto w-full max-w-7xl px-4 pb-6 pt-3 md:px-6 md:pb-8">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-stone-900 md:text-2xl">${heading}</h2>
          <span class="text-xs font-medium uppercase tracking-[0.08em] text-stone-500">Gallery</span>
        </div>

        <div class="relative">
          <button
            type="button"
            data-gallery-nav="left"
            class="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#4f6655]/30 bg-white/95 text-[#2f4d3a] shadow-sm transition hover:bg-white md:flex"
            aria-label="Defiler vers la gauche"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button
            type="button"
            data-gallery-nav="right"
            class="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#4f6655]/30 bg-white/95 text-[#2f4d3a] shadow-sm transition hover:bg-white md:flex"
            aria-label="Defiler vers la droite"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>

          <div class="sierra-gallery-track flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-2 md:gap-4">
            ${cards}
          </div>
        </div>
      </section>
    `;

    this.bindNavControls();
  }

  bindNavControls() {
    const track = this.root.querySelector(".sierra-gallery-track");
    if (!track) return;

    const leftBtn = this.root.querySelector('[data-gallery-nav="left"]');
    const rightBtn = this.root.querySelector('[data-gallery-nav="right"]');
    if (!leftBtn || !rightBtn) return;

    const scrollStep = () => Math.max(track.clientWidth * 0.82, 280);

    leftBtn.addEventListener("click", () => {
      track.scrollBy({ left: -scrollStep(), behavior: "smooth" });
    });

    rightBtn.addEventListener("click", () => {
      track.scrollBy({ left: scrollStep(), behavior: "smooth" });
    });
  }
}
