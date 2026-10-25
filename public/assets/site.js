// Age / free / indoor filters for listing pages. Works without JS too: everything shows.
document.querySelectorAll(".filters").forEach((bar) => {
  const target = document.getElementById(bar.dataset.filterFor);
  if (!target) return;
  const state = { age: "all", free: false, indoor: false };
  const fromUrl = new URLSearchParams(location.search).get("age");
  if (fromUrl && bar.querySelector(`[data-age="${fromUrl}"]`)) state.age = fromUrl;

  function apply() {
    bar.querySelectorAll("[data-age]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.age === state.age)));
    bar.querySelectorAll("[data-flag]").forEach((b) => b.setAttribute("aria-pressed", String(state[b.dataset.flag])));
    target.querySelectorAll("[data-ages]").forEach((el) => {
      const ok =
        (state.age === "all" || el.dataset.ages.split(" ").includes(state.age)) &&
        (!state.free || el.dataset.free === "1") &&
        (!state.indoor || el.dataset.indoor === "1");
      el.hidden = !ok;
    });
    // Hide a whole day or month when the filters leave nothing in it.
    target.querySelectorAll("[data-day]").forEach((day) => {
      const items = [...day.querySelectorAll("[data-ages]")];
      day.hidden = items.length > 0 && items.every((i) => i.hidden);
    });
    // In a section, say so when the filters leave it empty.
    const groups = target.matches("[data-group]") ? [target] : [...target.querySelectorAll("[data-group]")];
    groups.forEach((g) => {
      const items = [...g.querySelectorAll("[data-ages]")];
      const msg = g.querySelector(".group-empty");
      if (msg) msg.hidden = !items.length || items.some((i) => !i.hidden);
    });
    const msg = target.querySelector(".empty-filter");
    if (msg) msg.hidden = [...target.querySelectorAll("[data-ages]")].some((i) => !i.hidden);
  }
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.age) state.age = b.dataset.age;
    if (b.dataset.flag) state[b.dataset.flag] = !state[b.dataset.flag];
    apply();
  });
  apply();
});

// Restaurant perk filters: show places that have every selected perk.
document.querySelectorAll(".perk-filters").forEach((bar) => {
  const target = document.getElementById(bar.dataset.perkFor);
  if (!target) return;
  const on = new Set();
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    on.has(b.dataset.perk) ? on.delete(b.dataset.perk) : on.add(b.dataset.perk);
    b.setAttribute("aria-pressed", String(on.has(b.dataset.perk)));
    target.querySelectorAll("[data-perks]").forEach((el) => {
      const perks = el.dataset.perks.split(" ");
      el.hidden = [...on].some((p) => !perks.includes(p));
    });
    target.querySelectorAll("[data-group]").forEach((g) => {
      const items = [...g.querySelectorAll("[data-perks]")];
      const msg = g.querySelector(".group-empty");
      if (msg) msg.hidden = items.some((i) => !i.hidden);
    });
  });
});

// Phone menu.
const menuBtn = document.querySelector(".menu-btn");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    const open = document.querySelector(".site-header").classList.toggle("nav-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
}

// Arrow buttons for sideways-scrolling rows (shown on larger screens when there's more to see).
document.querySelectorAll(".ecards.strip, .dcarousel").forEach((row) => {
  const wrap = document.createElement("div");
  wrap.className = "scroller";
  row.parentNode.insertBefore(wrap, row);
  wrap.appendChild(row);
  const mk = (dir, label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `scroll-btn ${dir}`;
    b.setAttribute("aria-label", label);
    b.textContent = dir === "prev" ? "‹" : "›";
    b.addEventListener("click", () => row.scrollBy({ left: (dir === "prev" ? -1 : 1) * row.clientWidth * 0.85, behavior: "smooth" }));
    wrap.appendChild(b);
    return b;
  };
  const prev = mk("prev", "Scroll back");
  const next = mk("next", "Scroll for more");
  const update = () => {
    const max = row.scrollWidth - row.clientWidth - 4;
    prev.hidden = row.scrollLeft <= 4;
    next.hidden = row.scrollLeft >= max;
  };
  row.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});

// Share buttons: the phone's share sheet when available, otherwise copy the link.
document.querySelectorAll("[data-share]").forEach((b) => {
  b.addEventListener("click", async () => {
    const { title, text, url } = b.dataset;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch { /* closed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      const note = document.querySelector(".share-note");
      if (note) { note.hidden = false; setTimeout(() => (note.hidden = true), 2500); }
    } catch { window.prompt("Copy this link:", url); }
  });
});

// Search page.
const q = document.getElementById("q");
if (q) {
  const out = document.getElementById("results");
  const count = document.querySelector(".search-count");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  let index = [];
  const run = () => {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { out.innerHTML = ""; count.textContent = ""; return; }
    const hits = index
      .map((x) => {
        const title = x.title.toLowerCase();
        const all = `${title} ${x.sub} ${x.text} ${x.t}`.toLowerCase();
        if (!words.every((w) => all.includes(w))) return null;
        return { x, score: words.filter((w) => title.includes(w)).length };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
    count.textContent = hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "Nothing found. Try a simpler word, like “park” or “story”.";
    out.innerHTML = hits.map(({ x }) => `<li><a href="${esc(x.url)}"><span class="tag t-age">${esc(x.t)}</span><b>${esc(x.title)}</b><span class="quiet">${esc(x.sub || "")}</span></a></li>`).join("");
  };
  const initial = new URLSearchParams(location.search).get("q");
  if (initial) q.value = initial;
  q.addEventListener("input", run);
  fetch("/search.json").then((r) => r.json()).then((d) => { index = d; run(); });
}
