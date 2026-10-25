// Hand-built SVG illustrations of kids playing, in the logo's soft watercolor style:
// rounded bodies, happy closed eyes like the dino's, rosy cheeks, slightly wobbly painted edges.
// The paint filter (#wc) is defined once per page by WATERCOLOR_DEFS.

const P = {
  ink: "#3a2e28", cheek: "#f2a08f",
  sage: "#9db57f", sageDeep: "#4b7759", sageSoft: "#dfe9cf", sky: "#7ea6c9", skyDeep: "#4b7ca6", skySoft: "#dbe8f3",
  sun: "#eeb064", sunSoft: "#fbe3c3", coral: "#ec8f78", peach: "#f6cfb4", grass: "#8f9f5c", cream: "#fffaf0", bark: "#a77b56",
};
const SKIN = ["#f6d3b8", "#e9b58f", "#c98d63", "#9a6646"];
const HAIR = { brown: "#6b4a2e", dark: "#2f2420", ginger: "#c9793a", blond: "#d9a85b" };

export const WATERCOLOR_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <filter id="wc" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="wobbly"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 .2 .82  0 0 0 .2 .82  0 0 0 .2 .82  0 0 0 0 1" result="paper"/>
    <feBlend in="wobbly" in2="paper" mode="multiply" result="tex"/>
    <feComposite in="tex" in2="wobbly" operator="in"/>
  </filter>
