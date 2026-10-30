// Danny the Dino: the cartoon version of the baby dinosaur in the logo, drawn in moving parts (body, tail,
// neck, head, eyes, mouth, arm) so he can bob, wag, wave, point, jump and talk. sceneHtml() returns a 1080×1920
// page with a window.render(t, amp) function; scripts/danny-video.mjs steps it frame by frame into a video.
const G = { body: "#aac58c", light: "#c9dcaf", belly: "#eef3dc", spot: "#5f8f62", line: "#3f6342", cheek: "#f2a7a7", mouth: "#3a2320", tongue: "#e8798d", sun: "#f3b562" };

// Danny in a 600×800 box, feet at the bottom. Each part has an id the animation moves.
export const DANNY_SVG = `
<svg id="danny" viewBox="0 0 600 800" width="780" height="1040" style="overflow:visible">
  <g id="d-all">
    <g id="d-tail" style="transform-origin:190px 560px">
      <path d="M200 520 C 120 540, 70 600, 30 560 C 10 540, 30 515, 52 528 C 80 548, 120 520, 205 600 Z" fill="${G.body}" stroke="${G.line}" stroke-width="6" stroke-linejoin="round"/>
    </g>
    <g fill="${G.body}" stroke="${G.line}" stroke-width="6">
      <rect x="168" y="640" width="64" height="118" rx="30"/><rect x="380" y="640" width="64" height="118" rx="30"/>
    </g>
    <ellipse cx="300" cy="590" rx="175" ry="125" fill="${G.body}" stroke="${G.line}" stroke-width="6"/>
    <g fill="${G.body}" stroke="${G.line}" stroke-width="6">
      <rect x="226" y="660" width="66" height="112" rx="30"/><rect x="330" y="660" width="66" height="112" rx="30"/>
    </g>
    <ellipse cx="320" cy="630" rx="112" ry="72" fill="${G.belly}"/>
    <g fill="${G.spot}" opacity=".85"><circle cx="210" cy="540" r="18"/><circle cx="250" cy="505" r="12"/><circle cx="175" cy="590" r="11"/><circle cx="268" cy="560" r="9"/></g>
    <g fill="#fff" opacity=".9"><ellipse cx="200" cy="758" rx="30" ry="6"/><ellipse cx="258" cy="770" rx="30" ry="6"/><ellipse cx="362" cy="770" rx="30" ry="6"/><ellipse cx="412" cy="758" rx="30" ry="6"/></g>
    <g id="d-neckhead">
      <path d="M392 560 C 450 450, 395 360, 418 250" fill="none" stroke="${G.line}" stroke-width="104" stroke-linecap="round"/>
      <path d="M392 560 C 450 450, 395 360, 418 250" fill="none" stroke="${G.body}" stroke-width="90" stroke-linecap="round"/>
      <g fill="${G.spot}" opacity=".85"><circle cx="430" cy="420" r="13"/><circle cx="410" cy="350" r="10"/><circle cx="440" cy="480" r="9"/></g>
      <g id="d-head" style="transform-origin:418px 250px">
        <ellipse cx="440" cy="185" rx="118" ry="100" fill="${G.body}" stroke="${G.line}" stroke-width="6"/>
        <ellipse cx="420" cy="140" rx="70" ry="30" fill="${G.light}" opacity=".7"/>
        <g fill="${G.spot}" opacity=".85"><circle cx="370" cy="125" r="17"/><circle cx="405" cy="100" r="11"/><circle cx="345" cy="165" r="10"/></g>
        <ellipse cx="420" cy="225" rx="22" ry="13" fill="${G.cheek}" opacity=".75"/><ellipse cx="530" cy="215" rx="22" ry="13" fill="${G.cheek}" opacity=".75"/>
        <g id="d-eyes">
          <g id="d-eyes-open">
            <g class="eye" style="transform-origin:448px 175px"><ellipse cx="448" cy="175" rx="17" ry="21" fill="${G.mouth}"/><circle cx="454" cy="167" r="6" fill="#fff"/></g>
            <g class="eye" style="transform-origin:515px 170px"><ellipse cx="515" cy="170" rx="17" ry="21" fill="${G.mouth}"/><circle cx="521" cy="162" r="6" fill="#fff"/></g>
          </g>
          <g id="d-eyes-happy" style="display:none" fill="none" stroke="${G.mouth}" stroke-width="8" stroke-linecap="round">
            <path d="M430 180 Q 448 158 466 180"/><path d="M497 175 Q 515 153 533 175"/>
          </g>
        </g>
        <g id="d-mouth-closed"><path d="M455 228 Q 482 252 509 226" fill="none" stroke="${G.mouth}" stroke-width="8" stroke-linecap="round"/></g>
        <g id="d-mouth-open" style="transform-origin:482px 232px;display:none">
          <path d="M452 224 Q 482 222 512 222 Q 510 268 482 270 Q 454 268 452 224 Z" fill="${G.mouth}"/>
          <ellipse cx="482" cy="258" rx="17" ry="9" fill="${G.tongue}"/>
        </g>
        <g id="d-hat" style="display:none;transform:translate(322px,2px) rotate(-10deg)">
          <ellipse cx="110" cy="96" rx="92" ry="20" fill="#1a1028" stroke="#f6d9a6" stroke-width="4"/>
          <path d="M120 -60 C 100 -20 86 30 78 88 h 70 C 140 40 132 0 140 -30 c -8 -6 -14 -16 -20 -30 z" fill="#1a1028" stroke="#f6d9a6" stroke-width="4" stroke-linejoin="round"/>
          <path d="M80 72 h 68 l 3 16 h -74 z" fill="#f58b2a"/>
        </g>
      </g>
    </g>
    <g id="d-arm" style="transform-origin:420px 585px">
      <path d="M420 585 C 470 590, 505 600, 540 595" fill="none" stroke="${G.line}" stroke-width="40" stroke-linecap="round"/>
      <path d="M420 585 C 470 590, 505 600, 540 595" fill="none" stroke="${G.body}" stroke-width="28" stroke-linecap="round"/>
      <circle cx="543" cy="595" r="24" fill="${G.body}" stroke="${G.line}" stroke-width="6"/>
    </g>
  </g>
</svg>`;

