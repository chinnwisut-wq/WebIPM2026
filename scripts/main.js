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
      { name: "Alarm & Fire", description: "ระบบแจ้งเตือนภัยบุกรุกและเพลิงไหม้", tag: "Incident Protection" }
    ]
  }
];

const fallbackNews = {
  updatedAt: "2026-06-05T00:00:00+07:00",
  items: [
    {
      category: "AI CCTV",
      title: "AI Video Analytics ช่วยยกระดับการเฝ้าระวังองค์กร",
      summary: "ระบบกล้องวงจรปิดยุคใหม่สามารถต่อยอดสู่การวิเคราะห์เหตุการณ์และการแจ้งเตือนเชิงรุกได้",
      sourceName: "IPM Weekly Brief",
      sourceUrl: "https://www.ipm.co.th/"
    }
  ]
};

const fallbackNewsEn = {
  updatedAt: "2026-06-05T00:00:00+07:00",
  items: [
    {
      category: "AI CCTV",
      title: "AI Video Analytics Moves Surveillance Beyond Recording",
      summary: "Modern CCTV systems can support proactive monitoring through video analytics and abnormal-event detection.",
      sourceName: "IPM Weekly Brief",
      sourceUrl: "https://www.ipm.co.th/"
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
    if (name.includes("dvms") || name.includes("video management")) return "dvms";
    if (name.includes("access")) return "access-control";
    if (name.includes("alarm") || name.includes("fire")) return "intrusion-alarm";
    if (name.includes("network")) return "network-it";
    return "ip-cameras";
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
      <article>
        <i class="product-card-icon filter-icon ${iconForItem(item, selected)}" aria-hidden="true"></i>
        <div>
          <strong>${item.name}</strong>
          <small>${item.description}</small>
          <span>${item.tag}</span>
        </div>
      </article>
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

async function init() {
  const lang = document.documentElement.lang === "en" ? "en" : "th";
  setupLanguageToggle();
  setupContactForm();
  const productPath = lang === "en" ? "data/products-en.json?v=20260605" : "data/products.json?v=20260605";
  const newsPath = lang === "en" ? "data/news-en.json?v=20260605" : "data/news.json?v=20260605";
  const [products, news] = await Promise.all([
    loadJson(productPath, fallbackProducts),
    loadJson(newsPath, lang === "en" ? fallbackNewsEn : fallbackNews)
  ]);
  renderProductFilters(products);
  renderNews(news, lang);
}

init();