</defs></svg>`;

const r1 = (n) => Math.round(n * 10) / 10;

function hair(cx, cy, r, color, style) {
  const c = (x, y) => `${r1(cx + x * r)} ${r1(cy + y * r)}`;
  const cap = `M${c(-1.02, 0)} Q${c(-1.05, -1.2)} ${c(0, -1.1)} Q${c(1.05, -1.2)} ${c(1.02, 0)} Q${c(0.55, -0.55)} ${c(0, -0.52)} Q${c(-0.6, -0.48)} ${c(-1.02, 0)}Z`;
  switch (style) {
    case "bob":
      return `<path fill="${color}" d="M${c(-1.08, 0.45)} Q${c(-1.2, -1.25)} ${c(0, -1.12)} Q${c(1.2, -1.25)} ${c(1.08, 0.45)} L${c(0.82, 0.45)} Q${c(0.8, -0.35)} ${c(0.1, -0.5)} Q${c(-0.6, -0.4)} ${c(-0.82, 0.45)}Z"/>`;
    case "pigtails":
      return `<circle cx="${r1(cx - r * 1.12)}" cy="${r1(cy - r * 0.15)}" r="${r1(r * 0.42)}" fill="${color}"/><circle cx="${r1(cx + r * 1.12)}" cy="${r1(cy - r * 0.15)}" r="${r1(r * 0.42)}" fill="${color}"/><path fill="${color}" d="${cap}"/>`;
    case "bun":
      return `<circle cx="${r1(cx)}" cy="${r1(cy - r * 1.18)}" r="${r1(r * 0.42)}" fill="${color}"/><path fill="${color}" d="${cap}"/>`;
    case "curly":
      return [[-0.85, -0.45], [-0.55, -0.85], [-0.1, -1.0], [0.35, -0.92], [0.78, -0.6], [0.95, -0.15], [-0.98, -0.05]]
        .map(([x, y]) => `<circle cx="${r1(cx + x * r)}" cy="${r1(cy + y * r)}" r="${r1(r * 0.36)}" fill="${color}"/>`).join("");
    case "baby":
      return `<path fill="none" stroke="${color}" stroke-width="${r1(r * 0.13)}" stroke-linecap="round" d="M${c(-0.05, -0.98)} q${r1(r * 0.05)} ${r1(-r * 0.35)} ${r1(r * 0.3)} ${r1(-r * 0.3)} q${r1(r * 0.22)} ${r1(r * 0.12)} ${r1(-r * 0.02)} ${r1(r * 0.3)}"/>`;
    default:
      return `<path fill="${color}" d="${cap}"/>`;
  }
}

function head(cx, cy, r, skin, hairColor, style) {
  const w = r1(r * 0.075);
  const e = r * 0.2;
  const eye = (x) => `M${r1(x - e)} ${r1(cy + r * 0.08)} Q${r1(x)} ${r1(cy - r * 0.2)} ${r1(x + e)} ${r1(cy + r * 0.08)}`;
  const behind = style === "bob" || style === "pigtails" || style === "bun" ? hair(cx, cy, r, hairColor, style) : "";
  const front = behind ? "" : hair(cx, cy, r, hairColor, style);
  return `${behind}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${skin}"/>${style === "bob" ? `<path fill="${hairColor}" d="M${r1(cx - r * 0.98)} ${r1(cy - r * 0.05)} Q${r1(cx - r * 0.9)} ${r1(cy - r * 1.12)} ${r1(cx)} ${r1(cy - r * 1.05)} Q${r1(cx + r * 0.9)} ${r1(cy - r * 1.12)} ${r1(cx + r * 0.98)} ${r1(cy - r * 0.05)} Q${r1(cx + r * 0.5)} ${r1(cy - r * 0.5)} ${r1(cx - r * 0.1)} ${r1(cy - r * 0.48)} Q${r1(cx - r * 0.6)} ${r1(cy - r * 0.42)} ${r1(cx - r * 0.98)} ${r1(cy - r * 0.05)}Z"/>` : ""}${front}
    <circle cx="${r1(cx - r * 0.58)}" cy="${r1(cy + r * 0.38)}" r="${r1(r * 0.17)}" fill="${P.cheek}" opacity=".55"/><circle cx="${r1(cx + r * 0.58)}" cy="${r1(cy + r * 0.38)}" r="${r1(r * 0.17)}" fill="${P.cheek}" opacity=".55"/>
    <path d="${eye(cx - r * 0.36)} ${eye(cx + r * 0.36)} M${r1(cx - r * 0.24)} ${r1(cy + r * 0.38)} Q${r1(cx)} ${r1(cy + r * 0.66)} ${r1(cx + r * 0.24)} ${r1(cy + r * 0.38)}" fill="none" stroke="${P.ink}" stroke-width="${w}" stroke-linecap="round"/>`;
}

const limb = (pts, color, w) => `<path d="M${pts.join(" L")}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shoe = (x, y, r, color = P.skyDeep) => `<ellipse cx="${x}" cy="${y}" rx="${r1(r * 1.25)}" ry="${r}" fill="${color}"/>`;
const blob = (cx, cy, rx, ry, color, op = 0.6) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${op}"/>`;
const tuft = (x, y, s = 1) => `<path d="M${x} ${y} q${-2 * s} ${-12 * s} ${-9 * s} ${-18 * s} M${x + 4 * s} ${y} q0 ${-14 * s} ${5 * s} ${-22 * s} M${x + 8 * s} ${y} q${3 * s} ${-8 * s} ${10 * s} ${-12 * s}" fill="none" stroke="${P.grass}" stroke-width="${r1(3.2 * s)}" stroke-linecap="round"/>`;
const sparkle = (x, y, s = 1, color = P.sun) => `<path d="M${x} ${y} l${3 * s} ${8 * s} M${x + 12 * s} ${y + 3 * s} l${-5 * s} ${8 * s} M${x + 21 * s} ${y + 12 * s} l${-9 * s} ${3 * s}" stroke="${color}" stroke-width="${r1(3 * s)}" stroke-linecap="round" fill="none"/>`;
const wrap = (vb, label, inner, cls = "") => `<svg class="illo ${cls}" viewBox="${vb}" role="img" aria-label="${label}"><g filter="url(#wc)">${inner}</g></svg>`;

// ---------- spot illustrations (220 × 220) ----------

