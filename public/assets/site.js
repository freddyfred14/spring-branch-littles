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
