// My skills as CS2 weapon skins. The knives are the languages I write the most code in (from
// my repos); the rest is my resume (the portfolio's Skills section) plus my configured stack,
// rarer for what's more central.
//   loadout.svg    the short version: a case opening that lands on something different each
//                  spin (a new lineup every day), and my top picks for each kind of skill
//   inventory.svg  the long version: every skill, rarest first

import { C, HUD, RARITY, esc, kindName, r1, seeded, skins, svg } from './lib.mjs';
import { iconSet } from './icons.mjs';

const W = 1000;
const ORDER = ['gold', 'covert', 'classified', 'restricted', 'milspec', 'industrial', 'consumer'];
// How often each rarity turns up in the reel, like a real case: rarer means scarcer.
const WEIGHT = { consumer: 30, industrial: 25, milspec: 20, restricted: 12, classified: 8, covert: 5 };
// Rarest first; among equals, the languages I write more code in first.
const byRarity = (a, b) => ORDER.indexOf(a.rarity) - ORDER.indexOf(b.rarity) || (b.share || 0) - (a.share || 0);

const REEL_Y = 88;
const REEL_H = 140;
const CARD_W = 118;
const PITCH = 126;
const START = 20;
// Each opening: showing what landed, then a fade, a reset and the next spin.
const SEG = 6.5;
const FIRST = 20;
const GAP = 5;

// Card sizes: the reel's, the loadout's and the full inventory's.
const SIZES = {
  big: { icon: 34, top: 20, weapon: 10, skill: 14, wy: 32, sy: 15, bar: 4 },
  mid: { icon: 26, top: 12, weapon: 10, skill: 13, wy: 25, sy: 10, bar: 3 },
  small: { icon: 20, top: 10, weapon: 8.5, skill: 11, wy: 22, sy: 9, bar: 3 },
};

// Text sized down to fit a width.
const fitSize = (text, width, max) => r1(Math.min(max, width / (String(text).length * 0.56)));

function card(icons, skin, x, y, w, h, size) {
  const r = RARITY[skin.rarity];
  const s = SIZES[size];
  // The weapon icon, as large as fits the card.
  const iconH = Math.min(s.icon, (w - 18) / icons.width(skin.icon, 1));
  const iconW = icons.width(skin.icon, iconH);
  return `<g transform="translate(${r1(x)} ${r1(y)})">
<rect width="${w}" height="${h}" rx="4" fill="url(#cardbg)"/>
<rect y="${r1(h * 0.45)}" width="${w}" height="${r1(h * 0.55)}" fill="${r.color}" fill-opacity="0.16"/>
${icons.use(skin.icon, (w - iconW) / 2, s.top + (s.icon - iconH) / 2, iconH, '#d4dae1')}
<text x="${w / 2}" y="${h - s.wy}" text-anchor="middle" class="wname" style="font-size:${fitSize(skin.weapon, w - 8, s.weapon)}px">${esc(skin.weapon)}</text>
<text x="${w / 2}" y="${h - s.sy}" text-anchor="middle" class="sname" style="font-size:${fitSize(skin.skill, w - 8, s.skill)}px">${esc(skin.skill)}</text>
<rect y="${h - s.bar}" width="${w}" height="${s.bar}" fill="${r.color}"/>
</g>`;
}

// The rarity key, right-aligned to the panel.
function legend(y) {
  const keys = ['gold', 'covert', 'classified', 'restricted', 'milspec', 'industrial', 'consumer'].map((key) => ({ key, label: key === 'gold' ? '★ Knife' : RARITY[key].name.replace(' Grade', '') }));
  const keyWidth = (k) => 16 + k.label.length * 11 * 0.58 + 16;
  let lx = 970 - keys.reduce((sum, k) => sum + keyWidth(k), 0) + 16;
  return keys
    .map((k) => {
      const out = `<rect x="${r1(lx)}" y="${y - 10}" width="11" height="11" rx="2" fill="${RARITY[k.key].color}"/><text x="${r1(lx + 16)}" y="${y}" class="legend">${esc(k.label)}</text>`;
      lx += keyWidth(k);
      return out;
    })
    .join('');
}

