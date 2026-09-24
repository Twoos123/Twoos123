// inventory.svg: everything I work with as weapon skins. My knives are the languages I write
// the most code in (from my repos); the rest is my resume (the portfolio's Skills section)
// plus my configured stack, rarer for what's more central. Up top, a case opening that lands
// on something different each spin, and picks a new lineup every day.

import { C, HUD, RARITY, esc, kindName, r1, seeded, skins, svg } from './lib.mjs';
import { iconSet } from './icons.mjs';

const W = 1000;
const ORDER = ['gold', 'covert', 'classified', 'restricted', 'milspec', 'industrial', 'consumer'];
// How often each rarity turns up in the reel, like a real case: rarer means scarcer.
const WEIGHT = { consumer: 30, industrial: 25, milspec: 20, restricted: 12, classified: 8, covert: 5 };

const REEL_Y = 88;
const REEL_H = 150;
const CARD_W = 124;
const PITCH = 132;
const START = 20;
// Each opening: showing what landed, then a fade, a reset and the next spin.
const SEG = 6.5;
const FIRST = 20;
const GAP = 5;

// Text sized down to fit a width.
const fitSize = (text, width, max) => r1(Math.min(max, width / (String(text).length * 0.56)));

function card(icons, skin, x, y, w, h, big) {
  const r = RARITY[skin.rarity];
  // The weapon icon, as large as fits the card.
  const maxH = big ? 36 : 20;
  const top = big ? 22 : 10;
  const iconH = Math.min(maxH, (w - (big ? 22 : 16)) / icons.width(skin.icon, 1));
  const iconW = icons.width(skin.icon, iconH);
  return `<g transform="translate(${r1(x)} ${r1(y)})">
<rect width="${w}" height="${h}" rx="4" fill="url(#cardbg)"/>
<rect y="${r1(h * 0.45)}" width="${w}" height="${r1(h * 0.55)}" fill="${r.color}" fill-opacity="0.16"/>
${icons.use(skin.icon, (w - iconW) / 2, top + (maxH - iconH) / 2, iconH, '#d4dae1')}
<text x="${w / 2}" y="${h - (big ? 34 : 22)}" text-anchor="middle" class="wname" style="font-size:${fitSize(skin.weapon, w - 8, big ? 10 : 8.5)}px">${esc(skin.weapon)}</text>
<text x="${w / 2}" y="${h - (big ? 16 : 9)}" text-anchor="middle" class="sname" style="font-size:${fitSize(skin.skill, w - 8, big ? 14 : 11)}px">${esc(skin.skill)}</text>
<rect y="${h - (big ? 4 : 3)}" width="${w}" height="${big ? 4 : 3}" fill="${r.color}"/>
</g>`;
}

// What an opening reveals under the reel.
function caption(skin) {
  if (skin.knife) return `${Math.round(skin.knife.share * 100)}% OF MY CODE · IN ${skin.knife.repos} REPOS`;
  return `${RARITY[skin.rarity].name.toUpperCase()} · ${kindName(skin.kind).toUpperCase()}`;
}