export function babyIllo() {
  const s = SKIN[0];
  return wrap("0 0 220 220", "A happy baby shaking a rattle", `
    ${blob(110, 120, 92, 88, P.sageSoft, 0.9)}
    ${limb([[92, 172], [66, 184]], P.sky, 20)}${limb([[128, 172], [154, 184]], P.sky, 20)}
    <circle cx="62" cy="186" r="9" fill="${s}"/><circle cx="158" cy="186" r="9" fill="${s}"/>
    <path d="M70 168 Q70 118 110 116 Q150 118 150 168 Q110 184 70 168Z" fill="${P.sky}"/><circle cx="110" cy="140" r="7" fill="${P.sun}"/>
    ${limb([[86, 136], [72, 156]], s, 12)}
    ${limb([[134, 134], [154, 112]], s, 12)}
    ${limb([[156, 108], [166, 92]], P.bark, 5)}<circle cx="171" cy="84" r="12" fill="${P.sun}"/><circle cx="167" cy="81" r="2.5" fill="${P.cream}"/><circle cx="175" cy="88" r="2.5" fill="${P.cream}"/>
    ${head(110, 82, 36, s, HAIR.brown, "baby")}
    ${sparkle(180, 52, 0.9)}`);
}

export function toddlerIllo() {
  const s = SKIN[2];
  return wrap("0 0 220 220", "A toddler holding a balloon", `
    ${blob(110, 122, 92, 86, P.skySoft, 0.95)}
    <path d="M140 108 Q150 80 152 62" fill="none" stroke="${P.ink}" stroke-width="1.8" opacity=".6"/>
    <ellipse cx="156" cy="40" rx="24" ry="28" fill="${P.coral}"/><path d="M152 68 l4 -6 l4 6z" fill="${P.coral}"/>
    <path d="M144 28 q4 -10 12 -10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
    ${limb([[98, 166], [94, 190]], SKIN[2], 13)}${limb([[120, 166], [124, 190]], SKIN[2], 13)}
    ${shoe(92, 194, 8, P.sun)}${shoe(126, 194, 8, P.sun)}
    <path d="M80 128 Q80 112 110 112 Q140 112 140 128 L142 166 Q110 176 78 166Z" fill="${P.sage}"/>
    <path d="M92 112 L94 124 M128 112 L126 124" stroke="${P.sageDeep}" stroke-width="5" stroke-linecap="round"/>
    ${limb([[84, 124], [72, 148]], s, 11)}
    ${limb([[134, 122], [142, 106]], s, 11)}
    ${head(110, 82, 32, s, HAIR.dark, "curly")}
    ${tuft(30, 200, 1.1)}${tuft(170, 200, 1)}`);
}

