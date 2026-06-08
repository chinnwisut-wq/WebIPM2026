const fallbackProducts = [
  {
    id: "all",
    label: "All Products",
    title: "All Products",
    summary: "ภาพรวมสินค้าและระบบความปลอดภัยของ IPM สำหรับองค์กรที่ต้องการระบบครบวงจร",
    items: [
      { name: "IP Network Camera", description: "กล้องวงจรปิดระบบเครือข่ายสำหรับองค์กร", tag: "Surveillance" },
      { name: "DVMS Platform", description: "ระบบจัดการและบันทึกวิดีโอดิจิตอล", tag: "Video Management" },
      { name: "Access Control", description: "ระบบควบคุมประตูและยืนยันตัวตน", tag: "Smart Access" },
      { name: "AI Threat Alerts", description: "ตรวจจับและแจ้งเตือนภัยคุกคามหลายรูปแบบ", tag: "Incident Protection" },
      { name: "IPM AIOC Dashboard", description: "แดชบอร์ดศูนย์ควบคุมกลางสำหรับภาพรวมเหตุการณ์", tag: "Control Room" }
    ]
  }
];

const fallbackNews = {
  updatedAt: "2026-06-05T00:00:00+07:00",
  items: [
    {
      category: "AI CCTV",
      title: "External AI video analytics update",
      summary: "ข่าวจากแหล่งภายนอกเกี่ยวกับ AI, CCTV และการวิเคราะห์ภาพสำหรับระบบรักษาความปลอดภัยองค์กร",
      sourceName: "Security Today",
      sourceUrl: "https://securitytoday.com/"
    },
    {
      category: "Cybersecurity",
      title: "Enterprise cybersecurity brief",
      summary: "ข่าวจากแหล่งภายนอกเกี่ยวกับความปลอดภัยไซเบอร์ เครือข่ายองค์กร และภัยคุกคามที่ควรติดตาม",
      sourceName: "The Hacker News",
      sourceUrl: "https://thehackernews.com/"
    }
  ]
};

const fallbackNewsEn = {
  updatedAt: "2026-06-05T00:00:00+07:00",
  items: [
    {
      category: "AI CCTV",
      title: "External AI video analytics update",
      summary: "External news covering AI, CCTV, and video analytics for enterprise security systems.",
      sourceName: "Security Today",
      sourceUrl: "https://securitytoday.com/"
    },
    {
      category: "Cybersecurity",
      title: "Enterprise cybersecurity brief",
      summary: "External news covering cybersecurity, network security, and emerging operational threats.",
      sourceName: "The Hacker News",
      sourceUrl: "https://thehackernews.com/"
    }
  ]
};

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path} ${response.status}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

function renderProductFilters(products) {
  const filterBar = document.querySelector("[data-product-filters]");
  const feature = document.querySelector("[data-product-feature]");
  const list = document.querySelector("[data-product-list]");
  if (!filterBar || !feature || !list) return;

  const iconForItem = (item, selected) => {
    const name = `${item.name} ${item.tag}`.toLowerCase();
    if (selected.id !== "all") return selected.id;
    if (name.includes("aioc") || name.includes("dashboard")) return "aioc-dashboard";
    if (name.includes("war room") || name.includes("dvms") || name.includes("video management")) return "dvms";
    if (name.includes("access")) return "access-control";
    if (name.includes("lpr") || name.includes("speed") || name.includes("license") || name.includes("radar") || name.includes("drone")) return "specialized-cameras";
    if (name.includes("alarm") || name.includes("fire") || name.includes("threat") || name.includes("weapon") || name.includes("flood") || name.includes("face") || name.includes("incident")) return "intrusion-alarm";
    if (name.includes("network")) return "network-it";
    return "ip-cameras";
  };

  const productLinkFor = (item, selected) => {
    if (item.url) return item.url;
    return `#products`;
  };

  const renderCategory = (categoryId) => {
    const selected = products.find((product) => product.id === categoryId) || products[0];
    filterBar.querySelectorAll(".filter-chip").forEach((button) => {
      button.classList.toggle("active", button.dataset.category === selected.id);
    });

    feature.innerHTML = `
      <div class="product-feature-icon" aria-hidden="true">
        <span class="filter-icon ${selected.id}"></span>
      </div>
      <span>Selected Category</span>
      <h3>${selected.title}</h3>
      <p>${selected.summary}</p>
    `;

    list.innerHTML = selected.items.map((item) => `
      <a class="product-card-link" href="${productLinkFor(item, selected)}" data-product-link="${selected.id}">
        <i class="product-card-icon filter-icon ${iconForItem(item, selected)}" aria-hidden="true"></i>
        <div>
          <strong>${item.name}</strong>
          <small>${item.description}</small>
          <span>${item.tag}</span>
        </div>
      </a>
    `).join("");
  };

  filterBar.innerHTML = products.map((product, index) => `
    <button class="filter-chip ${index === 0 ? "active" : ""}" type="button" data-category="${product.id}">
      <span class="filter-icon ${product.id}"></span>${product.label}
    </button>
  `).join("");

  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    renderCategory(button.dataset.category);
  });

  document.querySelectorAll("[data-filter-link]").forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(() => renderCategory(link.dataset.filterLink), 80);
    });
  });

  renderCategory("all");
}