export function inventorySvg(config, data) {
  const icons = iconSet();
  const all = skins(config.stack, data.site.skills, data.allLanguages);
  const knives = all.filter((s) => s.rarity === 'gold');
  const pool = all.filter((s) => s.rarity !== 'gold');
  // A new lineup every day (the drawing is redrawn daily anyway).
  const rand = seeded(`${all.map((s) => s.skill).join()}|${data.today}`);
  const pick = (from, weight) => {
    const total = from.reduce((sum, s) => sum + weight(s), 0);
    let roll = rand() * total;
    for (const s of from) {
      roll -= weight(s);
      if (roll <= 0) return s;
    }
    return from[0];
  };

  // The openings: every knife, and one covert or classified skin, in a shuffled order.
  const rare = pool.filter((s) => s.rarity === 'covert' || s.rarity === 'classified');
  const winners = [...knives, ...(rare.length ? [pick(rare, () => 1)] : [])];
  for (let i = winners.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [winners[i], winners[j]] = [winners[j], winners[i]];
  }
  if (winners.length < 2) winners.push(pick(pool, (s) => WEIGHT[s.rarity]));
  const K = winners.length;
  const T = K * SEG;
  const pct = (k, f) => Math.round(((k + f) * 10000) / K) / 100;

  // One long reel with each winner at its own stop; random skins everywhere else.
  const stops = winners.map((_, k) => FIRST + k * GAP);
  const reel = Array.from({ length: stops[K - 1] + 6 }, () => pick(pool, (s) => WEIGHT[s.rarity]));
  winners.forEach((w, k) => (reel[stops[k]] = w));
  // Each stops a little off-centre, as real cases do; the highlight follows the card.
  const jitters = winners.map(() => Math.round((rand() - 0.5) * 60));
  const travel = stops.map((stop, k) => Math.round(W / 2 - (START + stop * PITCH + CARD_W / 2)) + jitters[k]);
  const reelCards = reel.map((s, i) => card(icons, s, START + i * PITCH, REEL_Y + 8, CARD_W, REEL_H - 16, true)).join('\n');

  // Landed on winner k, then fade, reset and spin to winner k + 1 (the last spins back to the first).
  const spin = winners
    .map((_, k) => `${pct(k, 0)}%, ${pct(k, 0.46)}% { transform: translateX(${travel[k]}px); animation-timing-function: linear; } ${pct(k, 0.465)}%, ${pct(k, 0.5)}% { transform: translateX(0); animation-timing-function: cubic-bezier(0.08, 0.62, 0.1, 1); }`)
    .join(' ');
  const fade = winners.map((_, k) => `${pct(k, 0.42)}% { opacity: 1; } ${pct(k, 0.45)}%, ${pct(k, 0.48)}% { opacity: 0; } ${pct(k, 0.5)}% { opacity: 1; }`).join(' ');
  const opening = winners.map((_, k) => `${pct(k, 0.5)}% { opacity: 0; } ${pct(k, 0.53)}%, ${pct(k, 0.96)}% { opacity: 1; } ${pct(k, 0.995)}% { opacity: 0; }`).join(' ');
  const winCss = winners
    .map((_, k) =>
      k === 0
        ? `.win0 { animation: win0 ${T}s infinite; } @keyframes win0 { 0%, ${pct(0, 0.4)}% { opacity: 1; } ${pct(0, 0.43)}%, ${pct(K - 1, 0.99)}% { opacity: 0; } 100% { opacity: 1; } }`
        : `.win${k} { opacity: 0; animation: win${k} ${T}s infinite; } @keyframes win${k} { 0%, ${Math.round((pct(k, 0) - 0.1) * 100) / 100}% { opacity: 0; } ${pct(k, 0.02)}%, ${pct(k, 0.4)}% { opacity: 1; } ${pct(k, 0.43)}%, 100% { opacity: 0; } }`
    )
    .join('\n');
  const wins = winners
    .map((w, k) => {
      const color = RARITY[w.rarity].color;
      const cx = W / 2 + jitters[k];
      return `<g class="win${k}">
<ellipse cx="${cx}" cy="${REEL_Y + REEL_H / 2}" rx="120" ry="90" fill="${color}" fill-opacity="0.22" filter="url(#glow)"/>
<rect x="${cx - CARD_W / 2 - 3}" y="${REEL_Y + 5}" width="${CARD_W + 6}" height="${REEL_H - 10}" rx="6" fill="none" stroke="${color}" stroke-width="2.5"/>
<text x="${W / 2}" y="${REEL_Y + REEL_H + 32}" text-anchor="middle" class="reveal" fill="${color}">${esc(`${w.weapon} | ${w.skill}`)}</text>
<text x="${W / 2}" y="${REEL_Y + REEL_H + 50}" text-anchor="middle" class="revealsub">${esc(caption(w))}</text>
</g>`;
    })
    .join('\n');

  // The inventory, rarest first (knives first of all, in the order I use them).
  const sorted = [...all].sort((a, b) => ORDER.indexOf(a.rarity) - ORDER.indexOf(b.rarity));
  const cols = 10;
  const gap = 6;
  const gw = Math.floor((940 - (cols - 1) * gap) / cols);
  const gh = 76;
  const gx0 = (W - (cols * (gw + gap) - gap)) / 2;
  const gy0 = 330;
  const grid = sorted
    .map((s, i) => {
      const x = gx0 + (i % cols) * (gw + gap);
      const y = gy0 + Math.floor(i / cols) * (gh + gap);
      const shine = s.rarity === 'gold' ? `<g clip-path="url(#shineclip)" transform="translate(${r1(x)} ${r1(y)})"><rect class="shine" x="-50" y="0" width="34" height="${gh}" fill="url(#shine)" style="animation-delay:${r1(i * 0.5)}s"/></g>` : '';
      return `<g>${card(icons, s, x, y, gw, gh, false)}${shine}</g>`;
    })
    .join('\n');
  const rows = Math.ceil(sorted.length / cols);
  const gridBottom = gy0 + rows * (gh + gap) - gap;
  const H = gridBottom + 50;

  // The rarity key, right-aligned to the panel.
  const keys = ['gold', 'covert', 'classified', 'restricted', 'milspec', 'industrial', 'consumer'].map((key) => ({ key, label: key === 'gold' ? '★ Knife' : RARITY[key].name.replace(' Grade', '') }));
  const keyWidth = (k) => 15 + k.label.length * 10 * 0.6 + 16;
  let lx = 970 - keys.reduce((sum, k) => sum + keyWidth(k), 0) + 16;
  const legend = keys
    .map((k) => {
      const out = `<rect x="${r1(lx)}" y="50" width="10" height="10" rx="2" fill="${RARITY[k.key].color}"/><text x="${r1(lx + 15)}" y="59" class="legend">${esc(k.label)}</text>`;
      lx += keyWidth(k);
      return out;
    })
    .join('');

  const defs = `
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11161d"/><stop offset="1" stop-color="#0a0d12"/></linearGradient>
<linearGradient id="cardbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232a33"/><stop offset="1" stop-color="#14181e"/></linearGradient>
<linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0c0f14"/><stop offset="1" stop-color="#0c0f14" stop-opacity="0"/></linearGradient>
<linearGradient id="fadeR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#0c0f14"/><stop offset="1" stop-color="#0c0f14" stop-opacity="0"/></linearGradient>
<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
<clipPath id="reelclip"><rect x="20" y="${REEL_Y}" width="960" height="${REEL_H}" rx="6"/></clipPath>
<clipPath id="shineclip"><rect width="${gw}" height="${gh}" rx="4"/></clipPath>`;

  const style = `
.eyebrow { font: 700 11px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; }
.heading { font: 700 26px ${HUD}; fill: #fff; letter-spacing: 0.5px; }
.legend { font: 600 10px ${HUD}; letter-spacing: 0.8px; fill: ${C.dim}; }
.wname { font-family: ${HUD}; font-weight: 600; letter-spacing: 0.4px; fill: ${C.dim}; }
.sname { font-family: ${HUD}; font-weight: 700; fill: #fff; }
.note { font: 600 11px ${HUD}; letter-spacing: 0.4px; fill: ${C.dim}; }
.reel { transform: translateX(${travel[0]}px); animation: spin ${T}s infinite; }
@keyframes spin { ${spin} 100% { transform: translateX(${travel[0]}px); } }
.reelwrap { animation: reelfade ${T}s infinite; }
@keyframes reelfade { 0% { opacity: 1; } ${fade} 100% { opacity: 1; } }
${winCss}
.reveal { font: 700 17px ${HUD}; letter-spacing: 0.5px; }
/* While the reel spins (the rest of the time what it landed on shows here). */
.opening { font: 700 11px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; opacity: 0; animation: opening ${T}s infinite; }
@keyframes opening { 0% { opacity: 0; } ${opening} 100% { opacity: 0; } }
.revealsub { font: 600 10px ${HUD}; letter-spacing: 2px; fill: ${C.dim}; }
.shine { animation: shine 3.2s ease-in-out infinite; }
@keyframes shine { 0% { transform: translateX(0); } 60%, 100% { transform: translateX(${gw + 90}px); } }
`;

  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<text x="30" y="40" class="eyebrow">INVENTORY · CASE OPENING</text>
<text x="30" y="70" class="heading">What I build with</text>
${legend}
<rect x="20" y="${REEL_Y}" width="960" height="${REEL_H}" rx="6" fill="#0c0f14" stroke="#fff" stroke-opacity="0.08"/>
<g clip-path="url(#reelclip)"><g class="reelwrap"><g class="reel">
${reelCards}
</g></g>
<rect x="20" y="${REEL_Y}" width="180" height="${REEL_H}" fill="url(#fadeL)"/>
<rect x="${W - 200}" y="${REEL_Y}" width="180" height="${REEL_H}" fill="url(#fadeR)"/>
</g>
${wins}
<path d="M${W / 2} ${REEL_Y + 4}V${REEL_Y + REEL_H - 4}" stroke="#e4ae39" stroke-width="2"/>
<path d="M${W / 2 - 8} ${REEL_Y}H${W / 2 + 8}L${W / 2} ${REEL_Y + 10}Z" fill="#e4ae39"/>
<path d="M${W / 2 - 8} ${REEL_Y + REEL_H}H${W / 2 + 8}L${W / 2} ${REEL_Y + REEL_H - 10}Z" fill="#e4ae39"/>
<text x="${W / 2}" y="${REEL_Y + REEL_H + 40}" text-anchor="middle" class="opening">OPENING CASE…</text>
${grid}
<text x="30" y="${gridBottom + 30}" class="note">★ Knives: the languages I write the most code in, from my repos. The rest is my resume; the rarer, the more I use it.</text>`;

  const byKind = (kind) => all.filter((s) => s.kind === kind && !s.knife).map((s) => s.skill).join(', ');
  const alt = [
    `What I build with, as a CS2 inventory. Knives (my most-used languages on GitHub): ${knives.map((k) => `${k.skill} (${Math.round(k.knife.share * 100)}% of my code)`).join(', ')}.`,
    ...['languages', 'frameworks', 'cloud', 'data', 'tools'].map((kind) => `${kindName(kind)}: ${byKind(kind)}.`),
  ].join(' ');
  return { svg: svg(W, H, alt, defs + icons.defs(), style, body), alt };
}
