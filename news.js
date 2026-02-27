import { db } from "./firebase-init.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const NEWS_COLLECTION = "news_sections";
const NEWS_DOC_ID = "main";

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return [];
  return cards
    .map((card) => ({
      id: String(card?.id || ""),
      mediaType: String(card?.mediaType || "").trim() === "video" ? "video" : "image",
      imageName: String(card?.imageName || card?.image || "").trim(),
      mediaName: String(card?.mediaName || card?.imageName || card?.image || "").trim(),
      text: String(card?.text || card?.title || card?.description || "").trim(),
      targetPage: String(card?.targetPage || card?.pageId || card?.page || "").trim()
    }))
    .map((card) => ({
      ...card,
      mediaName: card.mediaName || card.imageName
    }))
    .filter((card) => card.mediaName && card.text && card.targetPage);
}

export default class NewsSection {
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
    if (document.getElementById("sierra-news-style")) return;
    const style = document.createElement("style");
    style.id = "sierra-news-style";
    style.textContent = `
      .sierra-news-track {
        scrollbar-width: thin;
        scrollbar-color: rgba(79, 102, 85, 0.45) rgba(79, 102, 85, 0.12);
      }
      .sierra-news-track::-webkit-scrollbar {
        height: 8px;
      }
      .sierra-news-track::-webkit-scrollbar-thumb {
        background: rgba(79, 102, 85, 0.45);
        border-radius: 999px;
      }
      .sierra-news-track::-webkit-scrollbar-track {
        background: rgba(79, 102, 85, 0.12);
      }
      @media (min-width: 768px) {
        .sierra-news-track {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .sierra-news-track::-webkit-scrollbar {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  subscribeData() {
    const newsRef = doc(db, NEWS_COLLECTION, NEWS_DOC_ID);
    this.unsubscribe = onSnapshot(newsRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const cards = normalizeCards(data.cards);
      this.render(cards, (data.title || "").trim());
    });
  }

  render(cards, title) {
    if (!cards.length) {
      this.root.innerHTML = "";
      return;
    }

    const heading = title || "Actualites";
    const cardsHtml = cards.map((card) => `
      <a
        href="./index.html?page=${card.targetPage}"
        class="group relative h-[50vh] min-w-[calc(50%-0.5rem)] overflow-hidden rounded-xl border border-[#4f6655]/25 bg-black shadow-sm transition hover:shadow-lg md:min-w-[320px] lg:min-w-[360px]"
      >
        ${card.mediaType === "video"
          ? `<video autoplay muted loop playsinline class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"><source src="./${card.mediaName}"></video>`
          : `<img src="./${card.mediaName}" alt="" class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]">`
        }
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div class="absolute inset-x-0 bottom-0 p-3 md:p-4">
          <p class="line-clamp-3 text-sm font-semibold text-white md:text-base">${card.text}</p>
        </div>
      </a>
    `).join("");

    this.root.innerHTML = `
      <section class="mx-auto w-full max-w-7xl px-4 pb-5 pt-3 md:px-6 md:pb-7">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-stone-900 md:text-2xl">${heading}</h2>
          <span class="text-xs font-medium uppercase tracking-[0.08em] text-stone-500">News</span>
        </div>
        <div class="relative">
          <button
            type="button"
            data-news-nav="left"
            class="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#4f6655]/30 bg-white/95 text-[#2f4d3a] shadow-sm transition hover:bg-white md:flex"
            aria-label="Defiler les news vers la gauche"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button
            type="button"
            data-news-nav="right"
            class="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#4f6655]/30 bg-white/95 text-[#2f4d3a] shadow-sm transition hover:bg-white md:flex"
            aria-label="Defiler les news vers la droite"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>

          <div class="sierra-news-track flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-2 md:gap-4">
            ${cardsHtml}
          </div>
        </div>
      </section>
    `;

    this.bindNavControls();
  }

  bindNavControls() {
    const track = this.root.querySelector(".sierra-news-track");
    if (!track) return;

    const leftBtn = this.root.querySelector('[data-news-nav="left"]');
    const rightBtn = this.root.querySelector('[data-news-nav="right"]');
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