function sourceLogo(item) {
  const sourceDomains = {
    "CNET": "https://www.cnet.com/",
    "vocal.media": "https://vocal.media/",
    "Cisco Newsroom": "https://newsroom.cisco.com/",
    "Communications Today": "https://www.communicationstoday.co.in/",
    "MarketsandMarkets": "https://www.marketsandmarkets.com/",
    "Security Today": "https://securitytoday.com/",
    "The Independent": "https://www.independent.co.uk/",
    "Korea JoongAng Daily": "https://koreajoongangdaily.joins.com/"
  };
  const domainUrl = sourceDomains[item.sourceName] || item.sourceUrl || "https://news.google.com/";
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(domainUrl)}&sz=128`;
}

function renderNews(news, lang) {
  const list = document.querySelector("[data-news-list]");
  const updated = document.querySelector("[data-news-updated]");
  if (!list) return;

  const date = news.updatedAt ? new Date(news.updatedAt) : null;
  if (updated && date && !Number.isNaN(date.getTime())) {
    if (lang === "en") {
      updated.textContent = `Last updated ${date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}`;
    } else {
      updated.textContent = `อัปเดตล่าสุด ${date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`;
    }
  }

  list.innerHTML = (news.items || []).slice(0, 6).map((item) => `
    <article class="news-card">
      <div class="news-image">
        <img src="${item.imageUrl || sourceLogo(item)}" alt="${item.sourceName || "News source"}" loading="lazy">
        <b>${item.sourceName || "Source"}</b>
      </div>
      <span>${item.category || "Security"}</span>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <a href="${item.sourceUrl}" target="_blank" rel="noreferrer">${lang === "en" ? "Read source" : "อ่านแหล่งข่าว"}</a>
    </article>
  `).join("");
}

function setupContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const lines = [
      `ชื่อ-นามสกุล: ${data.get("name") || ""}`,
      `บริษัท/องค์กร: ${data.get("company") || ""}`,
      `เบอร์โทรหรืออีเมล: ${data.get("contact") || ""}`,
      `หมวดที่สนใจ: ${data.get("interest") || ""}`,
      "",
      "รายละเอียด:",
      data.get("message") || ""
    ];
    const subject = encodeURIComponent("สอบถามระบบความปลอดภัยจากเว็บไซต์ IPM");
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:info@ipm.co.th?subject=${subject}&body=${body}`;
  });
}

function setupLanguageToggle() {
  document.querySelectorAll(".language-switch a").forEach((link) => {
    if (link.getAttribute("href") === window.location.pathname.split("/").pop()) {
      link.classList.add("active");
    }
  });
}

