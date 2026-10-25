// Age / free / indoor filters for listing pages. Works without JS too: everything shows.
document.querySelectorAll(".filters").forEach((bar) => {
  const target = document.getElementById(bar.dataset.filterFor);
  if (!target) return;
  const state = { age: "all", free: false, indoor: false };
  const ageSelect = bar.querySelector("[data-age-select]");
  const fromUrl = new URLSearchParams(location.search).get("age");
  if (fromUrl && ageSelect?.querySelector(`option[value="${fromUrl}"]`)) state.age = fromUrl;
  ageSelect?.addEventListener("change", () => { state.age = ageSelect.value; apply(); });

  function apply() {
    if (ageSelect) {
      ageSelect.value = state.age;
      ageSelect.classList.toggle("on", state.age !== "all");
    }
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
    const b = e.target.closest("button[data-flag]");
    if (!b) return;
    state[b.dataset.flag] = !state[b.dataset.flag];
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

// Menus: "More" in the menu bar, and "Menu" on phones. Both close on Escape or a tap elsewhere.
const header = document.querySelector(".site-header");
const menuBtn = document.querySelector(".menu-btn");
const moreBtn = document.querySelector(".more-btn");
const setMenu = (open) => {
  header.classList.toggle("nav-open", open);
  menuBtn?.setAttribute("aria-expanded", String(open));
};
const setMore = (open) => {
  moreBtn?.closest(".nav-more").classList.toggle("open", open);
  moreBtn?.setAttribute("aria-expanded", String(open));
};
menuBtn?.addEventListener("click", () => setMenu(!header.classList.contains("nav-open")));
moreBtn?.addEventListener("click", () => setMore(moreBtn.getAttribute("aria-expanded") !== "true"));
document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-more")) setMore(false);
  if (!e.target.closest(".site-header")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (moreBtn?.getAttribute("aria-expanded") === "true") { setMore(false); moreBtn.focus(); }
  if (header?.classList.contains("nav-open")) { setMenu(false); menuBtn.focus(); }
});

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

// Subscribe pop-up: once, a few seconds after arriving. Not again for 30 days after "No thanks",
// and never after someone subscribes from any form on the site.
const pop = document.querySelector(".sub-pop");
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
document.querySelectorAll(".signup-form").forEach((f) => f.addEventListener("submit", () => store.set("sbl-subscribed", "1")));
// Inside the installed app, people already follow along: skip the newsletter pop-up there.
const inApp = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
if (pop && typeof pop.showModal === "function" && !inApp) {
  const snoozed = Number(store.get("sbl-pop-snoozed") || 0) > Date.now() - 30 * 864e5;
  if (!store.get("sbl-subscribed") && !snoozed) {
    // After 5 seconds, or sooner once someone has scrolled a bit (people on phones scroll right away).
    let shown = false;
    const show = () => {
      if (shown || document.querySelector("dialog[open]")) return;
      shown = true;
      pop.showModal();
      pop.focus();
    };
    setTimeout(show, 5000);
    const onScroll = () => { if (scrollY > innerHeight * 0.8) { removeEventListener("scroll", onScroll); show(); } };
    addEventListener("scroll", onScroll, { passive: true });
  }
  const close = () => { store.set("sbl-pop-snoozed", String(Date.now())); pop.close(); };
  pop.querySelectorAll("[data-pop-close]").forEach((b) => b.addEventListener("click", close));
  pop.addEventListener("cancel", () => store.set("sbl-pop-snoozed", String(Date.now())));
  // A tap on the dimmed background closes it too.
  pop.addEventListener("click", (e) => {
    if (e.target !== pop) return;
    const r = pop.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });
}

// ---------- The app: offline support, install, alerts ----------
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/OneSignalSDKWorker.js").catch(() => {});

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /android/i.test(navigator.userAgent);
const show = (sel, on) => document.querySelectorAll(sel).forEach((el) => (el.hidden = !on));

// /app/: show only the install steps that fit this phone.
if (document.querySelector("[data-install-step]")) {
  show("[data-installed]", inApp);
  show("[data-install-step]", !inApp);
  show("[data-install-ios]", isIOS || !isAndroid);
  show("[data-install-android]", isAndroid || !isIOS);
  show("[data-push-ios-note]", isIOS && !inApp);
}
// Chrome and Edge offer a one-tap install.
let installEvent = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
  show("[data-install]", true);
  show("[data-install-manual]", false);
  show("[data-install-android]", true);
});
document.querySelectorAll("[data-install]").forEach((b) => b.addEventListener("click", async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  show("[data-install]", false);
}));

// Alerts, through OneSignal (only on pages where it's set up).
const withOneSignal = (fn) => window.OneSignalDeferred && window.OneSignalDeferred.push(fn);
const pushStatus = (text) => document.querySelectorAll("[data-push-status]").forEach((el) => (el.textContent = text));
function refreshPush(OneSignal) {
  const on = OneSignal.Notifications.permission && OneSignal.User.PushSubscription.optedIn;
  document.querySelectorAll("[data-push-on]").forEach((b) => {
    b.disabled = !!on;
    b.textContent = on ? "Alerts are on ✓" : b.closest("[data-app-prompt]") ? "Turn on" : "Turn on alerts";
  });
  if (on) show("[data-app-prompt]", false);
  if (!OneSignal.Notifications.isPushSupported()) {
    pushStatus(isIOS && !inApp ? "First add the app to your home screen (step 1), then open it from there and tap this button." : "This browser can't show alerts. Try Chrome, Safari or Edge.");
    document.querySelectorAll("[data-push-on]").forEach((b) => (b.disabled = true));
  } else if (OneSignal.Notifications.permissionNative === "denied") {
    pushStatus("Alerts are blocked for this site. Allow notifications for Spring Branch Littles in your phone's settings, then try again.");
  } else {
    pushStatus(on ? "You'll get the weekend's picks every Thursday." : "");
  }
}
withOneSignal((OneSignal) => {
  refreshPush(OneSignal);
  OneSignal.Notifications.addEventListener("permissionChange", () => refreshPush(OneSignal));
  OneSignal.User.PushSubscription.addEventListener("change", () => refreshPush(OneSignal));
  // In the installed app, nudge once (until dismissed) if alerts aren't on yet.
  const dismissed = store.get("sbl-app-prompt-closed");
  if (inApp && !dismissed && OneSignal.Notifications.isPushSupported() && OneSignal.Notifications.permissionNative === "default") show("[data-app-prompt]", true);
});
document.querySelectorAll("[data-push-on]").forEach((b) => b.addEventListener("click", () => withOneSignal(async (OneSignal) => {
  await OneSignal.Notifications.requestPermission();
  if (OneSignal.Notifications.permission) await OneSignal.User.PushSubscription.optIn();
  refreshPush(OneSignal);
})));
document.querySelectorAll("[data-app-prompt-close]").forEach((b) => b.addEventListener("click", () => {
  store.set("sbl-app-prompt-closed", "1");
  show("[data-app-prompt]", false);
}));