const DEFS = `
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11161d"/><stop offset="1" stop-color="#0a0d12"/></linearGradient>
<linearGradient id="cardbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232a33"/><stop offset="1" stop-color="#14181e"/></linearGradient>
<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

const STYLE = `
.eyebrow { font: 700 12px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; }
.heading { font: 700 28px ${HUD}; fill: #fff; letter-spacing: 0.5px; }
.legend { font: 600 11px ${HUD}; letter-spacing: 0.8px; fill: ${C.dim}; }
.wname { font-family: ${HUD}; font-weight: 600; letter-spacing: 0.4px; fill: ${C.dim}; }
.sname { font-family: ${HUD}; font-weight: 700; fill: #fff; }
.note { font: 600 12px ${HUD}; letter-spacing: 0.3px; fill: ${C.dim}; }
.shine { animation: shine 3.2s ease-in-out infinite; }`;

// A gold card's shine, swept across it now and then.
const shine = (x, y, w, h, delay) => `<g clip-path="url(#shine-${w}x${h})" transform="translate(${r1(x)} ${r1(y)})"><rect class="shine" x="-50" y="0" width="34" height="${h}" fill="url(#shine)" style="animation-delay:${r1(delay)}s"/></g>`;
const shineClip = (w, h) => `<clipPath id="shine-${w}x${h}"><rect width="${w}" height="${h}" rx="4"/></clipPath>`;
const shineKeyframes = (w) => `@keyframes shine { 0% { transform: translateX(0); } 60%, 100% { transform: translateX(${w + 90}px); } }`;

// What an opening reveals under the reel.
function caption(skin) {
  if (skin.knife) return `${Math.round(skin.knife.share * 100)}% OF MY CODE · IN ${skin.knife.repos} REPOS`;
  return `${RARITY[skin.rarity].name.toUpperCase()} · ${kindName(skin.kind).toUpperCase()}`;
}

// The case opening: several spins in a loop, each landing on a different skin.
function caseOpening(icons, all, today) {
  const knives = all.filter((s) => s.rarity === 'gold');
  const pool = all.filter((s) => s.rarity !== 'gold');
  // A new lineup every day (the drawing is redrawn daily anyway).
  const rand = seeded(`${all.map((s) => s.skill).join()}|${today}`);
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
  const reelCards = reel.map((s, i) => card(icons, s, START + i * PITCH, REEL_Y + 8, CARD_W, REEL_H - 16, 'big')).join('\n');

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
<text x="${W / 2}" y="${REEL_Y + REEL_H + 51}" text-anchor="middle" class="revealsub">${esc(caption(w))}</text>
</g>`;
    })
    .join('\n');

  return {
    winners,
    defs: `
<linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0c0f14"/><stop offset="1" stop-color="#0c0f14" stop-opacity="0"/></linearGradient>
<linearGradient id="fadeR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#0c0f14"/><stop offset="1" stop-color="#0c0f14" stop-opacity="0"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
<clipPath id="reelclip"><rect x="20" y="${REEL_Y}" width="960" height="${REEL_H}" rx="6"/></clipPath>`,
    style: `
.reel { transform: translateX(${travel[0]}px); animation: spin ${T}s infinite; }
@keyframes spin { ${spin} 100% { transform: translateX(${travel[0]}px); } }
.reelwrap { animation: reelfade ${T}s infinite; }
@keyframes reelfade { 0% { opacity: 1; } ${fade} 100% { opacity: 1; } }
${winCss}
.reveal { font: 700 18px ${HUD}; letter-spacing: 0.5px; }
/* While the reel spins (the rest of the time what it landed on shows here). */
.opening { font: 700 12px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; opacity: 0; animation: opening ${T}s infinite; }
@keyframes opening { 0% { opacity: 0; } ${opening} 100% { opacity: 0; } }
.revealsub { font: 600 11px ${HUD}; letter-spacing: 2px; fill: ${C.dim}; }`,
    body: `
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
<text x="${W / 2}" y="${REEL_Y + REEL_H + 40}" text-anchor="middle" class="opening">OPENING CASE…</text>`,
  };
}

// The loadout: the case opening, then a row for each kind of skill with my top picks in it.
const LOADOUT_KINDS = ['languages', 'frameworks', 'cloud', 'data'];
const PER_ROW = 6;

