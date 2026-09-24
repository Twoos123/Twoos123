// inventory.svg: my stack as weapon skins. A case opening spins through them and always
// lands on the gold knife; below, the whole inventory sorted by rarity.

import { C, HUD, RARITY, esc, r1, seeded, skins, svg, textWidth } from './lib.mjs';
import { iconSet } from './icons.mjs';

const W = 1000;
const ORDER = ['gold', 'covert', 'classified', 'restricted', 'milspec', 'industrial', 'consumer'];
// How often each rarity turns up in the reel, like a real case: rarer means scarcer.
const WEIGHT = { consumer: 30, industrial: 25, milspec: 20, restricted: 12, classified: 8, covert: 5 };

const REEL_Y = 88;
const REEL_H = 150;
const CARD_W = 124;
const PITCH = 132;
const WINNER = 28;
const SPIN = 12;

function card(icons, skin, x, y, w, h, big) {
  const r = RARITY[skin.rarity];
  // The weapon icon, as large as fits the card.
  const maxH = big ? 36 : 26;
  const iconH = Math.min(maxH, (w - 22) / icons.width(skin.icon, 1));
  const iconW = icons.width(skin.icon, iconH);
  const nameSize = big ? 14 : 12;
  return `<g transform="translate(${r1(x)} ${r1(y)})">
<rect width="${w}" height="${h}" rx="4" fill="url(#cardbg)"/>
<rect y="${r1(h * 0.45)}" width="${w}" height="${r1(h * 0.55)}" fill="${r.color}" fill-opacity="0.16"/>
${icons.use(skin.icon, (w - iconW) / 2, (big ? 22 : 12) + (maxH - iconH) / 2, iconH, '#d4dae1')}
<text x="${w / 2}" y="${h - (big ? 34 : 26)}" text-anchor="middle" class="wname">${esc(skin.weapon)}</text>
<text x="${w / 2}" y="${h - (big ? 16 : 11)}" text-anchor="middle" class="sname" style="font-size:${nameSize}px">${esc(skin.skill)}</text>
<rect y="${h - 4}" width="${w}" height="4" fill="${r.color}"/>
</g>`;
}