export function bubblesIllo() {
  const s = SKIN[3];
  const bubble = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.skySoft}" fill-opacity=".55" stroke="${P.sky}" stroke-width="2.5"/><path d="M${x - r * 0.5} ${y - r * 0.2} q${r * 0.1} ${-r * 0.35} ${r * 0.45} ${-r * 0.42}" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  return wrap("0 0 220 220", "A girl blowing bubbles", `
    ${blob(104, 124, 90, 86, P.sunSoft, 0.95)}
    ${limb([[84, 160], [82, 194]], s, 12)}${limb([[100, 160], [102, 194]], s, 12)}
    ${shoe(80, 197, 8, P.sageDeep)}${shoe(104, 197, 8, P.sageDeep)}
    <path d="M92 104 L62 168 Q92 178 122 168Z" fill="${P.coral}"/>
    ${limb([[78, 122], [64, 146]], s, 10)}
    ${head(92, 80, 30, s, HAIR.dark, "pigtails")}
    ${limb([[106, 120], [124, 98]], s, 10)}
    ${limb([[124, 98], [138, 86]], P.bark, 4)}<circle cx="144" cy="80" r="8" fill="none" stroke="${P.skyDeep}" stroke-width="3"/>
    ${bubble(168, 60, 15)}${bubble(192, 96, 10)}${bubble(176, 124, 8)}${bubble(196, 38, 7)}${bubble(150, 30, 9)}`);
}

export function kiteIllo() {
  const s = SKIN[1];
  return wrap("0 0 220 220", "A boy running with a kite", `
    ${blob(108, 124, 92, 86, P.peach, 0.75)}
    <path d="M128 86 Q160 90 168 58" fill="none" stroke="${P.ink}" stroke-width="1.6" opacity=".6"/>
    <path d="M176 18 L198 44 L176 74 L154 44Z" fill="${P.coral}"/><path d="M176 18 L176 74 M154 44 L198 44" stroke="${P.cream}" stroke-width="2.5"/>
    <path d="M176 74 q-8 14 2 26 q10 12 0 26" fill="none" stroke="${P.skyDeep}" stroke-width="2.5"/>
    <path d="M172 96 l10 -4 l-2 10z M172 120 l10 -4 l-2 10z" fill="${P.sun}"/>
    ${limb([[86, 150], [68, 172], [58, 194]], P.skyDeep, 13)}${limb([[100, 150], [118, 176], [134, 186]], P.skyDeep, 13)}
    ${shoe(54, 196, 8, P.coral)}${shoe(140, 187, 8, P.coral)}
    <rect x="70" y="104" width="46" height="54" rx="20" fill="${P.sun}" transform="rotate(8 93 131)"/>
    ${limb([[78, 118], [58, 138]], s, 10)}
    ${limb([[110, 114], [128, 86]], s, 10)}
    ${head(92, 80, 28, s, HAIR.ginger, "short")}
    ${tuft(30, 206, 0.9)}${tuft(160, 206, 1)}`);
}

export function readerIllo() {
  const s = SKIN[1];
  return wrap("0 0 220 220", "A child reading a picture book at storytime", `
    ${blob(110, 124, 92, 86, P.sageSoft, 0.95)}
    <ellipse cx="110" cy="172" rx="52" ry="18" fill="${P.sky}"/>
    <rect x="84" y="106" width="52" height="60" rx="22" fill="${P.sage}"/>
    ${head(110, 78, 30, s, HAIR.brown, "bun")}
    <path d="M110 130 Q90 120 70 126 L72 162 Q92 156 110 164Z" fill="${P.cream}" stroke="${P.sun}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M110 130 Q130 120 150 126 L148 162 Q128 156 110 164Z" fill="${P.cream}" stroke="${P.sun}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="88" cy="142" r="7" fill="${P.coral}" opacity=".8"/><path d="M122 138 h18 M122 146 h14 M122 154 h16" stroke="${P.skyDeep}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
    ${limb([[88, 118], [74, 140]], s, 10)}${limb([[132, 118], [146, 140]], s, 10)}
    <path d="M108 128 L110 166" stroke="${P.sun}" stroke-width="3"/>
    ${sparkle(150, 52, 0.9)}`);
}

// ---------- wide playground scene (1000 × 300) ----------

export function playgroundScene() {
  const t = (x) => tuft(x, 296, 1.1);
  return wrap("0 0 1000 300", "Kids playing at the park: a girl on a swing, a boy on a slide, a toddler blowing bubbles, and the dino peeking from the grass", `
    <circle cx="70" cy="62" r="34" fill="${P.sun}" opacity=".75"/>
    ${sparkle(118, 26, 1.1)}
    <circle cx="360" cy="150" r="64" fill="${P.sage}" opacity=".85"/><circle cx="318" cy="176" r="44" fill="${P.sage}" opacity=".7"/><rect x="352" y="196" width="14" height="60" rx="6" fill="${P.bark}"/>
    <circle cx="700" cy="140" r="54" fill="${P.sage}" opacity=".8"/><circle cx="742" cy="170" r="36" fill="${P.sage}" opacity=".65"/><rect x="694" y="180" width="12" height="70" rx="6" fill="${P.bark}"/>
    <path d="M0 250 Q160 214 330 236 T680 230 T1000 228 V300 H0Z" fill="${P.sageSoft}"/>
    <path d="M0 268 Q240 248 520 264 T1000 258 V300 H0Z" fill="${P.sage}" opacity=".55"/>

    <!-- swing set -->
    ${limb([[110, 66], [86, 256]], P.skyDeep, 9)}${limb([[110, 66], [134, 256]], P.skyDeep, 9)}
    ${limb([[292, 66], [268, 256]], P.skyDeep, 9)}${limb([[292, 66], [316, 256]], P.skyDeep, 9)}
    ${limb([[104, 66], [298, 66]], P.skyDeep, 10)}
    <path d="M172 70 L156 188 M218 70 L210 182" stroke="${P.ink}" stroke-width="2.4" opacity=".7"/>
    ${limb([[150, 190], [216, 182]], P.bark, 8)}
    ${limb([[178, 182], [222, 198]], SKIN[0], 11)}${limb([[190, 182], [232, 188]], SKIN[0], 11)}
    ${shoe(228, 200, 7, P.coral)}${shoe(238, 189, 7, P.coral)}
    <path d="M166 186 Q168 150 186 146 Q204 150 204 184Z" fill="${P.coral}"/>
    ${limb([[172, 154], [161, 134]], SKIN[0], 9)}${limb([[198, 152], [208, 132]], SKIN[0], 9)}
    ${head(186, 120, 25, SKIN[0], HAIR.blond, "pigtails")}

    <!-- slide -->
    ${limb([[430, 112], [418, 258]], P.skyDeep, 8)}${limb([[466, 112], [456, 258]], P.skyDeep, 8)}
    <path d="M426 150 H462 M424 186 H460 M421 222 H458" stroke="${P.skyDeep}" stroke-width="6" stroke-linecap="round"/>
    ${limb([[424, 110], [474, 110]], P.skyDeep, 9)}
    <path d="M470 104 Q522 108 560 186 Q582 232 634 236" fill="none" stroke="${P.sun}" stroke-width="24" stroke-linecap="round"/>
    ${limb([[552, 168], [584, 196]], P.sky, 12)}${limb([[546, 176], [576, 206]], P.sky, 12)}
    ${shoe(588, 200, 7, P.sageDeep)}${shoe(580, 210, 7, P.sageDeep)}
    <rect x="522" y="134" width="40" height="44" rx="18" fill="${P.sky}" transform="rotate(-24 542 156)"/>
    ${limb([[534, 148], [510, 116]], SKIN[2], 9)}${limb([[556, 142], [572, 110]], SKIN[2], 9)}
    ${head(536, 126, 24, SKIN[2], HAIR.dark, "short")}
    ${sparkle(580, 78, 0.9)}

    <!-- toddler with bubbles -->
    ${limb([[796, 222], [794, 248]], SKIN[3], 12)}${limb([[812, 222], [814, 248]], SKIN[3], 12)}
    ${shoe(792, 251, 7, P.coral)}${shoe(816, 251, 7, P.coral)}
    <rect x="780" y="176" width="48" height="54" rx="22" fill="${P.sun}"/>
    ${limb([[786, 190], [774, 212]], SKIN[3], 9)}
    ${head(804, 154, 26, SKIN[3], HAIR.dark, "curly")}
    ${limb([[822, 188], [838, 168]], SKIN[3], 9)}${limb([[838, 168], [850, 156]], P.bark, 3.5)}<circle cx="855" cy="151" r="7" fill="none" stroke="${P.skyDeep}" stroke-width="3"/>
    ${[[880, 120, 14], [906, 90, 10], [872, 80, 8], [930, 130, 9], [900, 52, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.skySoft}" fill-opacity=".55" stroke="${P.sky}" stroke-width="2.4"/>`).join("")}

    <!-- dino peeking from behind the hill -->
    <image href="/img/dino-head.png" x="900" y="168" width="104" height="104"/>
    <path d="M800 300 Q870 238 1000 246 V300Z" fill="${P.sage}" opacity=".9"/>
    ${t(20)}${t(250)}${t(372)}${t(640)}${t(740)}${t(880)}${t(960)}`, "scene");
}

export const AGE_ILLOS = { baby: babyIllo, toddler: toddlerIllo, preschool: bubblesIllo, elementary: kiteIllo };

// ---------- little theme icons for event cards (64 × 64) ----------

const icon = (label, inner) => `<svg class="ticon" viewBox="0 0 64 64" role="img" aria-label="${label}"><g filter="url(#wc)">${inner}</g></svg>`;
export const THEME_ICONS = {
  halloween: () => icon("Halloween", `<ellipse cx="32" cy="38" rx="22" ry="18" fill="${P.sun}"/><path d="M22 24 Q32 18 42 24" stroke="${P.coral}" stroke-width="3" fill="none" opacity=".6"/><path d="M32 22 q-1 -8 5 -12" stroke="${P.sageDeep}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M24 36 l4 -4 l4 4 M36 36 l4 -4 l4 4 M25 45 q7 5 14 0" stroke="${P.ink}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  holiday: () => icon("Holiday", `<path d="M32 8 L50 50 H14Z" fill="${P.sage}"/><path d="M32 8 L44 36 H20Z" fill="${P.sageDeep}" opacity=".35"/><rect x="28" y="50" width="8" height="8" rx="2" fill="${P.bark}"/><circle cx="26" cy="38" r="3" fill="${P.coral}"/><circle cx="38" cy="30" r="3" fill="${P.sun}"/><circle cx="36" cy="44" r="3" fill="${P.sky}"/><path d="M32 3 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z" fill="${P.sun}"/>`),
  story: () => icon("Storytime", `<path d="M32 18 Q20 12 8 16 L8 50 Q20 46 32 52Z" fill="${P.cream}" stroke="${P.sky}" stroke-width="3" stroke-linejoin="round"/><path d="M32 18 Q44 12 56 16 L56 50 Q44 46 32 52Z" fill="${P.cream}" stroke="${P.sky}" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="32" r="5" fill="${P.coral}" opacity=".8"/><path d="M38 28 h12 M38 35 h10 M38 42 h11" stroke="${P.sageDeep}" stroke-width="2.4" stroke-linecap="round"/>`),
  nature: () => icon("Nature", `<path d="M12 52 Q10 20 46 10 Q56 44 22 50Z" fill="${P.sage}"/><path d="M14 52 Q26 34 42 18" stroke="${P.sageDeep}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="48" cy="48" r="6" fill="${P.sun}" opacity=".8"/>`),
  museum: () => icon("Museum", `<path d="M8 24 L32 10 L56 24Z" fill="${P.coral}"/><rect x="12" y="26" width="40" height="5" rx="2" fill="${P.sky}"/><path d="M17 33 v15 M27 33 v15 M37 33 v15 M47 33 v15" stroke="${P.sky}" stroke-width="5" stroke-linecap="round"/><rect x="10" y="50" width="44" height="5" rx="2" fill="${P.skyDeep}"/>`),
  show: () => icon("Show", `<path d="M26 44 V16 L48 10 V38" stroke="${P.skyDeep}" stroke-width="4" fill="none" stroke-linejoin="round"/><ellipse cx="20" cy="45" rx="8" ry="6" fill="${P.coral}"/><ellipse cx="42" cy="39" rx="8" ry="6" fill="${P.coral}"/>`),
  party: () => icon("Fun", `<ellipse cx="30" cy="24" rx="15" ry="17" fill="${P.coral}"/><path d="M27 41 l3 -3 l3 3z" fill="${P.coral}"/><path d="M30 41 q-6 8 2 16" stroke="${P.ink}" stroke-width="1.8" fill="none" opacity=".6"/><path d="M23 16 q3 -6 9 -6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="50" cy="16" r="3" fill="${P.sun}"/><circle cx="48" cy="34" r="2.5" fill="${P.sky}"/><circle cx="12" cy="40" r="2.5" fill="${P.sage}"/>`),
};
export const NEWS_ICONS = {
  openings: "party", parks: "nature", schools: "story", libraries: "story", community: "party",
  "heads-up": "headsup",
};
THEME_ICONS.headsup = () => icon("Heads-up", `<circle cx="32" cy="32" r="24" fill="${P.sun}"/><path d="M32 18 v18" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/><circle cx="32" cy="45" r="3.6" fill="${P.ink}"/>`);
export function themeOf(e) {
  const t = `${e.title} ${e.description}`.toLowerCase();
  if (/hallowe|trick-or|trunk-or|pumpkin|costume|boo\b/.test(t)) return "halloween";
  if (/santa|christmas|holiday|tree lighting|hanukkah|menorah|deck the/.test(t)) return "holiday";
  if (/story|librar|book|read/.test(t)) return "story";
  if (/nature|hike|arboretum|garden|scavenger|bird|trail|park/.test(t)) return "nature";
  if (/museum|science|exhibit/.test(t)) return "museum";
  if (/concert|music|show|theat|perform|elmo|sing/.test(t)) return "show";
  return "party";
}
