// Shared drawing helpers for the profile SVGs. Everything is inline SVG + CSS animation:
// GitHub shows README images as <img>, which can't run scripts or load other files.

export const HUD = "Bahnschrift, 'DIN Alternate', 'Roboto Condensed', 'Arial Narrow', 'Segoe UI', sans-serif";
export const FONT = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

// CS-flavoured palette (original values, not game assets).
export const C = {
  ct: '#6f9ce6',
  ctText: '#b8d2f5',
  t: '#e3b04b',
  tText: '#f1d496',
  red: '#e0473e',
  money: '#a8e27c',
  white: '#f2f4f7',
  dim: '#9aa5b1',
  panel: '#0d1117',
  line: 'rgba(255,255,255,0.08)',
};

// Item rarities, lowest to highest.
export const RARITY = {
  consumer: { name: 'Consumer Grade', color: '#b0c3d9' },
  industrial: { name: 'Industrial Grade', color: '#5e98d9' },
  milspec: { name: 'Mil-Spec', color: '#4b69ff' },
  restricted: { name: 'Restricted', color: '#8847ff' },
  classified: { name: 'Classified', color: '#d32ce6' },
  covert: { name: 'Covert', color: '#eb4b4b' },
  gold: { name: '★ Rare Special Item', color: '#e4ae39' },
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const r1 = (n) => Math.round(n * 10) / 10;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Seeded randomness, so a drawing only changes (and gets committed) when its data does.
export function seeded(text) {
  let h = 1779033703;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353) ^ (h >>> 13);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// A smooth curve through points (Catmull-Rom as cubic Béziers).
export function smooth(points) {
  let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1] || points[i];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[i + 2] || points[i + 1];
    d += `C${r1(x1 + (x2 - x0) / 6)} ${r1(y1 + (y2 - y0) / 6)} ${r1(x2 - (x3 - x1) / 6)} ${r1(y2 - (y3 - y1) / 6)} ${r1(x2)} ${r1(y2)}`;
  }
  return d;
}

// Rough rendered width of text, for laying out chips and pills.
export const textWidth = (text, size, factor = 0.56) => String(text).length * size * factor;

export const frame = (w, h, radius = 14) => `<clipPath id="frame"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>`;
export const REDUCED = '@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }';

export function svg(w, h, label, defs, style, body, radius = 14) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<defs>
${frame(w, h, radius)}
${defs}
</defs>
<style>
${style}
${REDUCED}
</style>
<g clip-path="url(#frame)">
${body}
</g>
</svg>
`;
}

// The weapon icon (from icons/) for each stack item, by ring and position: a bit of fun,
// not a claim about the tech.
const LOADOUT = {
  core: [['AK-47', 'ak47'], ['AWP', 'awp'], ['M4A1-S', 'm4a1_silencer'], ['Desert Eagle', 'deagle'], ['M4A4', 'm4a1'], ['SSG 08', 'ssg08'], ['AUG', 'aug'], ['USP-S', 'usp_silencer'], ['Galil AR', 'galilar'], ['FAMAS', 'famas']],
  cloud: [['MP9', 'mp9'], ['MAC-10', 'mac10'], ['P90', 'p90'], ['UMP-45', 'ump45'], ['Glock-18', 'glock'], ['P250', 'p250'], ['MP7', 'mp7'], ['Five-SeveN', 'fiveseven'], ['CZ75-Auto', 'cz75a']],
  exploring: [['Nova', 'nova'], ['XM1014', 'xm1014'], ['MAG-7', 'mag7'], ['Negev', 'negev'], ['M249', 'm249'], ['Sawed-Off', 'sawedoff']],
};
const RING_RARITY = {
  core: ['covert', 'classified'],
  cloud: ['restricted', 'milspec'],
  exploring: ['industrial', 'consumer'],
};

// Every stack item as a skin: { skill, weapon, icon, rarity }. The configured knife is gold.
export function skins(stack, knife) {
  const out = [];
  for (const ring of ['core', 'cloud', 'exploring']) {
    (stack[ring] || []).forEach((skill, i) => {
      const [weapon, icon] = LOADOUT[ring][i % LOADOUT[ring].length];
      out.push({ skill, weapon, icon, rarity: RING_RARITY[ring][i % 2], ring });
    });
  }
  if (knife) out.push({ skill: knife, weapon: '★ Karambit', icon: 'knife_karambit', rarity: 'gold', ring: 'knife' });
  return out;
}

// The weapon shown for a repo, by its language.
const BY_LANGUAGE = { TypeScript: 'ak47', JavaScript: 'm4a1_silencer', Python: 'awp', Java: 'deagle', 'C++': 'negev', C: 'p250', HTML: 'mp9', CSS: 'mac10', Go: 'aug', Rust: 'ssg08' };
export const weaponFor = (language) => BY_LANGUAGE[language] || 'famas';