export function inventorySvg(config) {
  const icons = iconSet();
  const all = skins(config.stack, config.knife);
  const knife = all.find((s) => s.rarity === 'gold');
  const pool = all.filter((s) => s.rarity !== 'gold');
  const rand = seeded(JSON.stringify(config.stack));
  const pick = () => {
    const total = pool.reduce((sum, s) => sum + WEIGHT[s.rarity], 0);
    let roll = rand() * total;
    for (const s of pool) {
      roll -= WEIGHT[s.rarity];
      if (roll <= 0) return s;
    }
    return pool[0];
  };

  // The reel: random skins with the knife at WINNER, moved so the knife stops at the marker.
  const reel = Array.from({ length: WINNER + 6 }, (_, i) => (i === WINNER && knife ? knife : pick()));
  const start = 20;
  // Stops a little off-centre, as real cases do; the highlight follows the knife card.
  const jitter = Math.round((rand() - 0.5) * 60);
  const travel = Math.round(W / 2 - (start + WINNER * PITCH + CARD_W / 2)) + jitter;
  const winnerX = W / 2 + jitter - CARD_W / 2;
  const reelCards = reel.map((s, i) => card(icons, s, start + i * PITCH, REEL_Y + 8, CARD_W, REEL_H - 16, true)).join('\n');

  // The inventory grid, rarest first.
  const sorted = [...all].sort((a, b) => ORDER.indexOf(a.rarity) - ORDER.indexOf(b.rarity));
  const cols = 8;
  const gw = 112;
  const gh = 88;
  const gx0 = (W - (cols * (gw + 8) - 8)) / 2;
  const gy0 = 330;
  const grid = sorted
    .map((s, i) => {
      const x = gx0 + (i % cols) * (gw + 8);
      const y = gy0 + Math.floor(i / cols) * (gh + 8);
      const shine = s.rarity === 'gold' ? `<g clip-path="url(#shineclip)" transform="translate(${r1(x)} ${r1(y)})"><rect class="shine" x="-60" y="0" width="40" height="${gh}" fill="url(#shine)"/></g>` : '';
      return `<g>${card(icons, s, x, y, gw, gh, false)}${shine}</g>`;
    })
    .join('\n');
  const rows = Math.ceil(sorted.length / cols);
  const H = gy0 + rows * (gh + 8) + 34;

  // The rarity key, right-aligned to the panel.
  const keys = ['covert', 'classified', 'restricted', 'milspec', 'industrial', 'consumer'].map((key) => ({ key, label: RARITY[key].name.replace(' Grade', '') }));
  const keyWidth = (k) => 15 + textWidth(k.label, 10, 0.6) + 16;
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
<radialGradient id="winglow"><stop offset="0" stop-color="#e4ae39" stop-opacity="0.55"/><stop offset="1" stop-color="#e4ae39" stop-opacity="0"/></radialGradient>
<clipPath id="reelclip"><rect x="20" y="${REEL_Y}" width="960" height="${REEL_H}" rx="6"/></clipPath>
<clipPath id="shineclip"><rect width="112" height="88" rx="4"/></clipPath>`;

  const style = `
.eyebrow { font: 700 11px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; }
.heading { font: 700 26px ${HUD}; fill: #fff; letter-spacing: 0.5px; }
.legend { font: 600 10px ${HUD}; letter-spacing: 0.8px; fill: ${C.dim}; }
.wname { font: 600 10px ${HUD}; letter-spacing: 0.6px; fill: ${C.dim}; }
.sname { font-family: ${HUD}; font-weight: 700; fill: #fff; }
.reel { transform: translateX(${travel}px); animation: spin ${SPIN}s infinite; }
@keyframes spin { 0%, 31% { transform: translateX(${travel}px); } 31.5%, 36% { transform: translateX(0); animation-timing-function: cubic-bezier(0.08, 0.62, 0.1, 1); } 88%, 100% { transform: translateX(${travel}px); } }
.reelwrap { animation: reelfade ${SPIN}s infinite; }
@keyframes reelfade { 0%, 29% { opacity: 1; } 31%, 34% { opacity: 0; } 36%, 100% { opacity: 1; } }
.win { animation: win ${SPIN}s infinite; }
@keyframes win { 0%, 27% { opacity: 1; } 30%, 88% { opacity: 0; } 91%, 100% { opacity: 1; } }
.reveal { font: 700 17px ${HUD}; letter-spacing: 0.5px; fill: #e4ae39; }
/* While the reel spins (the rest of the time the knife's name shows here). */
.opening { font: 700 11px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; opacity: 0; animation: opening ${SPIN}s infinite; }
@keyframes opening { 0%, 29% { opacity: 0; } 33%, 86% { opacity: 1; } 89%, 100% { opacity: 0; } }
.revealsub { font: 600 10px ${HUD}; letter-spacing: 2px; fill: ${C.dim}; }
.shine { animation: shine 3.2s ease-in-out infinite; }
@keyframes shine { 0% { transform: translateX(0); } 60%, 100% { transform: translateX(220px); } }
`;

  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<text x="30" y="40" class="eyebrow">INVENTORY · CASE OPENING</text>
<text x="30" y="70" class="heading">What I build with</text>
${legend}
<rect x="20" y="${REEL_Y}" width="960" height="${REEL_H}" rx="6" fill="#0c0f14" stroke="#fff" stroke-opacity="0.08"/>
<ellipse cx="${W / 2 + jitter}" cy="${REEL_Y + REEL_H / 2}" rx="120" ry="90" fill="url(#winglow)" class="win"/>
<g clip-path="url(#reelclip)"><g class="reelwrap"><g class="reel">
${reelCards}
</g></g>
<rect x="20" y="${REEL_Y}" width="180" height="${REEL_H}" fill="url(#fadeL)"/>
<rect x="${W - 200}" y="${REEL_Y}" width="180" height="${REEL_H}" fill="url(#fadeR)"/>
</g>
<rect x="${winnerX - 3}" y="${REEL_Y + 5}" width="${CARD_W + 6}" height="${REEL_H - 10}" rx="6" fill="none" stroke="#e4ae39" stroke-width="2.5" class="win"/>
<path d="M${W / 2} ${REEL_Y + 4}V${REEL_Y + REEL_H - 4}" stroke="#e4ae39" stroke-width="2"/>
<path d="M${W / 2 - 8} ${REEL_Y}H${W / 2 + 8}L${W / 2} ${REEL_Y + 10}Z" fill="#e4ae39"/>
<path d="M${W / 2 - 8} ${REEL_Y + REEL_H}H${W / 2 + 8}L${W / 2} ${REEL_Y + REEL_H - 10}Z" fill="#e4ae39"/>
<text x="${W / 2}" y="${REEL_Y + REEL_H + 40}" text-anchor="middle" class="opening">OPENING CASE…</text>
<g class="win">
<text x="${W / 2}" y="${REEL_Y + REEL_H + 32}" text-anchor="middle" class="reveal">${esc(knife ? `${knife.weapon} | ${knife.skill}` : '')}</text>
<text x="${W / 2}" y="${REEL_Y + REEL_H + 50}" text-anchor="middle" class="revealsub">MAIN STACK</text>
</g>
${grid}`;

  return svg(W, H, `The technologies ${config.name} works with, as an inventory of weapon skins`, defs + icons.defs(), style, body);
}