// The page Danny performs in. `lines` are the spoken lines with their start/end times and optional event card.
export function sceneHtml({ title, lines, logo, theme = "halloween" }) {
  const night = theme === "halloween";
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@700;800&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 1080px; height: 1920px; overflow: hidden; position: relative; font-family: Nunito, sans-serif;
    background: ${night ? "linear-gradient(175deg,#24173d 0%,#3d2358 55%,#57306a 100%)" : "linear-gradient(175deg,#dff0f7,#fbf6ec)"}; }
  .fred { font-family: Fredoka, sans-serif; }
  #card { position: absolute; left: 70px; right: 70px; top: 300px; background: #fffaf1; border-radius: 48px; padding: 40px 48px 44px;
    box-shadow: 0 14px 0 #f08a24, 0 30px 50px rgba(0,0,0,.35); transform-origin: 50% 50%; }
  #card .when { display: inline-block; background: #7b4bb0; color: #fff; font-weight: 800; font-size: 34px; letter-spacing: .06em; text-transform: uppercase; padding: 10px 26px; border-radius: 999px; }
  #card h2 { font-family: Fredoka, sans-serif; font-weight: 700; font-size: 76px; line-height: 1.02; margin: 22px 0 14px; color: #241e1a; }
  #card p { font-weight: 800; font-size: 38px; line-height: 1.3; color: #6d645b; }
  #bubble { position: absolute; left: 676px; right: 34px; top: 820px; background: #fff; border-radius: 40px; padding: 30px 36px;
    font-family: Fredoka, sans-serif; font-weight: 600; font-size: 46px; line-height: 1.18; color: #241e1a; box-shadow: 0 10px 0 rgba(0,0,0,.18); }
  #bubble:after { content: ""; position: absolute; left: -34px; bottom: 40px; border-right: 44px solid #fff; border-top: 22px solid transparent; border-bottom: 22px solid transparent; }