function setupSystemCarousel() {
  const carousel = document.querySelector("[data-system-carousel]");
  const track = carousel?.querySelector(".system-track");
  if (!carousel || !track) return;

  const slides = Array.from(track.querySelectorAll(".system-slide"));
  if (slides.length <= 1) return;

  let index = 0;
  let paused = false;

  const goToSlide = () => {
    const slide = slides[index];
    if (!slide) return;
    const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
    const offset = index * (slide.offsetWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
  };

  const tick = () => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    index = (index + 1) % slides.length;
    goToSlide();
  };

  carousel.addEventListener("mouseenter", () => { paused = true; });
  carousel.addEventListener("mouseleave", () => { paused = false; });
  carousel.addEventListener("touchstart", () => { paused = true; }, { passive: true });
  carousel.addEventListener("touchend", () => { window.setTimeout(() => { paused = false; }, 1800); }, { passive: true });
  window.addEventListener("resize", goToSlide);

  window.setInterval(tick, 4200);
}

function setupServiceModal() {
  const modal = document.querySelector("[data-image-modal]");
  const image = modal?.querySelector("[data-modal-image]");
  const title = modal?.querySelector("[data-modal-title]");
  if (!modal || !image || !title) return;

  let lastFocused = null;

  const closeModal = () => {
    modal.hidden = true;
    image.removeAttribute("src");
    image.alt = "";
    document.body.classList.remove("modal-open");
    if (lastFocused) lastFocused.focus();
  };

  const openModal = (card) => {
    const imagePath = card.dataset.serviceImage;
    const modalTitle = card.dataset.serviceTitle || "Service Detail";
    if (!imagePath) return;
    lastFocused = document.activeElement;
    title.textContent = modalTitle;
    image.src = imagePath;
    image.alt = modalTitle;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector("[data-modal-close]")?.focus();
  };

  document.querySelectorAll("[data-service-image]").forEach((card) => {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(card);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(card);
      }
    });
  });

  modal.querySelectorAll("[data-modal-close]").forEach((control) => {
    control.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
}

function setupChatAssistant(lang) {
  const root = document.querySelector("[data-chat-assistant]");
  if (!root) return;

  const copy = {
    th: {
      title: "IPM Assistant",
      subtitle: "ปรึกษาระบบงานเบื้องต้น",
      toggle: "สอบถาม IPM",
      close: "ปิดแชท",
      intro: "สวัสดีครับ IPM พร้อมช่วยสรุปข้อมูลบริการเบื้องต้น และเชื่อมต่อทีมงานเพื่อปรึกษาระบบงาน",
      actions: [
        { label: "โทรหา IPM", href: "tel:+6625311891" },
        { label: "ส่งอีเมล", href: "mailto:info@ipm.co.th" },
        { label: "ฟอร์มติดต่อ", href: "#contact" }
      ],
      topics: [
        {
          label: "CCTV / VMS",
          answer: "IPM ให้บริการระบบกล้องวงจรปิด, IP Camera, VMS/DVMS, Video Wall, AI Video Analytics และการเชื่อมต่อศูนย์ควบคุมกลาง"
        },
        {
          label: "Access Control",
          answer: "รองรับระบบควบคุมประตู, Face Recognition, Biometrics, Visitor Management และระบบบันทึกเวลาในองค์กร"
        },
        {
          label: "AI Alerts / AIOC",
          answer: "รองรับการตรวจจับเหตุการณ์ เช่น ใบหน้า ยานพาหนะ ป้ายทะเบียน ความเร็ว อาวุธ น้ำท่วม และภัยคุกคามอื่น ๆ ผ่าน Dashboard และศูนย์ควบคุม"
        },
        {
          label: "Network / IT",
          answer: "ให้บริการโครงสร้างพื้นฐาน Network, Server, Storage, Monitoring, Backup และระบบรักษาความปลอดภัยเครือข่ายสำหรับองค์กร"
        },
        {
          label: "ขอใบเสนอราคา",
          answer: "กรุณาเตรียมข้อมูลพื้นที่ติดตั้ง จำนวนจุดกล้อง/ประตู ระบบเดิมที่มี และช่องทางติดต่อ จากนั้นส่งผ่านฟอร์มหรืออีเมล info@ipm.co.th"
        }
      ]
    },
    en: {
      title: "IPM Assistant",
      subtitle: "Quick system consultation",
      toggle: "Ask IPM",
      close: "Close chat",
      intro: "Hello. IPM can help summarize core services and connect you with the team for system consultation.",
      actions: [
        { label: "Call IPM", href: "tel:+6625311891" },
        { label: "Email", href: "mailto:info@ipm.co.th" },
        { label: "Contact Form", href: "#contact" }
      ],
      topics: [
        {
          label: "CCTV / VMS",
          answer: "IPM provides CCTV, IP cameras, VMS/DVMS, video wall, AI video analytics, and centralized control center integration."
        },
        {
          label: "Access Control",
          answer: "We support door access control, face recognition, biometrics, visitor management, and attendance workflows."
        },
        {
          label: "AI Alerts / AIOC",
          answer: "AI monitoring can detect faces, vehicles, license plates, speed, weapons, flooding, and other threats through dashboards and control rooms."
        },
        {
          label: "Network / IT",
          answer: "IPM supports enterprise network infrastructure, servers, storage, monitoring, backup, and secure connectivity."
        },
        {
          label: "Request Quote",
          answer: "Please prepare site details, camera/door counts, existing systems, and contact information, then send them through the form or info@ipm.co.th."
        }
      ]
    }
  }[lang];

  root.innerHTML = `
    <button class="chat-toggle" type="button" aria-expanded="false" aria-controls="ipm-chat-panel">
      <span class="chat-toggle-icon" aria-hidden="true"></span>
      <span>${copy.toggle}</span>
    </button>
    <section class="chat-panel" id="ipm-chat-panel" hidden aria-label="${copy.title}">
      <div class="chat-head">
        <div>
          <strong>${copy.title}</strong>
          <span>${copy.subtitle}</span>
        </div>
        <button class="chat-close" type="button" aria-label="${copy.close}">×</button>
      </div>
      <div class="chat-body" data-chat-body>
        <div class="chat-message bot">${copy.intro}</div>
        <div class="chat-topics">
          ${copy.topics.map((topic, index) => `<button type="button" data-chat-topic="${index}">${topic.label}</button>`).join("")}
        </div>
      </div>
      <div class="chat-actions">
        ${copy.actions.map((action) => `<a href="${action.href}">${action.label}</a>`).join("")}
      </div>
    </section>
  `;

  const toggle = root.querySelector(".chat-toggle");
  const panel = root.querySelector(".chat-panel");
  const close = root.querySelector(".chat-close");
  const body = root.querySelector("[data-chat-body]");

  const setOpen = (isOpen) => {
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
    root.classList.toggle("is-open", isOpen);
    if (isOpen) close.focus();
  };

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));

  root.querySelectorAll("[data-chat-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      const topic = copy.topics[Number(button.dataset.chatTopic)];
      if (!topic) return;
      body.querySelectorAll(".chat-message.answer").forEach((message) => message.remove());
      const question = document.createElement("div");
      question.className = "chat-message user answer";
      question.textContent = topic.label;
      const answer = document.createElement("div");
      answer.className = "chat-message bot answer";
      answer.textContent = topic.answer;
      body.append(question, answer);
      answer.scrollIntoView({ block: "nearest" });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
}

async function init() {
  const lang = document.documentElement.lang === "en" ? "en" : "th";
  setupLanguageToggle();
  setupContactForm();
  setupSystemCarousel();
  setupServiceModal();
  setupChatAssistant(lang);
  const productPath = lang === "en" ? "data/products-en.json?v=20260608g" : "data/products.json?v=20260608g";
  const newsPath = lang === "en" ? "data/news-en.json?v=20260608g" : "data/news.json?v=20260608g";
  const [products, news] = await Promise.all([
    loadJson(productPath, fallbackProducts),
    loadJson(newsPath, lang === "en" ? fallbackNewsEn : fallbackNews)
  ]);
  renderProductFilters(products);
  renderNews(news, lang);
}

init();
