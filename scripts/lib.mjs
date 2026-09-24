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

// The inventory's weapons (icons from icons/): only what drops from cases, so no grenades or
// gear. Each kind of skill has its own class, as in CS2's buy menu; tools get a mix of the
// rest. A bit of fun, not a claim about the tech.
const ARSENAL = {
  languages: [['AK-47', 'ak47'], ['M4A1-S', 'm4a1_silencer'], ['AWP', 'awp'], ['M4A4', 'm4a1'], ['AUG', 'aug'], ['SG 553', 'sg556'], ['FAMAS', 'famas'], ['Galil AR', 'galilar'], ['SSG 08', 'ssg08']],
  frameworks: [['Desert Eagle', 'deagle'], ['USP-S', 'usp_silencer'], ['Glock-18', 'glock'], ['P250', 'p250'], ['Five-SeveN', 'fiveseven'], ['CZ75-Auto', 'cz75a'], ['Tec-9', 'tec9'], ['P2000', 'hkp2000'], ['Dual Berettas', 'elite'], ['R8 Revolver', 'revolver']],
  cloud: [['MP9', 'mp9'], ['MAC-10', 'mac10'], ['P90', 'p90'], ['UMP-45', 'ump45'], ['MP7', 'mp7'], ['MP5-SD', 'mp5sd'], ['PP-Bizon', 'bizon']],
  data: [['Nova', 'nova'], ['XM1014', 'xm1014'], ['MAG-7', 'mag7'], ['Sawed-Off', 'sawedoff'], ['Negev', 'negev'], ['M249', 'm249']],
  tools: [['SCAR-20', 'scar20'], ['G3SG1', 'g3sg1'], ['Dual Berettas', 'elite'], ['PP-Bizon', 'bizon'], ['R8 Revolver', 'revolver'], ['MP5-SD', 'mp5sd'], ['Galil AR', 'galilar'], ['Tec-9', 'tec9'], ['XM1014', 'xm1014'], ['FAMAS', 'famas'], ['P2000', 'hkp2000'], ['MAG-7', 'mag7'], ['CZ75-Auto', 'cz75a'], ['SSG 08', 'ssg08'], ['Five-SeveN', 'fiveseven']],
};
const KNIVES = [['★ Karambit', 'knife_karambit'], ['★ Butterfly Knife', 'knife_butterfly'], ['★ M9 Bayonet', 'knife_m9_bayonet'], ['★ Skeleton Knife', 'knife_skeleton']];

// Which class a Skills section category (by its title) belongs to.
const kindOf = (title) =>
  /language/i.test(title) ? 'languages' : /framework|librar/i.test(title) ? 'frameworks' : /cloud|devops|infra/i.test(title) ? 'cloud' : /data|storage/i.test(title) ? 'data' : 'tools';
const KIND_NAMES = { languages: 'Languages', frameworks: 'Frameworks', cloud: 'Cloud & DevOps', data: 'Databases', tools: 'Tools' };
// Stack items the Skills section doesn't list: languages here, anything else counts as a framework.
const LANGUAGES = new Set(['rust', 'go', 'c', 'csharp', 'kotlin', 'swift', 'ruby', 'scala', 'php', 'java', 'python', 'typescript', 'javascript', 'cpp']);