</style></head><body>
  ${night ? `<div style="position:absolute;left:900px;top:120px;width:130px;height:130px;border-radius:50%;background:#fff3c4;box-shadow:0 0 90px 20px rgba(255,240,180,.35)"></div>` : ""}
  <div id="stars"></div>
  <div id="bats"></div>
  <div style="position:absolute;left:70px;top:90px;display:flex;align-items:center;gap:26px">
    <span style="width:150px;height:150px;border-radius:50%;background:#fffaf1;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 0 #f08a24"><img src="${logo}" style="height:118px"></span>
    <span class="fred" style="font-weight:700;font-size:64px;line-height:1;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.25)">${title}</span>
  </div>
  <div id="card" style="opacity:0"><span class="when"></span><h2></h2><p></p></div>
  <svg style="position:absolute;left:0;bottom:0" width="1080" height="420" viewBox="0 0 1080 420"><path d="M0 170 Q 270 80 560 150 T 1080 120 V420 H0 Z" fill="${night ? "#1d3a2a" : "#b9d59c"}"/><path d="M0 250 Q 300 190 620 240 T 1080 220 V420 H0 Z" fill="${night ? "#244a33" : "#a4c785"}"/></svg>
  <div id="pumpkins"></div>
  <div id="danny-wrap" style="position:absolute;left:-70px;top:820px;width:780px;height:1040px;transform-origin:390px 1040px">${DANNY_SVG}</div>
  <div id="bubble" style="opacity:0"></div>
