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
    target.querySelectorAll("[data-day]").forEach((day) => {
      const items = day.querySelectorAll("[data-ages]");
      const msg = day.querySelector(".empty-filter");
      if (msg) msg.hidden = !items.length || [...items].some((i) => !i.hidden);
    });
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