// Names compared loosely, so "Tailwind CSS" is "Tailwind", "HTML5" is "HTML" and "React.js" is "React".
export const skillKey = (name) =>
  String(name)
    .toLowerCase()
    .replace(/c\+\+/g, 'cpp')
    .replace(/c#/g, 'csharp')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/^(html|css)\d$/, '$1')
    .replace(/^(react|vue)js$/, '$1')
    .replace(/^tailwindcss$/, 'tailwind')
    .replace(/^oauth\d*$/, 'oauth');

// How central a skill is sets its rarity: my core stack is covert and classified, the cloud
// ring restricted and mil-spec, the rest of my resume mil-spec and industrial, and what I'm
// still exploring industrial and consumer.
const TIERS = { core: ['covert', 'classified'], cloud: ['restricted', 'milspec'], resume: ['milspec', 'industrial'], exploring: ['industrial', 'consumer'] };

// Markup and config files GitHub counts as languages, which don't earn a knife.
const NOT_CODE = new Set(['HTML', 'CSS', 'SCSS', 'Less', 'Dockerfile', 'Makefile', 'Shell', 'Batchfile', 'PowerShell', 'HCL', 'Procfile', 'Handlebars', 'EJS', 'Jupyter Notebook']);

// My knives: the languages I write the most code in, going by my repos (at least 10% of it,
// and in more than one repo, so one big project can't earn one alone).
export function knifeLanguages(allLanguages) {
  return allLanguages.filter((l) => !NOT_CODE.has(l.name) && l.repos >= 2 && l.share >= 0.1).slice(0, KNIVES.length);
}

// Every skill as a skin: { skill, weapon, icon, rarity, kind, knife? }. The knives come
// first, then the Skills section (my resume) and my configured stack, each skill once.
export function skins(stack, skillSections, allLanguages) {
  const ring = new Map();
  for (const name of ['core', 'cloud', 'exploring']) for (const skill of stack[name] || []) ring.set(skillKey(skill), name);
  const out = [];
  const seen = new Set();
  knifeLanguages(allLanguages).forEach((l, i) => {
    const [weapon, icon] = KNIVES[i];
    seen.add(skillKey(l.name));
    out.push({ skill: l.name, weapon, icon, rarity: 'gold', kind: 'languages', knife: l });
  });
  // Weapons take turns within each class, rarities within each ring.
  const count = (counts, key) => (counts[key] = (counts[key] || 0) + 1) - 1;
  const byKind = {};
  const byRing = {};
  const add = (skill, kind) => {
    const key = skillKey(skill);
    if (seen.has(key)) return;
    seen.add(key);
    const tier = ring.get(key) || 'resume';
    const [weapon, icon] = ARSENAL[kind][count(byKind, kind) % ARSENAL[kind].length];
    out.push({ skill, weapon, icon, rarity: TIERS[tier][count(byRing, tier) % 2], kind });
  };
  for (const section of skillSections) for (const skill of section.items) add(skill, kindOf(section.title));
  for (const name of ['core', 'cloud', 'exploring']) for (const skill of stack[name] || []) add(skill, LANGUAGES.has(skillKey(skill)) ? 'languages' : name === 'cloud' ? 'cloud' : 'frameworks');
  return out;
}
export const kindName = (kind) => KIND_NAMES[kind];

// CS2 Premier's rating bands and colours, from the game's own panorama/styles/rating_emblem.css
// (color-csrating-tier-0 to -6): a new band every 5,000, gold from 30,000.
export const PREMIER = [
  { name: 'Grey', color: '#b0c3d9' },
  { name: 'Light Blue', color: '#8cc6ff' },
  { name: 'Blue', color: '#6a7dff' },
  { name: 'Purple', color: '#c166ff' },
  { name: 'Pink', color: '#f03cff' },
  { name: 'Red', color: '#eb4b4b' },
  { name: 'Gold', color: '#ffd700' },
];
// My contributions over the last year as a CS Rating: ten points for each.
export const RATING_PER_CONTRIBUTION = 10;
export function premier(contributions) {
  const rating = contributions * RATING_PER_CONTRIBUTION;
  const tier = Math.max(0, Math.min(Math.floor(rating / 5000), PREMIER.length - 1));
  const next = tier < PREMIER.length - 1 ? (tier + 1) * 5000 : null;
  return {
    rating,
    tier,
    ...PREMIER[tier],
    next: next && { at: next, name: PREMIER[tier + 1].name, color: PREMIER[tier + 1].color, contributions: Math.ceil((next - rating) / RATING_PER_CONTRIBUTION) },
    // How far through this band, 0 to 1 (gold has no ceiling).
    progress: next ? (rating - tier * 5000) / 5000 : 1,
  };
}

// The weapon shown for a repo, by its language.
const BY_LANGUAGE = { TypeScript: 'ak47', JavaScript: 'm4a1_silencer', Python: 'awp', Java: 'deagle', 'C++': 'negev', C: 'p250', HTML: 'mp9', CSS: 'mac10', Go: 'aug', Rust: 'ssg08' };
export const weaponFor = (language) => BY_LANGUAGE[language] || 'famas';