export function loadoutSvg(config, data) {
  const icons = iconSet();
  const all = skins(config.stack, data.site.skills, data.allLanguages);
  const opening = caseOpening(icons, all, data.today);

  const rowsY = REEL_Y + REEL_H + 76;
  const cw = 124;
  const ch = 80;
  const cx0 = 180;
  let shown = 0;
  const rows = LOADOUT_KINDS.map((kind, r) => {
    const items = all.filter((s) => s.kind === kind).sort(byRarity);
    const top = items.slice(0, PER_ROW);
    shown += top.length;
    const y = rowsY + r * (ch + 12);
    const cards = top
      .map((s, i) => {
        const x = cx0 + i * (cw + 8);
        return `<g>${card(icons, s, x, y, cw, ch, 'mid')}${s.rarity === 'gold' ? shine(x, y, cw, ch, i * 0.6) : ''}</g>`;
      })
      .join('');
    return `<text x="30" y="${y + 36}" class="kind">${esc(kindName(kind).toUpperCase())}</text>
<text x="30" y="${y + 56}" class="count">${items.length > top.length ? `top ${top.length} of ${items.length}` : `${items.length}`}</text>
${cards}`;
  }).join('\n');
  const rowsBottom = rowsY + LOADOUT_KINDS.length * (ch + 12) - 12;
  const H = rowsBottom + 50;

  const style = `${STYLE}
${shineKeyframes(cw)}
.kind { font: 800 13px ${HUD}; letter-spacing: 2px; fill: #fff; }
.count { font: 600 12px ${HUD}; fill: ${C.dim}; }
${opening.style}`;
  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<text x="30" y="40" class="eyebrow">LOADOUT · CASE OPENING</text>
<text x="30" y="72" class="heading">What I build with</text>
${legend(66)}
${opening.body}
${rows}
<text x="30" y="${rowsBottom + 32}" class="note">★ Knives: the languages I write the most code in, from my repos. Rarer means I use it more. The full inventory (${all.length}) is below.</text>`;

  const knives = all.filter((s) => s.knife);
  const alt = [
    `What I build with, as a CS2 loadout. Knives (my most-used languages on GitHub): ${knives.map((k) => `${k.skill} (${Math.round(k.knife.share * 100)}% of my code)`).join(', ')}.`,
    ...LOADOUT_KINDS.map((kind) => `${kindName(kind)}: ${all.filter((s) => s.kind === kind).sort(byRarity).slice(0, PER_ROW).filter((s) => !s.knife).map((s) => s.skill).join(', ')}.`),
  ].join(' ');
  return { svg: svg(W, H, alt, DEFS + opening.defs + shineClip(cw, ch) + icons.defs(), style, body), alt, count: all.length };
}

// The full inventory: every skill, rarest first.
export function inventorySvg(config, data) {
  const icons = iconSet();
  const all = skins(config.stack, data.site.skills, data.allLanguages);
  const sorted = [...all].sort(byRarity);
  const cols = 10;
  const gap = 6;
  const gw = Math.floor((940 - (cols - 1) * gap) / cols);
  const gh = 76;
  const gx0 = (W - (cols * (gw + gap) - gap)) / 2;
  const gy0 = 96;
  const grid = sorted
    .map((s, i) => {
      const x = gx0 + (i % cols) * (gw + gap);
      const y = gy0 + Math.floor(i / cols) * (gh + gap);
      return `<g>${card(icons, s, x, y, gw, gh, 'small')}${s.rarity === 'gold' ? shine(x, y, gw, gh, i * 0.5) : ''}</g>`;
    })
    .join('\n');
  const gridBottom = gy0 + Math.ceil(sorted.length / cols) * (gh + gap) - gap;
  const H = gridBottom + 30;

  const style = `${STYLE}
${shineKeyframes(gw)}`;
  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<text x="30" y="40" class="eyebrow">INVENTORY · ${all.length} ITEMS</text>
<text x="30" y="72" class="heading">Everything on my resume</text>
${legend(66)}
${grid}`;

  const byKind = (kind) => all.filter((s) => s.kind === kind && !s.knife).map((s) => s.skill).join(', ');
  const alt = [
    `Every skill I have, as a CS2 inventory. Knives: ${all.filter((s) => s.knife).map((k) => k.skill).join(', ')}.`,
    ...['languages', 'frameworks', 'cloud', 'data', 'tools'].map((kind) => `${kindName(kind)}: ${byKind(kind)}.`),
  ].join(' ');
  return { svg: svg(W, H, alt, DEFS + shineClip(gw, gh) + icons.defs(), style, body), alt, count: all.length };
}