<script>
  const LINES = ${JSON.stringify(lines)};
  const $ = (s) => document.querySelector(s);
  const ease = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
  const pop = (x) => { x = Math.min(Math.max(x, 0), 1); return x < 0.6 ? ease(x / 0.6) * 1.08 : 1.08 - 0.08 * ease((x - 0.6) / 0.4); };
  // Twinkling stars and bats, placed once.
  const stars = [...Array(40)].map((_, i) => [(i * 137) % 1080, (i * 89) % 900, 2 + (i % 3)]);
  $("#stars").innerHTML = stars.map(([x, y, r]) => '<div class="star" style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + r * 2 + 'px;height:' + r * 2 + 'px;border-radius:50%;background:#fff"></div>').join("");
  const BAT = '<svg width="140" height="70" viewBox="0 0 100 50"><path fill="#140d1f" d="M50 18c3-6 6-8 6-8l2 6c4-3 9-3 9-3-1 3 0 6 0 6 6-6 18-7 33-4-8 3-12 9-13 17-5-4-11-5-16-2 0-4-3-7-7-8-3 3-9 7-14 10-5-3-11-7-14-10-4 1-7 4-7 8-5-3-11-2-16 2C14 23 10 17 2 14c15-3 27-2 33 4 0 0 1-3 0-6 0 0 5 0 9 3l2-6s3 2 6 8z"/></svg>';
  $("#bats").innerHTML = ${night} ? [0, 1, 2].map((i) => '<div class="bat" style="position:absolute">' + BAT + '</div>').join("") : "";
  const PUMPKIN = (w) => '<svg width="' + w + '" height="' + w + '" viewBox="0 0 100 100"><path d="M50 22c-2-8 2-14 8-16" stroke="#4b7759" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="58" rx="24" ry="32" fill="#e8741c"/><ellipse cx="68" cy="58" rx="24" ry="32" fill="#e8741c"/><ellipse cx="50" cy="58" rx="22" ry="34" fill="#f58b2a"/><path d="M34 50l8 7H30zM66 50l4 7H58zM34 70q16 12 32 0l-5 2-3-4-4 5-4-5-4 5-4-5-3 4z" fill="#3a1f0b"/></svg>';
  $("#pumpkins").innerHTML = ${night} ? '<div style="position:absolute;left:640px;top:1700px">' + PUMPKIN(150) + '</div><div style="position:absolute;left:820px;top:1740px">' + PUMPKIN(110) + '</div>' : "";
  if (${night}) $("#d-hat").style.display = "";
  let shownCard = -1;

  // Draw the frame at time t (seconds) with the voice loudness amp (0–1).
  window.render = (t, amp) => {
    const i = LINES.findIndex((l) => t >= l.start && t < l.end + 0.25);
    const line = LINES[i] || null;
    const act = line?.action || "talk";
    // Idle life: a gentle bob, tail wag, head tilt; nod a little with the voice.
    let jump = 0;
    if (act === "jump" && line) { const p = (t - line.start) % 0.9 / 0.9; jump = Math.sin(p * Math.PI) * 120; }
    const bob = Math.sin(t * 2 * Math.PI * 1.1) * 8;
    $("#danny-wrap").style.transform = "translateY(" + (bob - jump) + "px) scaleY(" + (1 + Math.sin(t * 7) * 0.006) + ")";
    $("#d-tail").style.transform = "rotate(" + Math.sin(t * 4) * 10 + "deg)";
    $("#d-head").style.transform = "rotate(" + (Math.sin(t * 1.6) * 5 + amp * 6) + "deg)";
    // Arm: wave hello, point at the event card, or rest.
    let arm = 10 + Math.sin(t * 3) * 4;
    if (act === "wave") arm = -70 + Math.sin(t * 2 * Math.PI * 2.2) * 28;
    else if (act === "point") arm = -48 + Math.sin(t * 5) * 5;
    else if (act === "jump") arm = -60 + Math.sin(t * 2 * Math.PI * 2.5) * 20;
    $("#d-arm").style.transform = "rotate(" + arm + "deg)";
    // Eyes: blink every few seconds; happy squints on greetings and the big finish.
    const happy = act === "wave" || act === "jump";
    $("#d-eyes-open").style.display = happy ? "none" : "";
    $("#d-eyes-happy").style.display = happy ? "" : "none";
    const blink = (t % 3.4) < 0.12 ? 0.1 : 1;
    document.querySelectorAll(".eye").forEach((e) => (e.style.transform = "scaleY(" + blink + ")"));
    // Mouth follows the voice.
    const open = amp > 0.06;
    $("#d-mouth-open").style.display = open ? "" : "none";
    $("#d-mouth-closed").style.display = open ? "none" : "";
    $("#d-mouth-open").style.transform = "scaleY(" + Math.min(1.1, 0.35 + amp * 1.6) + ")";
    // Speech bubble shows what he's saying (captions for people watching with the sound off).
    const b = $("#bubble");
    if (line) { if (b.dataset.i !== String(i)) { b.textContent = line.say; b.dataset.i = i; } b.style.opacity = 1; b.style.transform = "scale(" + pop((t - line.start) / 0.35) + ")"; }
    else b.style.opacity = 0;
    // The event card pops in when Danny starts talking about it.
    const card = $("#card");
    const ci = line?.card ? i : -1;
    if (ci >= 0) {
      if (shownCard !== ci) { card.querySelector(".when").textContent = line.card.when; card.querySelector("h2").textContent = line.card.title; card.querySelector("p").textContent = line.card.detail; shownCard = ci; }
      card.style.opacity = 1;
      card.style.transform = "scale(" + pop((t - line.start) / 0.45) + ") rotate(" + (ci % 2 ? 1.2 : -1.2) + "deg)";
    } else card.style.opacity = 0;
    // Night sky: bats flutter across, stars twinkle.
    document.querySelectorAll(".bat").forEach((el, k) => {
      const speed = 90 + k * 35, x = ((t * speed + k * 420) % 1500) - 200, y = 150 + k * 120 + Math.sin(t * 3 + k) * 25;
      el.style.transform = "translate(" + x + "px," + y + "px) scaleY(" + (0.7 + Math.abs(Math.sin(t * 9 + k)) * 0.5) + ")";
    });
    document.querySelectorAll(".star").forEach((el, k) => (el.style.opacity = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + k))));
  };
  window.render(0, 0);
</script></body></html>`;
}
